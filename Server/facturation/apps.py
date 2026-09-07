from django.apps import AppConfig


class FacturationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "facturation"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Facture, Paiement
        auditlog.register(Facture)
        auditlog.register(Paiement)