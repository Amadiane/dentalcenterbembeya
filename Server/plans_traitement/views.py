from rest_framework import viewsets, permissions
from auditlog.context import set_actor

from .models import PlanTraitement
from .serializers import PlanTraitementSerializer
from .permissions import PeutGererPlanTraitement


class PlanTraitementViewSet(viewsets.ModelViewSet):
    serializer_class = PlanTraitementSerializer
    permission_classes = [permissions.IsAuthenticated, PeutGererPlanTraitement]

    def get_queryset(self):
        queryset = PlanTraitement.objects.select_related("patient", "praticien").prefetch_related("lignes")

        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)

        return queryset

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        """Abandon plutôt que suppression — même principe que partout ailleurs."""
        with set_actor(self.request.user):
            instance.statut = PlanTraitement.Statut.ABANDONNE
            instance.save(update_fields=["statut"])