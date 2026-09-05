from django.urls import path
from .views import moi
from .views import moi, medecins

urlpatterns = [
    path("moi/", moi, name="moi"),
    path("medecins/", medecins, name="medecins"),
]