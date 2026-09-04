from rest_framework.permissions import BasePermission
from .models import Utilisateur


class EstPersonnelSoignant(BasePermission):
    """Médecin chef, médecin, infirmier, hygiéniste — accès clinique."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Utilisateur.Role.MEDECIN_CHEF,
                Utilisateur.Role.MEDECIN,
                Utilisateur.Role.INFIRMIER,
                Utilisateur.Role.HYGIENISTE,
            ]
        )


class EstAdministration(BasePermission):
    """Administrateur général et accueil/réceptionniste — planning, dossiers, facturation."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Utilisateur.Role.ADMINISTRATEUR_GENERAL,
                Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
            ]
        )


class EstAdministrateurGeneral(BasePermission):
    """Réservé à la gestion globale du cabinet (utilisateurs, statistiques)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL
        )