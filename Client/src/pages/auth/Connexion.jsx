import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Connexion() {
  const { connecter } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await connecter(username, password);
      navigate("/");
    } catch {
      setErreur("Identifiants incorrects.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        <h2>Centre Dentaire Bembeya</h2>

        {erreur && <p style={{ color: "var(--couleur-danger)" }}>{erreur}</p>}

        <div className="champ-formulaire">
          <label>Nom d'utilisateur</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="champ-formulaire">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="bouton-primaire">Se connecter</button>
      </form>
    </div>
  );
}