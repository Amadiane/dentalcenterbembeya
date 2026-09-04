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