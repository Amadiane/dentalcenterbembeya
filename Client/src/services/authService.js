import axios from "axios";
import api from "./api";
import CONFIG from "../config/config";

export const authService = {
  connexion: (username, password) =>
    axios.post(CONFIG.API_CONNEXION, { username, password }),
  moi: () => api.get(CONFIG.API_MOI),
};