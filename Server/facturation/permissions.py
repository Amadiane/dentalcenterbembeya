from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_GESTION_FACTURATION = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
}


class PeutGererFacturation(BasePermission):
    """Créer/modifier une facture, enregistrer un paiement."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_GESTION_FACTURATION


class PeutAnnulerFacture(BasePermission):
    """Annuler une facture — réservé à l'administrateur général, décision plus sensible."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL