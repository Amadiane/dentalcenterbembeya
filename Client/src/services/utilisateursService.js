import api from "./api";
import CONFIG from "../config/config";

export const utilisateursService = {
  medecins: () => api.get(`${CONFIG.BASE_URL}/api/utilisateurs/medecins/`),
  lister: (params) => api.get(`${CONFIG.BASE_URL}/api/utilisateurs/`, { params }),
  obtenir: (id) => api.get(`${CONFIG.BASE_URL}/api/utilisateurs/${id}/`),
  creer: (donnees) => api.post(`${CONFIG.BASE_URL}/api/utilisateurs/`, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.BASE_URL}/api/utilisateurs/${id}/`, donnees),
  desactiver: (id) => api.delete(`${CONFIG.BASE_URL}/api/utilisateurs/${id}/`),
  reinitialiserMotDePasse: (id, nouveauMotDePasse) =>
    api.post(`${CONFIG.BASE_URL}/api/utilisateurs/${id}/reinitialiser-mot-de-passe/`, {
      nouveau_mot_de_passe: nouveauMotDePasse,
    }),
};