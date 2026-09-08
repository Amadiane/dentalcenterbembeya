import api from "./api";
import CONFIG from "../config/config";

export const radiographieService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/radiographies/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/radiographies/${id}/`),
  creer: (formData) =>
    api.post(`${CONFIG.BASE_URL}/api/radiographies/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/radiographies/${id}/`, donnees),
  retirer: (id) => api.delete(`${CONFIG.BASE_URL}/api/radiographies/${id}/`),
  historique: (id) => api.get(`${CONFIG.BASE_URL}/api/radiographies/${id}/historique/`),
};