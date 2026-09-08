from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ["username", "first_name", "last_name", "role", "actif", "is_staff"]
    list_filter = ["role", "actif", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (
        ("Informations du cabinet", {"fields": ("role", "telephone", "actif")}),
    )
    actions = ["desactiver_les_comptes"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Désactiver les comptes sélectionnés (au lieu de les supprimer)")
    def desactiver_les_comptes(self, request, queryset):
        queryset.update(actif=False)
        self.message_user(request, f"{queryset.count()} compte(s) désactivé(s).")