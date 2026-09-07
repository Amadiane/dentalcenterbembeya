from rest_framework import serializers
from .models import ActeMedical


class ActeMedicalSerializer(serializers.ModelSerializer):
    categorie_affichee = serializers.CharField(source="get_categorie_display", read_only=True)

    class Meta:
        model = ActeMedical
        fields = [
            "id", "code", "nom", "description", "categorie", "categorie_affichee",
            "tarif", "duree_estimee_minutes", "actif", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification"]