from django.apps import AppConfig


class RadiographieConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "radiographie"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Radiographie
        auditlog.register(Radiographie)