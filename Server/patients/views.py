from django.conf import settings
from django.contrib.staticfiles import finders
from django.contrib.contenttypes.models import ContentType
from django.template.loader import render_to_string
from django.http import HttpResponse

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from xhtml2pdf import pisa
from auditlog.models import LogEntry
from auditlog.context import set_actor
from utilisateurs.models import Utilisateur

from .models import Patient
from .serializers import PatientSerializer, EntreeJournalSerializer
from .permissions import PeutCreerPatient, EstAdministrateurGeneral, ROLES_ACCES_CLINIQUE

ROLES_MEDECINS = {Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN}


def link_callback(uri, rel):
    if uri.startswith(settings.STATIC_URL):
        chemin = uri.replace(settings.STATIC_URL, "")
        resultat = finders.find(chemin)
        if resultat:
            return resultat
    return uri


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["nom", "prenom", "numero_dossier", "telephone"]

    def get_queryset(self):
        queryset = Patient.objects.filter(actif=True)
        annee = self.request.query_params.get("annee")
        mois = self.request.query_params.get("mois")
        if annee:
            queryset = queryset.filter(date_creation__year=annee)
        if mois:
            queryset = queryset.filter(date_creation__month=mois)
        return queryset

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), PeutCreerPatient()]
        if self.action in ["destroy", "archives", "restaurer", "archiver_periode"]:
            return [permissions.IsAuthenticated(), EstAdministrateurGeneral()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            patient = serializer.save()
            self._assigner_referent_si_absent(patient)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            patient = serializer.save()
            self._assigner_referent_si_absent(patient)

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.actif = False
            instance.save(update_fields=["actif"])

    def _assigner_referent_si_absent(self, patient):
        if patient.praticien_referent is None and self.request.user.role in ROLES_MEDECINS:
            patient.praticien_referent = self.request.user
            patient.save(update_fields=["praticien_referent"])

    @action(detail=True, methods=["get"], url_path="fiche-pdf")
    def fiche_pdf(self, request, pk=None):
        patient = self.get_object()
        html = render_to_string("patients/fiche.html", {
            "patient": patient,
            "acces_clinique": request.user.role in ROLES_ACCES_CLINIQUE,
        })
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{patient.numero_dossier}.pdf"'
        pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        return response

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        patient = self.get_object()
        content_type = ContentType.objects.get_for_model(Patient)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(patient.pk)
        ).select_related("actor").order_by("-timestamp")
        return Response(EntreeJournalSerializer(entrees, many=True).data)

    @action(detail=False, methods=["get"], url_path="archives")
    def archives(self, request):
        patients = Patient.objects.filter(actif=False)
        annee = request.query_params.get("annee")
        mois = request.query_params.get("mois")
        if annee:
            patients = patients.filter(date_creation__year=annee)
        if mois:
            patients = patients.filter(date_creation__month=mois)
        patients = patients.order_by("nom", "prenom")
        return Response(PatientSerializer(patients, many=True, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="restaurer")
    def restaurer(self, request, pk=None):
        patient = Patient.objects.get(pk=pk, actif=False)
        with set_actor(request.user):
            patient.actif = True
            patient.save(update_fields=["actif"])
        return Response(PatientSerializer(patient, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="archiver-periode")
    def archiver_periode(self, request):
        """Archive en masse tous les dossiers actifs d'une année (et éventuellement d'un mois donné)."""
        annee = request.data.get("annee")
        mois = request.data.get("mois")
        if not annee:
            return Response({"detail": "L'année est obligatoire."}, status=400)

        queryset = Patient.objects.filter(actif=True, date_creation__year=annee)
        if mois:
            queryset = queryset.filter(date_creation__month=mois)

        nombre = queryset.count()
        with set_actor(request.user):
            for patient in queryset:
                patient.actif = False
                patient.save(update_fields=["actif"])

        return Response({"nombre_archives": nombre})