import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { patientsService } from "../../services/patientsService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/patients/FormulairePatient.module.css";

const VIDE = {
  nom: "", prenom: "", age: "", sexe: "", profession: "", adresse: "",
  telephone: "", email: "", motif: "", soins: "", allergies: "", antecedents_medicaux: "",
};

const ROLES_ACCES_CLINIQUE = ["administrateur_general", "medecin_chef", "medecin", "infirmier", "hygieniste"];

export default function FormulairePatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const modeEdition = Boolean(id);
  const accesClinique = ROLES_ACCES_CLINIQUE.includes(utilisateur?.role);

  const [valeurs, setValeurs] = useState(VIDE);
  const [chargement, setChargement] = useState(modeEdition);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!modeEdition) return;
    patientsService
      .obtenir(id)
      .then(({ data }) => setValeurs({ ...VIDE, ...data }))
      .finally(() => setChargement(false));
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
        await patientsService.modifier(id, valeurs);
        navigate(`/patients/${id}`);
      } else {
        const { data } = await patientsService.creer(valeurs);
        navigate(`/patients/${data.id}`);
      }
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement. Vérifiez que le nom et le prénom sont bien renseignés.");
    }
  };

  if (chargement) return <p>Chargement...</p>;

  return (
    <div className="conteneur-page" style={{ maxWidth: 700 }}>
      <h1 className={styles.titre}>{modeEdition ? "Modifier le patient" : "Nouveau patient"}</h1>

      {erreur && (
        <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`carte-moderne ${styles.section}`}>
          <div className={styles.sectionTitre}>Identité</div>
          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Nom *</label>
              <input {...champ("nom")} required />
            </div>
            <div className="champ-formulaire">
              <label>Prénom *</label>
              <input {...champ("prenom")} required />
            </div>
            <div className="champ-formulaire">
              <label>Âge</label>
              <input type="number" {...champ("age")} />
            </div>
            <div className="champ-formulaire">
              <label>Sexe</label>
              <select {...champ("sexe")}>
                <option value="">—</option>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Profession</label>
              <input {...champ("profession")} />
            </div>
            <div className="champ-formulaire">
              <label>Téléphone</label>
              <input {...champ("telephone")} />
            </div>
            <div className={`champ-formulaire ${styles.pleineLargeur}`}>
              <label>Adresse</label>
              <input {...champ("adresse")} />
            </div>
          </div>
        </div>

        {accesClinique && (
          <div className={`carte-moderne ${styles.section}`}>
            <div className={styles.sectionTitre}>Informations cliniques</div>
            <div className="champ-formulaire">
              <label>Motif de consultation</label>
              <textarea rows={4} {...champ("motif")} />
            </div>
            <div className="champ-formulaire">
              <label>Soins</label>
              <textarea rows={5} {...champ("soins")} />
            </div>
            <div className="champ-formulaire">
              <label>Allergies</label>
              <textarea rows={3} {...champ("allergies")} />
            </div>
            <div className="champ-formulaire">
              <label>Antécédents médicaux</label>
              <textarea rows={5} {...champ("antecedents_medicaux")} />
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className="bouton-secondaire" onClick={() => navigate(-1)}>Annuler</button>
          <button type="submit" className="bouton-primaire">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}