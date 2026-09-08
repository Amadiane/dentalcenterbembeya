import { useEffect, useState } from "react";
import { Plus, X, ScanLine, Trash2, Pencil } from "lucide-react";
import { radiographieService } from "../services/radiographieService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import styles from "../theme/pages/patients/SectionRadiographies.module.css";

const ROLES_ACCES = ["administrateur_general", "medecin_chef", "medecin", "infirmier", "hygieniste"];

const TYPES_CLICHE = [
  ["retro_alveolaire", "Rétro-alvéolaire"],
  ["panoramique", "Panoramique"],
  ["bite_wing", "Bite-wing"],
  ["cbct_3d", "CBCT / 3D"],
  ["autre", "Autre"],
];

export default function SectionRadiographies({ patientId }) {
  const { utilisateur } = useAuth();
  const accesAutorise = ROLES_ACCES.includes(utilisateur?.role);

  const [radios, setRadios] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [radioOuverte, setRadioOuverte] = useState(null);

  const [fichier, setFichier] = useState(null);
  const [typeCliche, setTypeCliche] = useState("retro_alveolaire");
  const [dentConcernee, setDentConcernee] = useState("");
  const [notes, setNotes] = useState("");
  const [dateCliche, setDateCliche] = useState(new Date().toISOString().slice(0, 10));
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const [modeEdition, setModeEdition] = useState(false);
  const [editionTypeCliche, setEditionTypeCliche] = useState("");
  const [editionDentConcernee, setEditionDentConcernee] = useState("");
  const [editionNotes, setEditionNotes] = useState("");
  const [editionDateCliche, setEditionDateCliche] = useState("");

  const [confirmationRetrait, setConfirmationRetrait] = useState(null);

  const charger = () => {
    if (!accesAutorise) { setChargement(false); return; }
    setChargement(true);
    radiographieService.lister({ patient: patientId })
      .then(({ data }) => setRadios(data.results || data))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, [patientId]);

  if (!accesAutorise) return null;

  const envoyerRadio = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!fichier) {
      setErreur("Sélectionnez une image avant d'enregistrer.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const formData = new FormData();
      formData.append("patient", patientId);
      formData.append("image", fichier);
      formData.append("type_cliche", typeCliche);
      formData.append("dent_concernee", dentConcernee);
      formData.append("notes", notes);
      formData.append("date_cliche", dateCliche);
      await radiographieService.creer(formData);
      setFichier(null);
      setDentConcernee("");
      setNotes("");
      setAfficherFormulaire(false);
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'envoi de l'image. Vérifiez le format (JPEG/PNG) et réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const confirmerRetrait = async () => {
    await radiographieService.retirer(confirmationRetrait.id);
    setConfirmationRetrait(null);
    setRadioOuverte(null);
    charger();
  };

  const ouvrirEdition = (radio) => {
    setEditionTypeCliche(radio.type_cliche);
    setEditionDentConcernee(radio.dent_concernee || "");
    setEditionNotes(radio.notes || "");
    setEditionDateCliche(radio.date_cliche || "");
    setModeEdition(true);
  };

  const enregistrerEdition = async () => {
    await radiographieService.modifier(radioOuverte.id, {
      type_cliche: editionTypeCliche,
      dent_concernee: editionDentConcernee,
      notes: editionNotes,
      date_cliche: editionDateCliche,
    });
    setModeEdition(false);
    setRadioOuverte(null);
    charger();
  };

  return (
    <div className="carte-moderne" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--couleur-primaire)", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
          <ScanLine size={16} /> Radiographies ({radios.length})
        </div>
        <button onClick={() => setAfficherFormulaire((v) => !v)} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15} /> Ajouter un cliché
        </button>
      </div>

      {afficherFormulaire && (
        <form onSubmit={envoyerRadio} className={styles.formulaireUpload}>
          {erreur && (
            <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>
              {erreur}
            </div>
          )}

          <div className="champ-formulaire">
            <label>Image *</label>
            <input type="file" accept="image/jpeg,image/png" onChange={(e) => setFichier(e.target.files[0])} required />
          </div>

          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Type de cliché</label>
              <select value={typeCliche} onChange={(e) => setTypeCliche(e.target.value)}>
                {TYPES_CLICHE.map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>{libelle}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Date du cliché</label>
              <input type="date" value={dateCliche} onChange={(e) => setDateCliche(e.target.value)} />
            </div>
          </div>

          <div className="champ-formulaire">
            <label>Dent(s) concernée(s)</label>
            <input value={dentConcernee} onChange={(e) => setDentConcernee(e.target.value)} placeholder="ex. 26, 36-37, arcade complète..." />
          </div>

          <div className="champ-formulaire" style={{ marginBottom: 12 }}>
            <label>Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button type="submit" className="bouton-primaire" disabled={envoiEnCours}>
            {envoiEnCours ? "Envoi en cours..." : "Enregistrer le cliché"}
          </button>
        </form>
      )}

      {chargement && <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Chargement...</p>}
      {!chargement && radios.length === 0 && !afficherFormulaire && (
        <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Aucune radiographie enregistrée pour ce patient.</p>
      )}

      {radios.length > 0 && (
        <div className={styles.grille}>
          {radios.map((r) => (
            <div key={r.id} className={styles.vignette} onClick={() => setRadioOuverte(r)}>
              <img src={r.image_url} alt={r.type_cliche_affiche} loading="lazy" />
              <div className={styles.badgeType}>{r.type_cliche_affiche}</div>
            </div>
          ))}
        </div>
      )}

      {radioOuverte && (
        <div className={styles.visionneuse} onClick={() => { setRadioOuverte(null); setModeEdition(false); }}>
          <button className={styles.visionneuseFermer} onClick={() => { setRadioOuverte(null); setModeEdition(false); }}>
            <X size={20} />
          </button>
          <img src={radioOuverte.image_url} alt={radioOuverte.type_cliche_affiche} className={styles.visionneuseImage} onClick={(e) => e.stopPropagation()} />

          {!modeEdition ? (
            <div className={styles.visionneuseInfos} onClick={(e) => e.stopPropagation()}>
              <span>{radioOuverte.type_cliche_affiche}</span>
              {radioOuverte.dent_concernee && <span>Dent(s) : {radioOuverte.dent_concernee}</span>}
              {radioOuverte.date_cliche && <span>{new Date(radioOuverte.date_cliche).toLocaleDateString("fr-FR")}</span>}
              <button onClick={() => ouvrirEdition(radioOuverte)} style={{ background: "transparent", border: "none", color: "#8fd4e8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Pencil size={14} /> Modifier
              </button>
              <button onClick={() => setConfirmationRetrait(radioOuverte)} style={{ background: "transparent", border: "none", color: "#ff8080", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={14} /> Retirer
              </button>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#fff", borderRadius: 12, padding: 18, width: 320, maxWidth: "90vw" }}
            >
              <div className="champ-formulaire">
                <label>Type de cliché</label>
                <select value={editionTypeCliche} onChange={(e) => setEditionTypeCliche(e.target.value)}>
                  {TYPES_CLICHE.map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>{libelle}</option>
                  ))}
                </select>
              </div>
              <div className="champ-formulaire">
                <label>Dent(s) concernée(s)</label>
                <input value={editionDentConcernee} onChange={(e) => setEditionDentConcernee(e.target.value)} />
              </div>
              <div className="champ-formulaire">
                <label>Date du cliché</label>
                <input type="date" value={editionDateCliche} onChange={(e) => setEditionDateCliche(e.target.value)} />
              </div>
              <div className="champ-formulaire" style={{ marginBottom: 12 }}>
                <label>Notes</label>
                <textarea rows={2} value={editionNotes} onChange={(e) => setEditionNotes(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="bouton-secondaire" onClick={() => setModeEdition(false)}>Annuler</button>
                <button type="button" className="bouton-primaire" onClick={enregistrerEdition}>Enregistrer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmationRetrait && (
        <ConfirmModal
          titre="Retirer le cliché"
          message="Retirer ce cliché ? Il ne sera plus visible dans la liste, mais reste conservé pour la traçabilité."
          texteConfirmation="Retirer le cliché"
          dangereux
          onConfirmer={confirmerRetrait}
          onAnnuler={() => setConfirmationRetrait(null)}
        />
      )}
    </div>
  );
}