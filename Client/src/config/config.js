const BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://dentalcenterbembeya.onrender.com";

export const CONFIG = {
  BASE_URL,
  API_CONNEXION: `${BASE_URL}/api/auth/connexion/`,
  API_MOI: `${BASE_URL}/api/utilisateurs/moi/`,
};

export default CONFIG;