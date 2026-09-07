from django.db import models


class ActeMedical(models.Model):
    class Categorie(models.TextChoices):
        CONSULTATION = "consultation", "Consultation"
        SOIN_CONSERVATEUR = "soin_conservateur", "Soin conservateur (détartrage, carie...)"
        ENDODONTIE = "endodontie", "Endodontie (dévitalisation)"
        CHIRURGIE = "chirurgie", "Chirurgie / extraction"
        PROTHESE = "prothese", "Prothèse dentaire"
        ORTHODONTIE = "orthodontie", "Orthodontie"
        RADIOGRAPHIE = "radiographie", "Radiographie / imagerie"
        AUTRE = "autre", "Autre"

    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=30, choices=Categorie.choices, default=Categorie.AUTRE)
    tarif = models.PositiveIntegerField(help_text="Tarif en francs guinéens (GNF).")
    duree_estimee_minutes = models.PositiveIntegerField(default=30)

    actif = models.BooleanField(default=True, help_text="Un acte désactivé n'apparaît plus dans les nouvelles sélections.")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["categorie", "nom"]

    def __str__(self):
        return f"{self.code} — {self.nom} ({self.tarif} GNF)"