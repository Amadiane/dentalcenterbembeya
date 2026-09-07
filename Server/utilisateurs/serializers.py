from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    role_affiche = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id", "username", "first_name", "last_name", "email",
            "telephone", "role", "role_affiche", "actif", "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]


class UtilisateurCreationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Utilisateur
        fields = ["id", "username", "first_name", "last_name", "email", "telephone", "role", "password"]

    def validate_username(self, valeur):
        if Utilisateur.objects.filter(username=valeur).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return valeur

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("password")
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur


class UtilisateurModificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "email", "telephone", "role", "actif"]


class ReinitialisationMotDePasseSerializer(serializers.Serializer):
    nouveau_mot_de_passe = serializers.CharField(write_only=True, min_length=8)


class ConnexionSerializer(TokenObtainPairSerializer):
    """Émission des tokens JWT — bloque les comptes désactivés."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.actif:
            raise AuthenticationFailed(
                "Ce compte a été désactivé. Contactez l'administrateur du système.",
                code="compte_inactif",
            )
        data["utilisateur"] = UtilisateurSerializer(self.user).data
        return data



import json
from auditlog.models import LogEntry

LABELS_CHAMPS_UTILISATEUR = {
    "first_name": "Prénom",
    "last_name": "Nom",
    "email": "E-mail",
    "telephone": "Téléphone",
    "role": "Rôle",
    "actif": "Statut du compte",
    "password": "Mot de passe",
}
CHAMPS_IGNORES_UTILISATEUR = {
    "date_creation", "id", "last_login", "date_joined", "is_staff", "is_superuser",
}


class EntreeJournalUtilisateurSerializer(serializers.ModelSerializer):
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
            if champ in CHAMPS_IGNORES_UTILISATEUR:
                continue
            if isinstance(valeurs, list) and len(valeurs) == 2:
                ancienne, nouvelle = valeurs
            else:
                ancienne, nouvelle = None, valeurs
            # Le mot de passe (haché) ne doit jamais s'afficher, même modifié
            if champ == "password":
                ancienne, nouvelle = "••••••••", "••••••••"
            resultats.append({
                "champ": LABELS_CHAMPS_UTILISATEUR.get(champ, champ),
                "ancienne_valeur": ancienne if ancienne not in (None, "") else "—",
                "nouvelle_valeur": nouvelle if nouvelle not in (None, "") else "—",
            })
        return resultats