from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur
from .models import RendezVous

ROLES_GESTION_RDV = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
}

STATUTS_CLOS = {RendezVous.Statut.TERMINE, RendezVous.Statut.ABSENT}


class PeutGererRendezVous(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_GESTION_RDV


class PeutModifierRendezVous(BasePermission):
    """Une fois clos (terminé/absent), seul l'administrateur général peut encore
    modifier, reprogrammer ou annuler ce rendez-vous."""
    message = "Ce rendez-vous est clôturé. Seul l'administrateur général peut encore le modifier."

    def has_object_permission(self, request, view, obj):
        if obj.statut in STATUTS_CLOS:
            return request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL
        return True