import { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const stocke = localStorage.getItem("utilisateur");
    return stocke ? JSON.parse(stocke) : null;
  });

  const connecter = async (username, password) => {
    const { data } = await authService.connexion(username, password);

    localStorage.setItem("token_acces", data.access);
    localStorage.setItem("token_rafraichissement", data.refresh);
    localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));

    setUtilisateur(data.utilisateur);
    return data.utilisateur;
  };

  const deconnecter = () => {
    localStorage.removeItem("token_acces");
    localStorage.removeItem("token_rafraichissement");
    localStorage.removeItem("utilisateur");
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}