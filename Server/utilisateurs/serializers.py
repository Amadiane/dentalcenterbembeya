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