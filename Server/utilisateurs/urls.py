from rest_framework.routers import DefaultRouter
from .views import moi, medecins, UtilisateurViewSet
from django.urls import path

router = DefaultRouter()
router.register("", UtilisateurViewSet, basename="utilisateurs")

urlpatterns = [
    path("moi/", moi, name="moi"),
    path("medecins/", medecins, name="medecins"),
] + router.urls