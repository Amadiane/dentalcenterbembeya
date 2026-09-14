from django.db import models
from django.utils import timezone
from patients.models import Patient
from actes.models import ActeMedical
from utilisateurs.models import Utilisateur


class PlanTraitement(models.Model):
    class Statut(models.TextChoices):
        EN_COURS = "en_cours", "En cours"
        TERMINE = "termine", "Terminé"
        ABANDONNE = "abandonne", "Abandonné"

    numero_plan = models.CharField(max_length=25, unique=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="plans_traitement")
    praticien = models.ForeignKey(
        Utilisateur, on_delete=models.PROTECT, related_name="plans_traitement",
        limit_choices_to={"role__in": [Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]},
    )

    date_creation_plan = models.DateField(default=timezone.now)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS)
    diagnostic = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_creation_plan", "-id"]

    def __str__(self):
        return f"{self.numero_plan} — {self.patient}"

    def save(self, *args, **kwargs):
        if not self.numero_plan:
            annee = str(timezone.now().year)[-2:]
            dernier = PlanTraitement.objects.filter(numero_plan__endswith=f"-{annee}").count()
            self.numero_plan = f"CDB-PLAN-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)

    @property
    def progression(self):
        total = self.lignes.count()
        if total == 0:
            return 0
        realisees = self.lignes.filter(realise=True).count()
        return round((realisees / total) * 100)


class LignePlanTraitement(models.Model):
    plan = models.ForeignKey(PlanTraitement, on_delete=models.CASCADE, related_name="lignes")
    acte = models.ForeignKey(ActeMedical, on_delete=models.PROTECT, related_name="lignes_plan_traitement")

    nom_acte = models.CharField(max_length=150, blank=True)
    dent_concernee = models.CharField(max_length=50, blank=True)
    ordre = models.PositiveIntegerField(default=0)
    realise = models.BooleanField(default=False)
    date_realisation = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["ordre", "id"]

    def __str__(self):
        return f"{self.nom_acte} — {self.plan}"

    def save(self, *args, **kwargs):
        if not self.nom_acte:
            self.nom_acte = self.acte.nom
        super().save(*args, **kwargs)