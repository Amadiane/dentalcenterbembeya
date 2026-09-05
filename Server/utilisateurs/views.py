from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Utilisateur

from .serializers import ConnexionSerializer, UtilisateurSerializer


class ConnexionVue(TokenObtainPairView):
    """POST /api/auth/connexion/ — retourne les tokens JWT + le profil utilisateur."""
    serializer_class = ConnexionSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def moi(request):
    """GET /api/utilisateurs/moi/ — profil de l'utilisateur connecté."""
    return Response(UtilisateurSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medecins(request):
    """Liste des médecins, pour assignation (rendez-vous, dossiers)."""
    qs = Utilisateur.objects.filter(
        role__in=[Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN], actif=True
    )
    return Response(UtilisateurSerializer(qs, many=True).data)