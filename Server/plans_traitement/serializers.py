from rest_framework import serializers
from .models import PlanTraitement, LignePlanTraitement


class LignePlanTraitementSerializer(serializers.ModelSerializer):
    acte_code = serializers.CharField(source="acte.code", read_only=True)
    acte_tarif = serializers.IntegerField(source="acte.tarif", read_only=True)

    class Meta:
        model = LignePlanTraitement
        fields = ["id", "acte", "acte_code", "acte_tarif", "nom_acte", "dent_concernee", "ordre", "realise", "date_realisation", "notes"]
        read_only_fields = ["id", "nom_acte"]


class PlanTraitementSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    praticien_nom = serializers.CharField(source="praticien.get_full_name", read_only=True)
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)
    progression = serializers.IntegerField(read_only=True)

    lignes = LignePlanTraitementSerializer(many=True, required=False)

    class Meta:
        model = PlanTraitement
        fields = [
            "id", "numero_plan", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "praticien", "praticien_nom", "date_creation_plan", "statut", "statut_affiche",
            "diagnostic", "notes", "progression", "lignes", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "numero_plan", "date_creation", "date_modification"]

    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        plan = PlanTraitement.objects.create(**validated_data)
        for index, ligne_data in enumerate(lignes_data):
            LignePlanTraitement.objects.create(plan=plan, ordre=index, **ligne_data)
        return plan

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop("lignes", None)
        for attr, valeur in validated_data.items():
            setattr(instance, attr, valeur)
        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()
            for index, ligne_data in enumerate(lignes_data):
                LignePlanTraitement.objects.create(plan=instance, ordre=index, **ligne_data)

        return instance