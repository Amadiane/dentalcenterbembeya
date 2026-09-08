import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);
const DELAI_INACTIVITE_MS = 20 * 60 * 1000; // 20 minutes

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const stocke = localStorage.getItem("utilisateur");
    return stocke ? JSON.parse(stocke) : null;
  });
  const minuteur = useRef(null);

  const connecter = async (username, password) => {
    const { data } = await authService.connexion(username, password);
    localStorage.setItem("token_acces", data.access);
    localStorage.setItem("token_rafraichissement", data.refresh);
    localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
    setUtilisateur(data.utilisateur);
    return data.utilisateur;
  };

  const deconnecter = useCallback(() => {
    localStorage.removeItem("token_acces");
    localStorage.removeItem("token_rafraichissement");
    localStorage.removeItem("utilisateur");
    setUtilisateur(null);
  }, []);
  

  // Déconnexion automatique après une période d'inactivité (sécurité des données patients)
  useEffect(() => {
    if (!utilisateur) return;

    const reinitialiserMinuteur = () => {
      clearTimeout(minuteur.current);
      minuteur.current = setTimeout(() => {
        deconnecter();
        window.location.href = "/connexion";
      }, DELAI_INACTIVITE_MS);
    };

    const evenements = ["mousemove", "keydown", "click", "scroll"];
    evenements.forEach((e) => window.addEventListener(e, reinitialiserMinuteur));
    reinitialiserMinuteur();

    return () => {
      clearTimeout(minuteur.current);
      evenements.forEach((e) => window.removeEventListener(e, reinitialiserMinuteur));
    };
  }, [utilisateur, deconnecter]);

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}