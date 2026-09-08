from django.db import models
from cloudinary.models import CloudinaryField
from patients.models import Patient
from utilisateurs.models import Utilisateur


class Radiographie(models.Model):
    class TypeCliche(models.TextChoices):
        RETRO_ALVEOLAIRE = "retro_alveolaire", "Rétro-alvéolaire"
        PANORAMIQUE = "panoramique", "Panoramique"
        BITE_WING = "bite_wing", "Bite-wing"
        CBCT_3D = "cbct_3d", "CBCT / 3D"
        AUTRE = "autre", "Autre"

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="radiographies")
    image = CloudinaryField("image", folder="centre-dentaire-bembeya/radiographies")

    type_cliche = models.CharField(max_length=20, choices=TypeCliche.choices, default=TypeCliche.RETRO_ALVEOLAIRE)
    date_cliche = models.DateField(default=None, null=True, blank=True)
    dent_concernee = models.CharField(max_length=50, blank=True, help_text="Ex. 26, 36-37, arcade complète...")
    notes = models.TextField(blank=True)

    praticien = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="radiographies_prises",
        limit_choices_to={"role__in": [Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]},
    )

    actif = models.BooleanField(default=True, help_text="Un cliché retiré n'apparaît plus dans les listes actives.")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_cliche", "-date_creation"]

    def __str__(self):
        return f"{self.get_type_cliche_display()} — {self.patient} ({self.date_cliche or self.date_creation.date()})"