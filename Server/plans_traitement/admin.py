from django.contrib import admin
from .models import PlanTraitement, LignePlanTraitement


class LignePlanTraitementInline(admin.TabularInline):
    model = LignePlanTraitement
    extra = 1
    readonly_fields = ["nom_acte"]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PlanTraitement)
class PlanTraitementAdmin(admin.ModelAdmin):
    list_display = ["numero_plan", "patient", "praticien", "date_creation_plan", "statut"]
    list_filter = ["statut", "praticien"]
    search_fields = ["numero_plan", "patient__nom", "patient__prenom"]
    inlines = [LignePlanTraitementInline]

    def has_delete_permission(self, request, obj=None):
        return False

    actions = ["abandonner_les_plans"]

    @admin.action(description="Marquer les plans sélectionnés comme abandonnés (au lieu de les supprimer)")
    def abandonner_les_plans(self, request, queryset):
        queryset.update(statut=PlanTraitement.Statut.ABANDONNE)
        self.message_user(request, f"{queryset.count()} plan(s) marqué(s) comme abandonné(s).")