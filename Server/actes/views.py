from rest_framework import viewsets, permissions
from auditlog.context import set_actor

from .models import ActeMedical
from .serializers import ActeMedicalSerializer
from .permissions import PeutGererCatalogueActes


class ActeMedicalViewSet(viewsets.ModelViewSet):
    serializer_class = ActeMedicalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ActeMedical.objects.all()

        # Par défaut, seuls les actes actifs (une facture ou un rdv ne doit pas
        # proposer un acte retiré du catalogue) — sauf demande explicite du contraire
        inclure_inactifs = self.request.query_params.get("inclure_inactifs")
        if not inclure_inactifs:
            queryset = queryset.filter(actif=True)

        categorie = self.request.query_params.get("categorie")
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        recherche = self.request.query_params.get("search")
        if recherche:
            queryset = queryset.filter(nom__icontains=recherche) | queryset.filter(code__icontains=recherche)

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), PeutGererCatalogueActes()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        """Désactivation plutôt que suppression — un acte déjà utilisé dans une
        facture/un rendez-vous ne doit jamais disparaître de la base."""
        with set_actor(self.request.user):
            instance.actif = False
            instance.save(update_fields=["actif"])