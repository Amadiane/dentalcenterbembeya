from django.urls import path
from .views import moi

urlpatterns = [
    path("moi/", moi, name="moi"),
]