from rest_framework.routers import DefaultRouter
from .views import ExtractionViewSet

router = DefaultRouter()
router.register("", ExtractionViewSet, basename="extractions")

urlpatterns = router.urls