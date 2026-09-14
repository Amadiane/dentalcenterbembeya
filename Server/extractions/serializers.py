from rest_framework import serializers
from .models import Extraction


class ExtractionSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    praticien_nom = serializers.CharField(source="praticien.get_full_name", read_only=True)
    type_extraction_affiche = serializers.CharField(source="get_type_extraction_display", read_only=True)
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)
    plan_traitement_numero = serializers.SerializerMethodField()

    class Meta:
        model = Extraction
        fields = [
            "id", "numero_extraction", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "plan_traitement", "plan_traitement_numero", "praticien", "praticien_nom",
            "date_intervention", "dent_concernee", "type_extraction", "type_extraction_affiche",
            "statut", "statut_affiche", "anesthesie",
            "consentement_obtenu", "consentement_details", "compte_rendu", "prescriptions",
            "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "numero_extraction", "date_creation", "date_modification"]

    def get_plan_traitement_numero(self, obj):
        if obj.plan_traitement:
            return obj.plan_traitement.numero_plan
        return ""