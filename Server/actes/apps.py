from django.apps import AppConfig


class ActesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "actes"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import ActeMedical
        auditlog.register(ActeMedical)