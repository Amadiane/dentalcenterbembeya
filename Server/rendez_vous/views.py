from rest_framework import viewsets, permissions
from auditlog.context import set_actor

from .models import RendezVous
from .serializers import RendezVousSerializer
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
        if date:
            queryset = queryset.filter(date=date)

        praticien_id = self.request.query_params.get("praticien")
        if praticien_id:
            queryset = queryset.filter(praticien_id=praticien_id)
        
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        recherche = self.request.query_params.get("search")
        if recherche:
            queryset = queryset.filter(
                patient__nom__icontains=recherche
            ) | queryset.filter(
                patient__prenom__icontains=recherche
            ) | queryset.filter(
                patient__numero_dossier__icontains=recherche
            )

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