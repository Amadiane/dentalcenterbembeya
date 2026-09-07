import api from "./api";
import CONFIG from "../config/config";

export const rendezVousService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/rendez-vous/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/rendez-vous/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/rendez-vous/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/rendez-vous/${id}/`, donnees),
  annuler: (id) => api.delete(`${CONFIG.BASE_URL}/api/rendez-vous/${id}/`),
  historique: (id) => api.get(`${CONFIG.BASE_URL}/api/rendez-vous/${id}/historique/`),
};