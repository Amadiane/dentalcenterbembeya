import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { utilisateursService } from "../../services/utilisateursService";
import styles from "../../theme/pages/personnel/FormulairePersonnel.module.css";

const ROLES = [
  ["administrateur_general", "Administrateur général"],
  ["medecin_chef", "Médecin chef"],
  ["medecin", "Médecin"],
  ["infirmier", "Infirmier"],
  ["accueil_receptionniste", "Accueil réceptionniste"],
  ["hygieniste", "Hygiéniste"],
];

export default function FormulairePersonnel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modeEdition = Boolean(id);

  const [valeurs, setValeurs] = useState({
    username: "", first_name: "", last_name: "", email: "", telephone: "",
    role: "accueil_receptionniste", password: "", actif: true,
  });
  const [chargement, setChargement] = useState(modeEdition);
  const [erreur, setErreur] = useState("");

  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [messageMotDePasse, setMessageMotDePasse] = useState("");

  useEffect(() => {
    if (!modeEdition) return;
    utilisateursService.obtenir(id).then(({ data }) => setValeurs({ ...valeurs, ...data })).finally(() => setChargement(false));
  }, [id, modeEdition]);

  const champ = (nom) => ({
    value: valeurs[nom] ?? "",
    onChange: (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      if (modeEdition) {
        const { password, username, ...donneesModifiables } = valeurs;
        await utilisateursService.modifier(id, donneesModifiables);
        navigate("/personnel");
      } else {
        await utilisateursService.creer(valeurs);
        navigate("/personnel");
      }
    } catch (err) {
      const messageApi = err.response?.data?.username || err.response?.data?.password;
      setErreur(
        Array.isArray(messageApi) ? messageApi[0]
          : messageApi || "Erreur lors de l'enregistrement. Vérifiez les champs du formulaire."
      );
    }
  };

  const reinitialiserMotDePasse = async () => {
    if (nouveauMotDePasse.length < 8) {
      setMessageMotDePasse("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    await utilisateursService.reinitialiserMotDePasse(id, nouveauMotDePasse);
    setMessageMotDePasse("Mot de passe réinitialisé avec succès.");
    setNouveauMotDePasse("");
  };

  const desactiverCompte = async () => {
    if (!window.confirm(`Désactiver le compte de ${valeurs.first_name} ${valeurs.last_name} ? Il ne pourra plus se connecter, mais son historique reste conservé.`)) return;
    await utilisateursService.desactiver(id);
    navigate("/personnel");
  };

  if (chargement) return <p>Chargement...</p>;

  return (
    <div className="conteneur-page" style={{ maxWidth: 600 }}>
      <h1 className={styles.titre}>{modeEdition ? "Modifier le compte" : "Nouveau compte"}</h1>

      {erreur && (
        <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Prénom *</label>
              <input {...champ("first_name")} required />
            </div>
            <div className="champ-formulaire">
              <label>Nom *</label>
              <input {...champ("last_name")} required />
            </div>
            <div className="champ-formulaire">
              <label>Nom d'utilisateur *</label>
              <input {...champ("username")} disabled={modeEdition} required />
            </div>
            <div className="champ-formulaire">
              <label>Rôle *</label>
              <select {...champ("role")} required>
                {ROLES.map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>{libelle}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>E-mail</label>
              <input type="email" {...champ("email")} />
            </div>
            <div className="champ-formulaire">
              <label>Téléphone</label>
              <input {...champ("telephone")} />
            </div>
          </div>

          {!modeEdition && (
            <div className="champ-formulaire">
              <label>Mot de passe initial *</label>
              <input type="password" {...champ("password")} minLength={8} required />
            </div>
          )}

          {modeEdition && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 6 }}>
              <input type="checkbox" checked={valeurs.actif} onChange={(e) => setValeurs((v) => ({ ...v, actif: e.target.checked }))} />
              Compte actif (autorisé à se connecter)
            </label>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button type="button" className="bouton-secondaire" onClick={() => navigate("/personnel")}>Annuler</button>
          <button type="submit" className="bouton-primaire">Enregistrer</button>
        </div>
      </form>

      {modeEdition && (
        <>
          <div className="carte-moderne" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "var(--couleur-primaire-fonce)" }}>Réinitialiser le mot de passe</div>
            {messageMotDePasse && (
              <p style={{ fontSize: 13, color: messageMotDePasse.includes("succès") ? "var(--couleur-succes)" : "var(--couleur-danger)", marginBottom: 10 }}>
                {messageMotDePasse}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="password"
                placeholder="Nouveau mot de passe (8 caractères min.)"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                style={{ flex: 1, minWidth: 220, border: "1px solid var(--couleur-bordure)", borderRadius: 8, padding: "10px 12px" }}
              />
              <button type="button" onClick={reinitialiserMotDePasse} className="bouton-primaire">Réinitialiser</button>
            </div>
          </div>

          <div style={{ border: "1px solid #f5c6c6", background: "#fdecec", borderRadius: 10, padding: 16, marginTop: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--couleur-danger)" }}>Zone sensible</div>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              Désactiver ce compte l'empêche de se connecter, mais conserve tout son historique (dossiers créés, factures, etc.).
            </p>
            <button type="button" onClick={desactiverCompte} className="bouton-secondaire" style={{ color: "var(--couleur-danger)" }}>
              Désactiver ce compte
            </button>
          </div>
        </>
      )}
    </div>
  );
}