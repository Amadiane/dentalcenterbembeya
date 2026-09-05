from datetime import datetime, timedelta
from rest_framework import serializers
from utilisateurs.models import Utilisateur
from .models import RendezVous


class RendezVousSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    praticien_nom = serializers.CharField(source="praticien.get_full_name", read_only=True)
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)
    heure_fin = serializers.SerializerMethodField()

    praticien = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.filter(
            role__in=[Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]
        )
    )

    class Meta:
        model = RendezVous
        fields = [
            "id", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "praticien", "praticien_nom", "date", "heure_debut", "duree_minutes", "heure_fin",
            "motif", "statut", "statut_affiche", "notes", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification"]

    def get_heure_fin(self, obj):
        debut = datetime.combine(obj.date, obj.heure_debut)
        fin = debut + timedelta(minutes=obj.duree_minutes)
        return fin.strftime("%H:%M")