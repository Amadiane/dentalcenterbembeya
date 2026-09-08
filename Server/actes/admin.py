from django.contrib import admin
from .models import ActeMedical


@admin.register(ActeMedical)
class ActeMedicalAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "categorie", "tarif", "duree_estimee_minutes", "actif"]
    list_filter = ["categorie", "actif"]
    search_fields = ["code", "nom"]
    actions = ["archiver_les_actes"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Retirer les actes sélectionnés du catalogue (au lieu de les supprimer)")
    def archiver_les_actes(self, request, queryset):
        queryset.update(actif=False)
        self.message_user(request, f"{queryset.count()} acte(s) retiré(s) du catalogue.")