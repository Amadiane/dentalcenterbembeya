from django.db import models
from django.utils import timezone
from patients.models import Patient
from plans_traitement.models import PlanTraitement
from utilisateurs.models import Utilisateur


class Extraction(models.Model):
    class TypeExtraction(models.TextChoices):
        SIMPLE = "simple", "Extraction simple"
        CHIRURGICALE = "chirurgicale", "Extraction chirurgicale"
        DENT_SAGESSE = "dent_sagesse", "Dent de sagesse"
        AUTRE = "autre", "Autre"

    class Statut(models.TextChoices):
        PLANIFIEE = "planifiee", "Planifiée"
        REALISEE = "realisee", "Réalisée"
        ANNULEE = "annulee", "Annulée"

    numero_extraction = models.CharField(max_length=25, unique=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="extractions")
    plan_traitement = models.ForeignKey(
        PlanTraitement, on_delete=models.SET_NULL, null=True, blank=True, related_name="extractions",
        help_text="Optionnel — si cette extraction s'inscrit dans un plan de traitement existant.",
    )
    praticien = models.ForeignKey(
        Utilisateur, on_delete=models.PROTECT, related_name="extractions",
        limit_choices_to={"role__in": [Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]},
    )

    date_intervention = models.DateField(default=timezone.now)
    dent_concernee = models.CharField(max_length=50)
    type_extraction = models.CharField(max_length=20, choices=TypeExtraction.choices, default=TypeExtraction.SIMPLE)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.PLANIFIEE)

    anesthesie = models.CharField(max_length=150, blank=True)

    consentement_obtenu = models.BooleanField(default=False)
    consentement_details = models.TextField(blank=True, help_text="Modalités du consentement (date, informations données au patient...).")

    compte_rendu = models.TextField(blank=True, help_text="Déroulé de l'intervention, complications éventuelles.")
    prescriptions = models.TextField(blank=True, help_text="Ordonnance post-opératoire (antalgiques, consignes...).")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_intervention", "-id"]

    def __str__(self):
        return f"{self.numero_extraction} — {self.patient} (dent {self.dent_concernee})"

    def save(self, *args, **kwargs):
        if not self.numero_extraction:
            annee = str(timezone.now().year)[-2:]
            dernier = Extraction.objects.filter(numero_extraction__endswith=f"-{annee}").count()
            self.numero_extraction = f"CDB-EXT-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)