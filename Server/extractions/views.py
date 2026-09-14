from rest_framework import viewsets, permissions
from auditlog.context import set_actor

from .models import Extraction
from .serializers import ExtractionSerializer
from .permissions import PeutGererExtraction


class ExtractionViewSet(viewsets.ModelViewSet):
    serializer_class = ExtractionSerializer
    permission_classes = [permissions.IsAuthenticated, PeutGererExtraction]

    def get_queryset(self):
        queryset = Extraction.objects.select_related("patient", "praticien", "plan_traitement")

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
        """Annulation plutôt que suppression."""
        with set_actor(self.request.user):
            instance.statut = Extraction.Statut.ANNULEE
            instance.save(update_fields=["statut"])