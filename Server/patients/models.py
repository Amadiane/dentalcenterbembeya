from django.db import models
from django.utils import timezone
from utilisateurs.models import Utilisateur


class Patient(models.Model):
    class Sexe(models.TextChoices):
        HOMME = "H", "Homme"
        FEMME = "F", "Femme"

    numero_dossier = models.CharField(max_length=20, unique=True, blank=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    age = models.PositiveIntegerField(null=True, blank=True)
    sexe = models.CharField(max_length=1, choices=Sexe.choices, blank=True)
    profession = models.CharField(max_length=150, blank=True)
    adresse = models.CharField(max_length=255, blank=True)

    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)

    motif = models.TextField(blank=True, help_text="Motif de la consultation.")
    diagnostic = models.TextField(blank=True, help_text="Diagnostic posé par le praticien.")
    allergies = models.TextField(blank=True)
    antecedents_medicaux = models.TextField(blank=True)
    soins = models.TextField(blank=True, help_text="Soins réalisés ou prévus.")

    praticien_referent = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="patients_suivis",
    )

    actif = models.BooleanField(default=True, help_text="Un dossier archivé n'apparaît plus dans les listes.")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.numero_dossier} — {self.nom} {self.prenom}"

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            annee = str(timezone.now().year)[-2:]
            dernier = Patient.objects.filter(numero_dossier__endswith=f"-{annee}").count()
            self.numero_dossier = f"CDB-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)