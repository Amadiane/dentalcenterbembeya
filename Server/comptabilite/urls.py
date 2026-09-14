from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import DepenseViewSet, synthese_mensuelle

router = DefaultRouter()
router.register("depenses", DepenseViewSet, basename="depenses")

urlpatterns = [
    path("synthese/", synthese_mensuelle, name="synthese-mensuelle"),
] + router.urls