from django.db import models
from django.utils import timezone
from patients.models import Patient
from actes.models import ActeMedical
from utilisateurs.models import Utilisateur


class Facture(models.Model):
    class Statut(models.TextChoices):
        IMPAYEE = "impayee", "Impayée"
        PARTIELLEMENT_PAYEE = "partiellement_payee", "Partiellement payée"
        PAYEE = "payee", "Payée"
        ANNULEE = "annulee", "Annulée"

    numero_facture = models.CharField(max_length=25, unique=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="factures")
    date_emission = models.DateField(default=timezone.now)
    statut = models.CharField(max_length=25, choices=Statut.choices, default=Statut.IMPAYEE)
    notes = models.TextField(blank=True)

    remise_globale_pourcentage = models.PositiveIntegerField(
        default=0, help_text="Remise en pourcentage appliquée sur le total de la facture (0 à 100)."
    )
    motif_remise = models.CharField(
        max_length=255, blank=True, help_text="Raison de la remise, pour la traçabilité."
    )

    cree_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="factures_creees"
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_emission", "-id"]

    def __str__(self):
        return f"{self.numero_facture} — {self.patient}"

    def save(self, *args, **kwargs):
        if not self.numero_facture:
            annee = str(timezone.now().year)[-2:]
            dernier = Facture.objects.filter(numero_facture__endswith=f"-{annee}").count()
            self.numero_facture = f"CDB-FAC-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)

    @property
    def montant_avant_remise_globale(self):
        return sum(ligne.sous_total for ligne in self.lignes.all())

    @property
    def montant_total(self):
        brut = self.montant_avant_remise_globale
        return round(brut * (100 - self.remise_globale_pourcentage) / 100)

    @property
    def montant_paye(self):
        return sum(p.montant for p in self.paiements.all())

    @property
    def montant_restant(self):
        return self.montant_total - self.montant_paye

    def recalculer_statut(self):
        if self.statut == Facture.Statut.ANNULEE:
            return
        total = self.montant_total
        paye = self.montant_paye
        if paye <= 0:
            self.statut = Facture.Statut.IMPAYEE
        elif paye < total:
            self.statut = Facture.Statut.PARTIELLEMENT_PAYEE
        else:
            self.statut = Facture.Statut.PAYEE
        self.save(update_fields=["statut"])


class LigneFacture(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name="lignes")
    acte = models.ForeignKey(ActeMedical, on_delete=models.PROTECT, related_name="lignes_facture")

    nom_acte = models.CharField(max_length=150)
    prix_unitaire = models.PositiveIntegerField()
    quantite = models.PositiveIntegerField(default=1)
    remise_pourcentage = models.PositiveIntegerField(
        default=0, help_text="Remise en pourcentage sur cette ligne (0 à 100)."
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.nom_acte} x{self.quantite}"

    @property
    def sous_total(self):
        montant_brut = self.prix_unitaire * self.quantite
        return round(montant_brut * (100 - self.remise_pourcentage) / 100)

    def save(self, *args, **kwargs):
        if not self.nom_acte:
            self.nom_acte = self.acte.nom
        if not self.prix_unitaire:
            self.prix_unitaire = self.acte.tarif
        super().save(*args, **kwargs)


class Paiement(models.Model):
    class ModePaiement(models.TextChoices):
        ESPECES = "especes", "Espèces"
        ORANGE_MONEY = "orange_money", "Orange Money"
        MTN_MONEY = "mtn_money", "MTN Money"
        CARTE = "carte", "Carte bancaire"
        VIREMENT = "virement", "Virement"

    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name="paiements")
    montant = models.PositiveIntegerField()
    mode_paiement = models.CharField(max_length=20, choices=ModePaiement.choices)
    reference = models.CharField(max_length=100, blank=True, help_text="Numéro de transaction, si applicable.")
    date_paiement = models.DateField(default=timezone.now)

    enregistre_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="paiements_enregistres"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_paiement", "-id"]

    def __str__(self):
        return f"{self.montant} GNF — {self.get_mode_paiement_display()}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.facture.recalculer_statut()