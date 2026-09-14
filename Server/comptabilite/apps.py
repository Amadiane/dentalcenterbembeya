from django.apps import AppConfig


class ComptabiliteConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "comptabilite"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Depense
        auditlog.register(Depense)