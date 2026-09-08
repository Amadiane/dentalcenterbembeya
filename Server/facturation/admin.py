from django.contrib import admin
from .models import Facture, LigneFacture, Paiement


class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 1
    readonly_fields = ["nom_acte", "prix_unitaire"]

    def has_delete_permission(self, request, obj=None):
        return False


class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0
    readonly_fields = ["date_creation", "enregistre_par"]

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if not obj.enregistre_par_id:
            obj.enregistre_par = request.user
        super().save_model(request, obj, form, change)


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ["numero_facture", "patient", "date_emission", "statut", "affichage_total", "affichage_paye", "affichage_restant"]
    list_filter = ["statut", "date_emission"]
    search_fields = ["numero_facture", "patient__nom", "patient__prenom"]
    inlines = [LigneFactureInline, PaiementInline]
    actions = ["annuler_les_factures"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Total facturé")
    def affichage_total(self, obj):
        return f"{obj.montant_total:,} GNF".replace(",", " ")

    @admin.display(description="Total payé")
    def affichage_paye(self, obj):
        return f"{obj.montant_paye:,} GNF".replace(",", " ")

    @admin.display(description="Reste à payer")
    def affichage_restant(self, obj):
        return f"{obj.montant_restant:,} GNF".replace(",", " ")

    @admin.action(description="Annuler les factures sélectionnées (au lieu de les supprimer)")
    def annuler_les_factures(self, request, queryset):
        queryset.update(statut=Facture.Statut.ANNULEE)
        self.message_user(request, f"{queryset.count()} facture(s) annulée(s).")

    def save_model(self, request, obj, form, change):
        if not change and not obj.cree_par_id:
            obj.cree_par = request.user
        super().save_model(request, obj, form, change)