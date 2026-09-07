import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/auth/Connexion.module.css";

export default function Connexion() {
  const { connecter } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      await connecter(username, password);
      navigate("/");
    } catch (err) {
      setErreur(
        err.response?.data?.detail ||
        "Identifiants incorrects. Vérifiez le nom d'utilisateur et le mot de passe."
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Panneau de marque — motif abstrait inspiré des courbes du logo (cœur / dent) */}
      <div className={styles.panneauMarque}>
        <svg className={styles.motif} viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path
            d="M 60 240 C 60 130, 210 90, 300 175 C 390 90, 540 130, 540 240 C 540 390, 390 465, 300 565 C 210 465, 60 390, 60 240 Z"
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
          />
          <path
            d="M 130 270 C 130 180, 240 150, 300 215 C 360 150, 470 180, 470 270 C 470 380, 360 440, 300 515 C 240 440, 130 380, 130 270 Z"
            fill="none" stroke="rgba(127,212,230,0.4)" strokeWidth="1.5"
          />
          <path
            d="M 195 300 C 195 235, 265 215, 300 255 C 335 215, 405 235, 405 300 C 405 370, 335 410, 300 460 C 265 410, 195 370, 195 300 Z"
            fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5"
          />
          <circle cx="300" cy="600" r="3" fill="rgba(127,212,230,0.5)" />
          <circle cx="240" cy="635" r="2" fill="rgba(255,255,255,0.3)" />
          <circle cx="360" cy="635" r="2" fill="rgba(255,255,255,0.3)" />
        </svg>

        <div className={styles.contenuMarque}>
          <span className={styles.monogramme}>CDB</span>
          <h1 className={styles.nomClinique}>Centre Dentaire<br />Bembeya</h1>
          <p className={styles.slogan}>Le sourire, notre métier.</p>
        </div>

        <div className={styles.confiance}>
          <ShieldCheck size={16} />
          <span>Connexion chiffrée · données hébergées de façon sécurisée</span>
        </div>
      </div>

      {/* Panneau formulaire */}
      <div className={styles.panneauFormulaire}>
        <form className={styles.formulaire} onSubmit={handleSubmit}>
          <div className={styles.enteteFormulaire}>
            <h2>Bon retour</h2>
            <p>Connectez-vous pour accéder au système de gestion du cabinet.</p>
          </div>

          {erreur && <div className={styles.erreur}>{erreur}</div>}

          <div className={styles.champ}>
            <label htmlFor="username">Nom d'utilisateur</label>
            <div className={styles.champAvecIcone}>
              <User size={17} className={styles.iconeChamp} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className={styles.champ}>
            <label htmlFor="password">Mot de passe</label>
            <div className={styles.champAvecIcone}>
              <Lock size={17} className={styles.iconeChamp} />
              <input
                id="password"
                type={motDePasseVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.boutonOeil}
                onClick={() => setMotDePasseVisible((v) => !v)}
                aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {motDePasseVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.boutonConnexion} disabled={enCours}>
            {enCours ? "Connexion en cours..." : "Se connecter"}
          </button>

          <p className={styles.pied}>
            Accès réservé au personnel du Centre Dentaire Bembeya.
          </p>
        </form>
      </div>
    </div>
  );
}