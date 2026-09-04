from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

# Rôles pouvant ouvrir une nouvelle fiche patient
ROLES_CREATION = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
}

# Rôles pouvant voir/modifier les données cliniques sensibles
ROLES_ACCES_CLINIQUE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.HYGIENISTE,
}

# Rôles pouvant modifier les données d'identité/contact
ROLES_ECRITURE_ADMINISTRATIF = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
}

CHAMPS_CLINIQUES = {"motif", "soins", "allergies", "antecedents_medicaux"}
CHAMPS_ADMINISTRATIFS = {"nom", "prenom", "age", "sexe", "profession", "adresse", "telephone", "email"}


class PeutCreerPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_CREATION


class EstAdministrateurGeneral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL