import api from "./api";
import CONFIG from "../config/config";

export const utilisateursService = {
  medecins: () => api.get(`${CONFIG.BASE_URL}/api/utilisateurs/medecins/`),
};