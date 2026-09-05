from rest_framework.permissions import BasePermission
from utilisateurs.models import Utilisateur

ROLES_CREATION = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
}

# Rôles pouvant voir/modifier les données cliniques restreintes
ROLES_ACCES_CLINIQUE = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.INFIRMIER,
    Utilisateur.Role.HYGIENISTE,
}

# Rôles pouvant modifier l'identité/contact ET le motif de consultation
# (la réceptionniste écrit le motif puisque c'est elle qui reçoit le patient)
ROLES_ECRITURE_ADMINISTRATIF = {
    Utilisateur.Role.ADMINISTRATEUR_GENERAL,
    Utilisateur.Role.MEDECIN_CHEF,
    Utilisateur.Role.MEDECIN,
    Utilisateur.Role.ACCUEIL_RECEPTIONNISTE,
}

# Champs cliniques sensibles : masqués et non modifiables hors ROLES_ACCES_CLINIQUE
CHAMPS_CLINIQUES_RESTREINTS = {"diagnostic", "soins", "allergies", "antecedents_medicaux"}

# Champs administratifs : le motif en fait maintenant partie
CHAMPS_ADMINISTRATIFS = {
    "nom", "prenom", "age", "sexe", "profession", "adresse", "telephone", "email", "motif",
}


class PeutCreerPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ROLES_CREATION


class EstAdministrateurGeneral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Utilisateur.Role.ADMINISTRATEUR_GENERAL