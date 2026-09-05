from django.contrib import admin
from .models import RendezVous


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ["date", "heure_debut", "patient", "praticien", "statut"]
    list_filter = ["statut", "praticien", "date"]
    search_fields = ["patient__nom", "patient__prenom"]