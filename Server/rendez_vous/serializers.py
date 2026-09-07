from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import serializers
from utilisateurs.models import Utilisateur
from .models import RendezVous
import json
from auditlog.models import LogEntry


class RendezVousSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.nom", read_only=True)
    patient_prenom = serializers.CharField(source="patient.prenom", read_only=True)
    patient_numero_dossier = serializers.CharField(source="patient.numero_dossier", read_only=True)
    praticien_nom = serializers.CharField(source="praticien.get_full_name", read_only=True)
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)
    heure_fin = serializers.SerializerMethodField()

    praticien = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.filter(
            role__in=[Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN]
        )
    )

    class Meta:
        model = RendezVous
        fields = [
            "id", "patient", "patient_nom", "patient_prenom", "patient_numero_dossier",
            "praticien", "praticien_nom", "date", "heure_debut", "duree_minutes", "heure_fin",
            "motif", "statut", "statut_affiche", "notes", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification"]

    def get_heure_fin(self, obj):
        debut = datetime.combine(obj.date, obj.heure_debut)
        fin = debut + timedelta(minutes=obj.duree_minutes)
        return fin.strftime("%H:%M")

    def validate(self, attrs):
        request = self.context.get("request")
        est_admin_general = bool(request and request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL)

        if self.instance and self.instance.statut in [RendezVous.Statut.TERMINE, RendezVous.Statut.ABSENT] and not est_admin_general:
            if ("date" in attrs and attrs["date"] != self.instance.date) or \
               ("heure_debut" in attrs and attrs["heure_debut"] != self.instance.heure_debut):
                raise serializers.ValidationError({
                    "date": "Ce rendez-vous est déjà clôturé (terminé ou absent). "
                            "Créez un nouveau rendez-vous plutôt que de déplacer celui-ci."
                })

        if self.instance is None:
            date_rdv = attrs.get("date")
            if date_rdv and date_rdv < timezone.now().date():
                raise serializers.ValidationError({
                    "date": "Impossible de créer un rendez-vous à une date déjà passée."
                })

        praticien = attrs.get("praticien", getattr(self.instance, "praticien", None))
        patient = attrs.get("patient", getattr(self.instance, "patient", None))
        date_rdv = attrs.get("date", getattr(self.instance, "date", None))
        heure_debut = attrs.get("heure_debut", getattr(self.instance, "heure_debut", None))
        duree = attrs.get("duree_minutes", getattr(self.instance, "duree_minutes", None))

        if date_rdv and heure_debut and duree:
            debut = datetime.combine(date_rdv, heure_debut)
            fin = debut + timedelta(minutes=duree)

            # Chevauchement pour le même praticien : bloquant
            if praticien:
                conflits = RendezVous.objects.filter(
                    praticien=praticien, date=date_rdv
                ).exclude(statut=RendezVous.Statut.ANNULE)
                if self.instance:
                    conflits = conflits.exclude(pk=self.instance.pk)
                for autre in conflits:
                    autre_debut = datetime.combine(autre.date, autre.heure_debut)
                    autre_fin = autre_debut + timedelta(minutes=autre.duree_minutes)
                    if debut < autre_fin and autre_debut < fin:
                        raise serializers.ValidationError({
                            "heure_debut": f"Ce praticien a déjà un rendez-vous de {autre.heure_debut.strftime('%H:%M')} à {autre_fin.strftime('%H:%M')} ce jour-là."
                        })

            # Chevauchement pour le même patient, tous praticiens confondus : bloquant
            # (un patient ne peut pas être à deux endroits en même temps)
            if patient:
                conflits_patient = RendezVous.objects.filter(
                    patient=patient, date=date_rdv
                ).exclude(statut=RendezVous.Statut.ANNULE)
                if self.instance:
                    conflits_patient = conflits_patient.exclude(pk=self.instance.pk)
                for autre in conflits_patient:
                    autre_debut = datetime.combine(autre.date, autre.heure_debut)
                    autre_fin = autre_debut + timedelta(minutes=autre.duree_minutes)
                    if debut < autre_fin and autre_debut < fin:
                        raise serializers.ValidationError({
                            "heure_debut": f"Ce patient a déjà un rendez-vous se chevauchant de {autre.heure_debut.strftime('%H:%M')} à {autre_fin.strftime('%H:%M')} ce jour-là (avec {autre.praticien.get_full_name()})."
                        })

        return attrs





LABELS_CHAMPS_RDV = {
    "date": "Date",
    "heure_debut": "Heure",
    "duree_minutes": "Durée (minutes)",
    "motif": "Motif",
    "statut": "Statut",
    "notes": "Notes",
    "praticien": "Praticien",
    "patient": "Patient",
}
CHAMPS_IGNORES_RDV = {"date_creation", "date_modification", "id"}


class EntreeJournalRdvSerializer(serializers.ModelSerializer):
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
            if champ in CHAMPS_IGNORES_RDV:
                continue
            if isinstance(valeurs, list) and len(valeurs) == 2:
                ancienne, nouvelle = valeurs
            else:
                ancienne, nouvelle = None, valeurs
            resultats.append({
                "champ": LABELS_CHAMPS_RDV.get(champ, champ),
                "ancienne_valeur": ancienne if ancienne not in (None, "") else "—",
                "nouvelle_valeur": nouvelle if nouvelle not in (None, "") else "—",
            })
        return resultats