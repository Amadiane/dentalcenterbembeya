from rest_framework.routers import DefaultRouter
from .views import PlanTraitementViewSet

router = DefaultRouter()
router.register("", PlanTraitementViewSet, basename="plans-traitement")

urlpatterns = router.urls