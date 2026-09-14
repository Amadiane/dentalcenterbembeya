import api from "./api";
import CONFIG from "../config/config";

export const plansTraitementService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/plans-traitement/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/plans-traitement/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/plans-traitement/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/plans-traitement/${id}/`, donnees),
  abandonner: (id) => api.delete(`${CONFIG.BASE_URL}/api/plans-traitement/${id}/`),
};