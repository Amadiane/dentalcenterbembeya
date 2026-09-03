from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ["username", "first_name", "last_name", "role", "actif", "is_staff"]
    list_filter = ["role", "actif"]
    fieldsets = UserAdmin.fieldsets + (
        ("Informations du cabinet", {"fields": ("role", "telephone", "actif")}),
    )