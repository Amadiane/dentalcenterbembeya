from django.contrib import admin
from .models import RendezVous


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ["date", "heure_debut", "patient", "praticien", "statut"]
    list_filter = ["statut", "praticien", "date"]
    search_fields = ["patient__nom", "patient__prenom"]
    actions = ["annuler_les_rendez_vous"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Annuler les rendez-vous sélectionnés (au lieu de les supprimer)")
    def annuler_les_rendez_vous(self, request, queryset):
        queryset.update(statut=RendezVous.Statut.ANNULE)
        self.message_user(request, f"{queryset.count()} rendez-vous annulé(s).")