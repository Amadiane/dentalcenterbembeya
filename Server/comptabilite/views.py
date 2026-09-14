from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from auditlog.context import set_actor

from facturation.models import Facture
from .models import Depense
from .serializers import DepenseSerializer
from .permissions import EstAdministrateurGeneral


class DepenseViewSet(viewsets.ModelViewSet):
    serializer_class = DepenseSerializer
    permission_classes = [permissions.IsAuthenticated, EstAdministrateurGeneral]

    def get_queryset(self):
        queryset = Depense.objects.filter(actif=True).select_related("enregistre_par")

        annee = self.request.query_params.get("annee")
        mois = self.request.query_params.get("mois")
        if annee:
            queryset = queryset.filter(date_depense__year=annee)
        if mois:
            queryset = queryset.filter(date_depense__month=mois)

        categorie = self.request.query_params.get("categorie")
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        return queryset

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.actif = False
            instance.save(update_fields=["actif"])


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, EstAdministrateurGeneral])
def synthese_mensuelle(request):
    """
    GET /api/comptabilite/synthese/?annee=2026&mois=9
    Retourne recettes (factures émises, hors annulées), dépenses, et le solde net pour la période.
    """
    annee = request.query_params.get("annee", timezone.now().year)
    mois = request.query_params.get("mois")

    factures = Facture.objects.exclude(statut=Facture.Statut.ANNULEE).filter(date_emission__year=annee)
    depenses = Depense.objects.filter(actif=True, date_depense__year=annee)
    if mois:
        factures = factures.filter(date_emission__month=mois)
        depenses = depenses.filter(date_depense__month=mois)

    total_recettes = sum(f.montant_total for f in factures)
    total_depenses = depenses.aggregate(total=Sum("montant"))["total"] or 0

    depenses_par_categorie = list(
        depenses.values("categorie").annotate(total=Sum("montant")).order_by("-total")
    )

    return Response({
        "periode": {"annee": int(annee), "mois": int(mois) if mois else None},
        "total_recettes": total_recettes,
        "total_depenses": total_depenses,
        "solde_net": total_recettes - total_depenses,
        "nombre_factures": factures.count(),
        "nombre_depenses": depenses.count(),
        "depenses_par_categorie": depenses_par_categorie,
    })