from django.contrib import admin
from .models import Radiographie


@admin.register(Radiographie)
class RadiographieAdmin(admin.ModelAdmin):
    list_display = ["patient", "type_cliche", "date_cliche", "dent_concernee", "praticien", "actif"]
    list_filter = ["type_cliche", "actif"]
    search_fields = ["patient__nom", "patient__prenom", "dent_concernee"]
    actions = ["archiver_les_clichés"]

    def has_delete_permission(self, request, obj=None):
        """Empêche toute suppression réelle depuis l'admin, même par un superutilisateur —
        cohérent avec le reste de l'application : on archive, on ne supprime jamais."""
        return False

    @admin.action(description="Archiver les clichés sélectionnés (au lieu de les supprimer)")
    def archiver_les_clichés(self, request, queryset):
        queryset.update(actif=False)
        self.message_user(request, f"{queryset.count()} cliché(s) archivé(s).")