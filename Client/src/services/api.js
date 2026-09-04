import axios from "axios";
import CONFIG from "../config/config";

const api = axios.create({ baseURL: CONFIG.BASE_URL });

api.interceptors.request.use((requete) => {
  const token = localStorage.getItem("token_acces");
  if (token) requete.headers.Authorization = `Bearer ${token}`;
  return requete;
});

export default api;