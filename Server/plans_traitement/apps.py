from django.apps import AppConfig


class PlansTraitementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "plans_traitement"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import PlanTraitement
        auditlog.register(PlanTraitement)