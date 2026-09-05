from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_GESTION_RDV = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
}


class PeutGererRendezVous(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_GESTION_RDV