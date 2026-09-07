import api from "./api";
import CONFIG from "../config/config";

export const facturationService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/factures/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/factures/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/factures/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/factures/${id}/`, donnees),
  annuler: (id) => api.post(`${CONFIG.BASE_URL}/api/factures/${id}/annuler/`),
  ajouterPaiement: (id, donnees) => api.post(`${CONFIG.BASE_URL}/api/factures/${id}/paiements/`, donnees),
  telechargerRecu: (id) => api.get(`${CONFIG.BASE_URL}/api/factures/${id}/recu-pdf/`, { responseType: "blob" }),
  historique: (id) => api.get(`${CONFIG.BASE_URL}/api/factures/${id}/historique/`),
};