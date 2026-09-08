from rest_framework.routers import DefaultRouter
from .views import RadiographieViewSet

router = DefaultRouter()
router.register("", RadiographieViewSet, basename="radiographies")

urlpatterns = router.urls