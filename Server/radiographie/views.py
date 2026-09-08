from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from auditlog.context import set_actor

from .models import Radiographie
from .serializers import RadiographieSerializer, EntreeJournalRadioSerializer
from .permissions import PeutGererRadiographie


class RadiographieViewSet(viewsets.ModelViewSet):
    serializer_class = RadiographieSerializer
    permission_classes = [permissions.IsAuthenticated, PeutGererRadiographie]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        queryset = Radiographie.objects.filter(actif=True).select_related("patient", "praticien")

        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        type_cliche = self.request.query_params.get("type_cliche")
        if type_cliche:
            queryset = queryset.filter(type_cliche=type_cliche)

        return queryset

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(praticien=self.request.user if self.request.user.role in
                             ["medecin_chef", "medecin"] else None)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.actif = False
            instance.save(update_fields=["actif"])

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        radio = self.get_object()
        content_type = ContentType.objects.get_for_model(Radiographie)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(radio.pk)
        ).select_related("actor").order_by("-timestamp")
        return Response(EntreeJournalRadioSerializer(entrees, many=True).data)