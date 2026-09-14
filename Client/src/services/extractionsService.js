import api from "./api";
import CONFIG from "../config/config";

export const extractionsService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/extractions/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/extractions/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/extractions/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/extractions/${id}/`, donnees),
  annuler: (id) => api.delete(`${CONFIG.BASE_URL}/api/extractions/${id}/`),
};