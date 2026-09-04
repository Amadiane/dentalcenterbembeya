from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["numero_dossier", "nom", "prenom", "telephone"]
    search_fields = ["numero_dossier", "nom", "prenom"]