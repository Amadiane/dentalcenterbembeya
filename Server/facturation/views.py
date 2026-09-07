from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor

from .models import Facture, Paiement
from .serializers import PaiementSerializer
from .permissions import PeutGererFacturation, PeutAnnulerFacture

from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
from patients.views import link_callback

from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from .serializers import FactureSerializer, EntreeJournalFactureSerializer


class FactureViewSet(viewsets.ModelViewSet):
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Facture.objects.select_related("patient", "cree_par").prefetch_related("lignes", "paiements")

        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)

        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        recherche = self.request.query_params.get("search")
        if recherche:
            queryset = queryset.filter(numero_facture__icontains=recherche) \
                | queryset.filter(patient__nom__icontains=recherche) \
                | queryset.filter(patient__prenom__icontains=recherche)

        return queryset.distinct()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [permissions.IsAuthenticated(), PeutGererFacturation()]
        if self.action == "annuler":
            return [permissions.IsAuthenticated(), PeutAnnulerFacture()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    @action(detail=True, methods=["post"], url_path="annuler")
    def annuler(self, request, pk=None):
        """Annule une facture — les paiements déjà enregistrés restent visibles pour la traçabilité,
        mais la facture n'est plus comptée comme active."""
        facture = self.get_object()
        with set_actor(request.user):
            facture.statut = Facture.Statut.ANNULEE
            facture.save(update_fields=["statut"])
        return Response(FactureSerializer(facture, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="paiements")
    def ajouter_paiement(self, request, pk=None):
        """Enregistre un nouveau paiement (tranche) sur cette facture."""
        facture = self.get_object()
        serializer = PaiementSerializer(data={**request.data, "facture": facture.id})
        serializer.is_valid(raise_exception=True)
        with set_actor(request.user):
            serializer.save(enregistre_par=request.user)
        return Response(FactureSerializer(facture, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="recu-pdf")
    def recu_pdf(self, request, pk=None):
        facture = self.get_object()
        montant_remise_globale = facture.montant_avant_remise_globale - facture.montant_total
        html = render_to_string("facturation/recu.html", {
            "facture": facture,
            "lignes": facture.lignes.all(),
            "paiements": facture.paiements.all(),
            "montant_remise_globale": montant_remise_globale,
        })
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{facture.numero_facture}.pdf"'
        pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        return response

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        """Regroupe l'historique de la facture ET de ses paiements liés, triés ensemble par date."""
        facture = self.get_object()

        content_type_facture = ContentType.objects.get_for_model(facture.__class__)
        entrees_facture = LogEntry.objects.filter(
            content_type=content_type_facture, object_pk=str(facture.pk)
        )

        content_type_paiement = ContentType.objects.get_for_model(facture.paiements.model)
        ids_paiements = list(facture.paiements.values_list("id", flat=True))
        entrees_paiement = LogEntry.objects.filter(
            content_type=content_type_paiement, object_pk__in=[str(pid) for pid in ids_paiements]
        )

        entrees = (entrees_facture | entrees_paiement).select_related("actor").order_by("-timestamp")
        return Response(EntreeJournalFactureSerializer(entrees, many=True).data)