import api from "./api";
import CONFIG from "../config/config";

export const patientsService = {
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/patients/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/patients/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/patients/${id}/`, donnees),
  archiver: (id) => api.delete(`${CONFIG.BASE_URL}/api/patients/${id}/`),
  telechargerFiche: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/fiche-pdf/`, { responseType: "blob" }),
  historique: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/historique/`),
  listerArchives: (params) => api.get(`${CONFIG.BASE_URL}/api/patients/archives/`, { params }),
  restaurer: (id) => api.post(`${CONFIG.BASE_URL}/api/patients/${id}/restaurer/`),
  archiverPeriode: (donnees) => api.post(`${CONFIG.BASE_URL}/api/patients/archiver-periode/`, donnees),
};