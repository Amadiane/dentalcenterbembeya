from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from auditlog.context import set_actor

from .models import Utilisateur
from .serializers import (
    ConnexionSerializer, UtilisateurSerializer, UtilisateurCreationSerializer,
    UtilisateurModificationSerializer, ReinitialisationMotDePasseSerializer,
)
from .permissions import EstAdministrateurGeneral


class ConnexionVue(TokenObtainPairView):
    serializer_class = ConnexionSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def moi(request):
    return Response(UtilisateurSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medecins(request):
    qs = Utilisateur.objects.filter(
        role__in=[Utilisateur.Role.MEDECIN_CHEF, Utilisateur.Role.MEDECIN], actif=True
    )
    return Response(UtilisateurSerializer(qs, many=True).data)


class UtilisateurViewSet(viewsets.ModelViewSet):
    """Gestion des comptes du personnel — réservée à l'administrateur général."""
    queryset = Utilisateur.objects.all().order_by("last_name", "first_name")
    permission_classes = [permissions.IsAuthenticated, EstAdministrateurGeneral]

    def get_serializer_class(self):
        if self.action == "create":
            return UtilisateurCreationSerializer
        if self.action in ["update", "partial_update"]:
            return UtilisateurModificationSerializer
        return UtilisateurSerializer

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        """Désactivation plutôt que suppression — un compte a pu créer des dossiers,
        des rendez-vous, des factures : sa trace ne doit jamais disparaître."""
        with set_actor(self.request.user):
            instance.actif = False
            instance.save(update_fields=["actif"])

    @action(detail=True, methods=["post"], url_path="reinitialiser-mot-de-passe")
    def reinitialiser_mot_de_passe(self, request, pk=None):
        utilisateur = self.get_object()
        serializer = ReinitialisationMotDePasseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with set_actor(request.user):
            utilisateur.set_password(serializer.validated_data["nouveau_mot_de_passe"])
            utilisateur.save(update_fields=["password"])
        return Response({"detail": "Mot de passe réinitialisé."})