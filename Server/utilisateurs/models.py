from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    """Utilisateur du système du Centre Dentaire Bembeya."""

    class Role(models.TextChoices):
        ADMINISTRATEUR_GENERAL = "administrateur_general", "Administrateur général"
        MEDECIN_CHEF = "medecin_chef", "Médecin chef"
        MEDECIN = "medecin", "Médecin"
        INFIRMIER = "infirmier", "Infirmier"
        ACCUEIL_RECEPTIONNISTE = "accueil_receptionniste", "Accueil réceptionniste"
        HYGIENISTE = "hygieniste", "Hygiéniste"

    role = models.CharField(max_length=30, choices=Role.choices, default=Role.ACCUEIL_RECEPTIONNISTE)
    telephone = models.CharField(max_length=30, blank=True)
    actif = models.BooleanField(
        default=True,
        help_text="Un compte désactivé ne peut plus se connecter au système.",
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"