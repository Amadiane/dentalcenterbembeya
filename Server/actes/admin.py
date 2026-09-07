from django.contrib import admin
from .models import ActeMedical


@admin.register(ActeMedical)
class ActeMedicalAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "categorie", "tarif", "duree_estimee_minutes", "actif"]
    list_filter = ["categorie", "actif"]
    search_fields = ["code", "nom"]