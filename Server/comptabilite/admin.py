from django.contrib import admin
from .models import Depense


@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display = ["date_depense", "categorie", "description", "montant", "enregistre_par", "actif"]
    list_filter = ["categorie", "actif"]
    search_fields = ["description"]

    def has_delete_permission(self, request, obj=None):
        return False

    actions = ["archiver_les_depenses"]

    @admin.action(description="Archiver les dépenses sélectionnées (au lieu de les supprimer)")
    def archiver_les_depenses(self, request, queryset):
        queryset.update(actif=False)
        self.message_user(request, f"{queryset.count()} dépense(s) archivée(s).")

    def save_model(self, request, obj, form, change):
        if not change and not obj.enregistre_par_id:
            obj.enregistre_par = request.user
        super().save_model(request, obj, form, change)