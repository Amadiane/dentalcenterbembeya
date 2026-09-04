import api from "./api";
import CONFIG from "../config/config";

export const patientsService = {
  lister: () => api.get(`${CONFIG.BASE_URL}/api/patients/`),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/patients/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/patients/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/patients/${id}/`, donnees),
};