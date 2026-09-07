from rest_framework.routers import DefaultRouter
from .views import ActeMedicalViewSet

router = DefaultRouter()
router.register("", ActeMedicalViewSet, basename="actes")

urlpatterns = router.urls