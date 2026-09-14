from django.db import models
from django.utils import timezone
from utilisateurs.models import Utilisateur


class Depense(models.Model):
    class Categorie(models.TextChoices):
        LOYER = "loyer", "Loyer"
        SALAIRES = "salaires", "Salaires"
        FOURNITURES_MEDICALES = "fournitures_medicales", "Fournitures médicales"
        EQUIPEMENT = "equipement", "Équipement"
        ELECTRICITE_EAU = "electricite_eau", "Électricité / Eau"
        MAINTENANCE = "maintenance", "Maintenance / Réparations"
        AUTRE = "autre", "Autre"

    date_depense = models.DateField(default=timezone.now)
    categorie = models.CharField(max_length=30, choices=Categorie.choices, default=Categorie.AUTRE)
    montant = models.PositiveIntegerField(help_text="Montant en francs guinéens (GNF).")
    description = models.CharField(max_length=255)
    notes = models.TextField(blank=True)

    enregistre_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="depenses_enregistrees"
    )

    actif = models.BooleanField(default=True, help_text="Une dépense retirée n'apparaît plus dans les calculs.")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_depense", "-id"]

    def __str__(self):
        return f"{self.get_categorie_display()} — {self.montant} GNF ({self.date_depense})"