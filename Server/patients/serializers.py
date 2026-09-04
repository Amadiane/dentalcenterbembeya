from rest_framework import serializers
from .models import Patient
from .permissions import CHAMPS_CLINIQUES, CHAMPS_ADMINISTRATIFS, ROLES_ACCES_CLINIQUE, ROLES_ECRITURE_ADMINISTRATIF


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"
        read_only_fields = ["id", "numero_dossier", "date_creation", "date_modification", "actif"]

    def to_representation(self, instance):
        """Masque les champs cliniques pour les rôles qui n'y ont pas accès (ex. réception)."""
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.user.role not in ROLES_ACCES_CLINIQUE:
            for champ in CHAMPS_CLINIQUES:
                data.pop(champ, None)
        return data

    def validate(self, attrs):
        """Ignore silencieusement toute tentative de modifier un champ hors périmètre du rôle."""
        request = self.context.get("request")
        if request:
            role = request.user.role
            if role not in ROLES_ACCES_CLINIQUE:
                for champ in CHAMPS_CLINIQUES:
                    attrs.pop(champ, None)
            if role not in ROLES_ECRITURE_ADMINISTRATIF:
                for champ in CHAMPS_ADMINISTRATIFS:
                    attrs.pop(champ, None)
        return attrs

from auditlog.models import LogEntry


import json
from auditlog.models import LogEntry

LABELS_CHAMPS = {
    "nom": "Nom",
    "prenom": "Prénom",
    "age": "Âge",
    "sexe": "Sexe",
    "profession": "Profession",
    "adresse": "Adresse",
    "telephone": "Téléphone",
    "email": "E-mail",
    "motif": "Motif de consultation",
    "soins": "Soins",
    "allergies": "Allergies",
    "antecedents_medicaux": "Antécédents médicaux",
    "praticien_referent": "Praticien référent",
    "actif": "Statut du dossier",
}

CHAMPS_IGNORES = {"date_creation", "date_modification", "id", "numero_dossier"}


class EntreeJournalSerializer(serializers.ModelSerializer):
    auteur = serializers.CharField(source="actor.get_full_name", read_only=True, default="Système")
    action_affichee = serializers.CharField(source="get_action_display", read_only=True)
    modifications = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = ["id", "timestamp", "auteur", "action_affichee", "modifications"]

    def get_modifications(self, obj):
        brut = getattr(obj, "changes_dict", None)
        if brut is None:
            try:
                brut = json.loads(obj.changes) if isinstance(obj.changes, str) else (obj.changes or {})
            except (TypeError, ValueError):
                brut = {}

        resultats = []
        for champ, valeurs in brut.items():
            if champ in CHAMPS_IGNORES:
                continue
            if isinstance(valeurs, list) and len(valeurs) == 2:
                ancienne, nouvelle = valeurs
            else:
                ancienne, nouvelle = None, valeurs
            resultats.append({
                "champ": LABELS_CHAMPS.get(champ, champ),
                "ancienne_valeur": ancienne if ancienne not in (None, "") else "—",
                "nouvelle_valeur": nouvelle if nouvelle not in (None, "") else "—",
            })
        return resultats