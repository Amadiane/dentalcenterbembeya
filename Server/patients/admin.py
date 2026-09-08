from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["numero_dossier", "nom", "prenom", "telephone", "praticien_referent", "actif"]
    search_fields = ["numero_dossier", "nom", "prenom", "telephone"]
    list_filter = ["praticien_referent", "sexe", "actif"]
    actions = ["archiver_les_dossiers"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Archiver les dossiers sélectionnés (au lieu de les supprimer)")
    def archiver_les_dossiers(self, request, queryset):
        queryset.update(actif=False)
        self.message_user(request, f"{queryset.count()} dossier(s) archivé(s).")