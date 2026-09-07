import api from "./api";
import CONFIG from "../config/config";

export const actesService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/actes/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/actes/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/actes/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/actes/${id}/`, donnees),
  desactiver: (id) => api.delete(`${CONFIG.BASE_URL}/api/actes/${id}/`),
};