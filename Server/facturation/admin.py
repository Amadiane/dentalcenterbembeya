from django.contrib import admin
from utilisateurs.models import Utilisateur
from .models import Facture, LigneFacture, Paiement


class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 1
    readonly_fields = ["nom_acte", "prix_unitaire"]


class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0
    readonly_fields = ["date_creation", "enregistre_par"]

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

    @admin.display(description="Total facturé")
    def affichage_total(self, obj):
        return f"{obj.montant_total:,} GNF".replace(",", " ")

    @admin.display(description="Total payé")
    def affichage_paye(self, obj):
        return f"{obj.montant_paye:,} GNF".replace(",", " ")

    @admin.display(description="Reste à payer")
    def affichage_restant(self, obj):
        return f"{obj.montant_restant:,} GNF".replace(",", " ")

    def get_readonly_fields(self, request, obj=None):
        champs_readonly = ["numero_facture", "cree_par", "affichage_total", "affichage_paye", "affichage_restant", "date_creation", "date_modification"]
        # La remise globale reste modifiable uniquement par l'administrateur général
        if request.user.role != Utilisateur.Role.ADMINISTRATEUR_GENERAL:
            champs_readonly += ["remise_globale_pourcentage", "motif_remise"]
        return champs_readonly

    def get_fields(self, request, obj=None):
        return [
            "numero_facture", "patient", "date_emission", "statut", "notes",
            "remise_globale_pourcentage", "motif_remise",
            "affichage_total", "affichage_paye", "affichage_restant",
            "cree_par", "date_creation", "date_modification",
        ]

    def save_model(self, request, obj, form, change):
        if not change and not obj.cree_par_id:
            obj.cree_par = request.user
        super().save_model(request, obj, form, change)