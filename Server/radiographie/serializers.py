from rest_framework import serializers
from .models import Radiographie


class RadiographieSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    praticien_nom = serializers.CharField(source="praticien.get_full_name", read_only=True, default="")
    type_cliche_affiche = serializers.CharField(source="get_type_cliche_display", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Radiographie
        fields = [
            "id", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "image", "image_url", "type_cliche", "type_cliche_affiche",
            "date_cliche", "dent_concernee", "notes",
            "praticien", "praticien_nom", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification"]
        extra_kwargs = {"image": {"write_only": True}}

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


import json
from auditlog.models import LogEntry

LABELS_CHAMPS_RADIO = {
    "type_cliche": "Type de cliché",
    "dent_concernee": "Dent(s) concernée(s)",
    "date_cliche": "Date du cliché",
    "notes": "Notes",
    "actif": "Statut",
}
CHAMPS_IGNORES_RADIO = {"date_creation", "date_modification", "id", "image"}


class EntreeJournalRadioSerializer(serializers.ModelSerializer):
    auteur = serializers.SerializerMethodField()
    action_affichee = serializers.CharField(source="get_action_display", read_only=True)
    modifications = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = ["id", "timestamp", "auteur", "action_affichee", "modifications"]

    def get_auteur(self, obj):
        if not obj.actor:
            return "Système"
        return obj.actor.get_full_name() or obj.actor.username

    def get_modifications(self, obj):
        brut = getattr(obj, "changes_dict", None)
        if brut is None:
            try:
                brut = json.loads(obj.changes) if isinstance(obj.changes, str) else (obj.changes or {})
            except (TypeError, ValueError):
                brut = {}

        resultats = []
        for champ, valeurs in brut.items():
            if champ in CHAMPS_IGNORES_RADIO:
                continue
            if isinstance(valeurs, list) and len(valeurs) == 2:
                ancienne, nouvelle = valeurs
            else:
                ancienne, nouvelle = None, valeurs
            resultats.append({
                "champ": LABELS_CHAMPS_RADIO.get(champ, champ),
                "ancienne_valeur": ancienne if ancienne not in (None, "") else "—",
                "nouvelle_valeur": nouvelle if nouvelle not in (None, "") else "—",
            })
        return resultats