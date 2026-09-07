from rest_framework import serializers
from utilisateurs.models import Utilisateur
from .models import Facture, LigneFacture, Paiement


class LigneFactureSerializer(serializers.ModelSerializer):
    acte_code = serializers.CharField(source="acte.code", read_only=True)
    sous_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = LigneFacture
        fields = ["id", "acte", "acte_code", "nom_acte", "prix_unitaire", "quantite", "remise_pourcentage", "sous_total"]
        read_only_fields = ["id", "nom_acte", "prix_unitaire"]

    def validate_remise_pourcentage(self, valeur):
        request = self.context.get("request")
        if valeur > 0 and request and request.user.role != Utilisateur.Role.ADMINISTRATEUR_GENERAL:
            raise serializers.ValidationError("Seul l'administrateur général peut accorder une remise.")
        return valeur


class PaiementSerializer(serializers.ModelSerializer):
    mode_paiement_affiche = serializers.CharField(source="get_mode_paiement_display", read_only=True)
    enregistre_par_nom = serializers.CharField(source="enregistre_par.get_full_name", read_only=True, default="")

    class Meta:
        model = Paiement
        fields = [
            "id", "facture", "montant", "mode_paiement", "mode_paiement_affiche",
            "reference", "date_paiement", "enregistre_par", "enregistre_par_nom", "date_creation",
        ]
        read_only_fields = ["id", "enregistre_par", "date_creation"]


class FactureSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)
    cree_par_nom = serializers.CharField(source="cree_par.get_full_name", read_only=True, default="")

    lignes = LigneFactureSerializer(many=True, required=False)
    paiements = PaiementSerializer(many=True, read_only=True)

    montant_avant_remise_globale = serializers.IntegerField(read_only=True)
    montant_total = serializers.IntegerField(read_only=True)
    montant_paye = serializers.IntegerField(read_only=True)
    montant_restant = serializers.IntegerField(read_only=True)

    class Meta:
        model = Facture
        fields = [
            "id", "numero_facture", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "date_emission", "statut", "statut_affiche", "notes",
            "remise_globale_pourcentage", "motif_remise",
            "lignes", "paiements",
            "montant_avant_remise_globale", "montant_total", "montant_paye", "montant_restant",
            "cree_par", "cree_par_nom", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "numero_facture", "cree_par", "date_creation", "date_modification"]

    def validate_remise_globale_pourcentage(self, valeur):
        request = self.context.get("request")
        if valeur > 0 and request and request.user.role != Utilisateur.Role.ADMINISTRATEUR_GENERAL:
            raise serializers.ValidationError("Seul l'administrateur général peut accorder une remise.")
        return valeur

    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        request = self.context.get("request")
        facture = Facture.objects.create(cree_par=request.user, **validated_data)
        for ligne_data in lignes_data:
            LigneFacture.objects.create(facture=facture, **ligne_data)
        return facture

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop("lignes", None)
        for attr, valeur in validated_data.items():
            setattr(instance, attr, valeur)
        instance.save()

        if lignes_data is not None:
            # Remplace entièrement les lignes existantes par la nouvelle liste envoyée
            instance.lignes.all().delete()
            for ligne_data in lignes_data:
                LigneFacture.objects.create(facture=instance, **ligne_data)

        return instance

import json
from auditlog.models import LogEntry

LABELS_CHAMPS_FACTURE = {
    "statut": "Statut",
    "notes": "Notes",
    "remise_globale_pourcentage": "Remise globale (%)",
    "motif_remise": "Motif de la remise",
    "montant": "Montant du paiement",
    "mode_paiement": "Mode de paiement",
    "reference": "Référence",
}
CHAMPS_IGNORES_FACTURE = {"date_creation", "date_modification", "id", "numero_facture", "cree_par"}


class EntreeJournalFactureSerializer(serializers.ModelSerializer):
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
            if champ in CHAMPS_IGNORES_FACTURE:
                continue
            if isinstance(valeurs, list) and len(valeurs) == 2:
                ancienne, nouvelle = valeurs
            else:
                ancienne, nouvelle = None, valeurs
            resultats.append({
                "champ": LABELS_CHAMPS_FACTURE.get(champ, champ),
                "ancienne_valeur": ancienne if ancienne not in (None, "") else "—",
                "nouvelle_valeur": nouvelle if nouvelle not in (None, "") else "—",
            })
        return resultats