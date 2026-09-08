from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from utilisateurs.views import ConnexionVue

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/connexion/", ConnexionVue.as_view(), name="connexion"),
    path("api/auth/rafraichir/", TokenRefreshView.as_view(), name="rafraichir_token"),
    path("api/utilisateurs/", include("utilisateurs.urls")),
    path("api/patients/", include("patients.urls")),
    path("api/rendez-vous/", include("rendez_vous.urls")),
    path("api/actes/", include("actes.urls")),
    path("api/factures/", include("facturation.urls")),
    path("api/radiographies/", include("radiographie.urls")),
]