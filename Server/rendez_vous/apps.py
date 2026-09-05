from django.apps import AppConfig


class RendezVousConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "rendez_vous"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import RendezVous
        auditlog.register(RendezVous)