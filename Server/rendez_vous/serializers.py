from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import serializers
from utilisateurs.models import Utilisateur
from .models import RendezVous


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

        # Bloque uniquement à la création — modifier un rendez-vous passé doit rester possible
        if self.instance is None:
            date_rdv = attrs.get("date")
            if date_rdv and date_rdv < timezone.now().date():
                raise serializers.ValidationError({
                    "date": "Impossible de créer un rendez-vous à une date déjà passée."
                })

        # Vérification du chevauchement pour le même praticien (création ET modification)
        praticien = attrs.get("praticien", getattr(self.instance, "praticien", None))
        date_rdv = attrs.get("date", getattr(self.instance, "date", None))
        heure_debut = attrs.get("heure_debut", getattr(self.instance, "heure_debut", None))
        duree = attrs.get("duree_minutes", getattr(self.instance, "duree_minutes", None))

        if praticien and date_rdv and heure_debut and duree:
            debut = datetime.combine(date_rdv, heure_debut)
            fin = debut + timedelta(minutes=duree)

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

        return attrs