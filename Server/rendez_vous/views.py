from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from auditlog.context import set_actor

from .models import RendezVous
from .serializers import RendezVousSerializer, EntreeJournalRdvSerializer
from .permissions import PeutGererRendezVous, PeutModifierRendezVous


class RendezVousViewSet(viewsets.ModelViewSet):
    serializer_class = RendezVousSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = RendezVous.objects.select_related("patient", "praticien")

        statut = self.request.query_params.get("statut")
        inclure_annules = self.request.query_params.get("inclure_annules")
        if statut:
            queryset = queryset.filter(statut=statut)
        elif not inclure_annules:
            queryset = queryset.exclude(statut=RendezVous.Statut.ANNULE)

        date = self.request.query_params.get("date")
        date_debut = self.request.query_params.get("date_debut")
        date_fin = self.request.query_params.get("date_fin")
        if date_debut and date_fin:
            queryset = queryset.filter(date__range=[date_debut, date_fin])
        elif date:
            queryset = queryset.filter(date=date)

        praticien_id = self.request.query_params.get("praticien")
        if praticien_id:
            queryset = queryset.filter(praticien_id=praticien_id)

        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return queryset

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), PeutGererRendezVous()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), PeutGererRendezVous(), PeutModifierRendezVous()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        """Annulation plutôt que suppression — même principe que pour les patients."""
        with set_actor(self.request.user):
            instance.statut = RendezVous.Statut.ANNULE
            instance.save(update_fields=["statut"])

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        rdv = self.get_object()
        content_type = ContentType.objects.get_for_model(RendezVous)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(rdv.pk)
        ).select_related("actor").order_by("-timestamp")
        return Response(EntreeJournalRdvSerializer(entrees, many=True).data)