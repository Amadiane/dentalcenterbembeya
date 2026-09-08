from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_ACCES_RADIOGRAPHIE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.HYGIENISTE,
}


class PeutGererRadiographie(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_ACCES_RADIOGRAPHIE