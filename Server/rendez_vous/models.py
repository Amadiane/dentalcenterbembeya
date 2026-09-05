from django.db import models
from patients.models import Patient
from utilisateurs.models import Utilisateur


class RendezVous(models.Model):
    class Statut(models.TextChoices):
        PLANIFIE = "planifie", "Planifié"
        CONFIRME = "confirme", "Confirmé"
        TERMINE = "termine", "Terminé"
        ABSENT = "absent", "Patient absent"
        ANNULE = "annule", "Annulé"

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="rendez_vous")
    praticien = models.ForeignKey(
        Utilisateur, on_delete=models.PROTECT, related_name="rendez_vous",
        limit_choices_to={"role__in": [Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]},
    )

    date = models.DateField()
    heure_debut = models.TimeField()
    duree_minutes = models.PositiveIntegerField(default=30)

    motif = models.CharField(max_length=255, blank=True)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.PLANIFIE)
    notes = models.TextField(blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "heure_debut"]

    def __str__(self):
        return f"{self.patient} — {self.date} {self.heure_debut}"