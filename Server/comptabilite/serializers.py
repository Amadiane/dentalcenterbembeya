from rest_framework import serializers
from .models import Depense


class DepenseSerializer(serializers.ModelSerializer):
    categorie_affichee = serializers.CharField(source="get_categorie_display", read_only=True)
    enregistre_par_nom = serializers.CharField(source="enregistre_par.get_full_name", read_only=True, default="")

    class Meta:
        model = Depense
        fields = [
            "id", "date_depense", "categorie", "categorie_affichee", "montant",
            "description", "notes", "enregistre_par", "enregistre_par_nom",
            "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "enregistre_par", "date_creation", "date_modification"]