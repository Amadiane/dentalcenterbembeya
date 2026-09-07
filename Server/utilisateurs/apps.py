from django.apps import AppConfig


class UtilisateursConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "utilisateurs"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Utilisateur
        auditlog.register(Utilisateur)