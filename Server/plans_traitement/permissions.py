from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_GESTION_CLINIQUE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
}

ROLES_CONSULTATION_CLINIQUE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.HYGIENISTE,
}


class PeutGererPlanTraitement(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return request.user.role in ROLES_CONSULTATION_CLINIQUE
        return request.user.role in ROLES_GESTION_CLINIQUE