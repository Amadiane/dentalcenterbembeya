from rest_framework import viewsets, permissions
from .models import Patient
from .serializers import PatientSerializer
from .permissions import PeutCreerPatient, EstAdministrateurGeneral

from django.template.loader import render_to_string
from django.http import HttpResponse
from rest_framework.decorators import action
from xhtml2pdf import pisa
from .permissions import ROLES_ACCES_CLINIQUE

import os
from django.conf import settings
from django.contrib.staticfiles import finders

from utilisateurs.models import Utilisateur

ROLES_MEDECINS = {Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN}

def link_callback(uri, rel):
    """Traduit les chemins {% static %} du template en chemins réels sur le disque, pour xhtml2pdf."""
    if uri.startswith(settings.STATIC_URL):
        chemin = uri.replace(settings.STATIC_URL, "")
        resultat = finders.find(chemin)
        if resultat:
            return resultat
    return uri


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(actif=True)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), PeutCreerPatient()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), EstAdministrateurGeneral()]
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        """Archivage plutôt que suppression réelle — traçabilité médicale obligatoire."""
        instance.actif = False
        instance.save(update_fields=["actif"])

    def perform_create(self, serializer):
        patient = serializer.save()
        self._assigner_referent_si_absent(patient)

    def perform_update(self, serializer):
        patient = serializer.save()
        self._assigner_referent_si_absent(patient)

    def _assigner_referent_si_absent(self, patient):
        """Le premier médecin (chef ou non) qui crée/modifie un dossier en devient le référent,
        s'il n'y en a pas déjà un. Aucune action pour les autres rôles."""
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
        response["Content-Disposition"] = f'attachment; filename="{patient.numero_dossier}.pdf"'
        pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        return response