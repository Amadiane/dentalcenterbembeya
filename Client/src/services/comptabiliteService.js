import api from "./api";
import CONFIG from "../config/config";

export const comptabiliteService = {
  listerDepenses: (params) => api.get(`${CONFIG.BASE_URL}/api/comptabilite/depenses/`, { params }),
  obtenirDepense: (id) => api.get(`${CONFIG.BASE_URL}/api/comptabilite/depenses/${id}/`),
  creerDepense: (donnees) => api.post(`${CONFIG.BASE_URL}/api/comptabilite/depenses/`, donnees),
  modifierDepense: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/comptabilite/depenses/${id}/`, donnees),
  retirerDepense: (id) => api.delete(`${CONFIG.BASE_URL}/api/comptabilite/depenses/${id}/`),
  synthese: (params) => api.get(`${CONFIG.BASE_URL}/api/comptabilite/synthese/`, { params }),
};