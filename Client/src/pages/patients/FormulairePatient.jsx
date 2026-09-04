import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { patientsService } from "../../services/patientsService";

const VIDE = {
  nom: "", prenom: "", age: "", sexe: "", profession: "", adresse: "",
  telephone: "", email: "", motif: "", soins: "", allergies: "", antecedents_medicaux: "",
};

export default function FormulairePatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modeEdition = Boolean(id);

  const [valeurs, setValeurs] = useState(VIDE);
  const [chargement, setChargement] = useState(modeEdition);

  useEffect(() => {
    if (!modeEdition) return;
    patientsService.obtenir(id).then(({ data }) => setValeurs({ ...VIDE, ...data })).finally(() => setChargement(false));
  }, [id, modeEdition]);

  const champ = (nom) => ({
    value: valeurs[nom] ?? "",
    onChange: (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modeEdition) await patientsService.modifier(id, valeurs);
    else await patientsService.creer(valeurs);
    navigate("/patients");
  };

  if (chargement) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>{modeEdition ? "Modifier le patient" : "Nouveau patient"}</h1>
      <form onSubmit={handleSubmit}>
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
          <label>Adresse</label>
          <input {...champ("adresse")} />
        </div>
        <div className="champ-formulaire">
          <label>Téléphone</label>
          <input {...champ("telephone")} />
        </div>
        <div className="champ-formulaire">
          <label>Motif de consultation</label>
          <textarea rows={2} {...champ("motif")} />
        </div>
        <div className="champ-formulaire">
          <label>Soins</label>
          <textarea rows={2} {...champ("soins")} />
        </div>
        <div className="champ-formulaire">
          <label>Allergies</label>
          <textarea rows={2} {...champ("allergies")} />
        </div>

        <button type="submit" className="bouton-primaire">Enregistrer</button>
      </form>
    </div>
  );
}