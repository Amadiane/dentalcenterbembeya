import api from "./api";
import CONFIG from "../config/config";

export const patientsService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/patients/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/patients/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/patients/${id}/`, donnees),
  telechargerFiche: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/fiche-pdf/`, { responseType: "blob" }),
  archiver: (id) => api.delete(`${CONFIG.BASE_URL}/api/patients/${id}/`),
  historique: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/historique/`),
  listerArchives: () => api.get(`${CONFIG.BASE_URL}/api/patients/archives/`),
  restaurer: (id) => api.post(`${CONFIG.BASE_URL}/api/patients/${id}/restaurer/`),
};