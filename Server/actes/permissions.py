from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_GESTION_CATALOGUE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
}


class PeutGererCatalogueActes(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_GESTION_CATALOGUE