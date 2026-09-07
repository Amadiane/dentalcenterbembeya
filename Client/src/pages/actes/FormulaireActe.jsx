import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { actesService } from "../../services/actesService";

const CATEGORIES = [
  ["consultation", "Consultation"],
  ["soin_conservateur", "Soin conservateur"],
  ["endodontie", "Endodontie"],
  ["chirurgie", "Chirurgie / extraction"],
  ["prothese", "Prothèse dentaire"],
  ["orthodontie", "Orthodontie"],
  ["radiographie", "Radiographie / imagerie"],
  ["autre", "Autre"],
];

export default function FormulaireActe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modeEdition = Boolean(id);

  const [valeurs, setValeurs] = useState({
    code: "", nom: "", description: "", categorie: "autre",
    tarif: "", duree_estimee_minutes: 30,
  });
  const [chargement, setChargement] = useState(modeEdition);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!modeEdition) return;
    actesService.obtenir(id).then(({ data }) => setValeurs(data)).finally(() => setChargement(false));
  }, [id, modeEdition]);

  const champ = (nom) => ({
    value: valeurs[nom] ?? "",
    onChange: (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      if (modeEdition) await actesService.modifier(id, valeurs);
      else await actesService.creer(valeurs);
      navigate("/actes");
    } catch (err) {
      const messageCode = err.response?.data?.code;
      setErreur(
        Array.isArray(messageCode) ? messageCode[0]
          : "Erreur lors de l'enregistrement. Vérifiez que le code est unique et que tous les champs obligatoires sont remplis."
      );
    }
  };

  if (chargement) return <p>Chargement...</p>;

  return (
    <div className="conteneur-page" style={{ maxWidth: 550 }}>
      <h1 style={{ fontSize: 24, color: "var(--couleur-primaire-fonce)", marginBottom: 24 }}>
        {modeEdition ? "Modifier l'acte" : "Nouvel acte"}
      </h1>

      {erreur && (
        <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div className="champ-formulaire">
            <label>Code *</label>
            <input {...champ("code")} placeholder="ex. DET-01" required />
          </div>
          <div className="champ-formulaire">
            <label>Nom *</label>
            <input {...champ("nom")} required />
          </div>
          <div className="champ-formulaire">
            <label>Catégorie</label>
            <select {...champ("categorie")}>
              {CATEGORIES.map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </div>
          <div className="champ-formulaire">
            <label>Tarif (GNF) *</label>
            <input type="number" min="0" {...champ("tarif")} required />
          </div>
          <div className="champ-formulaire">
            <label>Durée estimée (minutes)</label>
            <input type="number" min="5" step="5" {...champ("duree_estimee_minutes")} />
          </div>
          <div className="champ-formulaire">
            <label>Description</label>
            <textarea rows={3} {...champ("description")} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="bouton-secondaire" onClick={() => navigate("/actes")}>Annuler</button>
          <button type="submit" className="bouton-primaire">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}