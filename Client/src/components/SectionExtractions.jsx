import { useEffect, useState } from "react";
import { Plus, Scissors } from "lucide-react";
import { extractionsService } from "../services/extractionsService";
import { plansTraitementService } from "../services/plansTraitementService";
import { utilisateursService } from "../services/utilisateursService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import styles from "../theme/pages/patients/SectionExtractions.module.css";

const ROLES_CONSULTATION = ["administrateur_general", "medecin_chef", "medecin", "infirmier", "hygieniste"];
const ROLES_GESTION = ["administrateur_general", "medecin_chef", "medecin"];

const TYPES_EXTRACTION = [
  ["simple", "Extraction simple"],
  ["chirurgicale", "Extraction chirurgicale"],
  ["dent_sagesse", "Dent de sagesse"],
  ["autre", "Autre"],
];

const BADGES = {
  planifiee: styles.badgePlanifiee,
  realisee: styles.badgeRealisee,
  annulee: styles.badgeAnnulee,
};

export default function SectionExtractions({ patientId }) {
  const { utilisateur } = useAuth();
  const accesConsultation = ROLES_CONSULTATION.includes(utilisateur?.role);
  const accesGestion = ROLES_GESTION.includes(utilisateur?.role);

  const [extractions, setExtractions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [extractionOuverteId, setExtractionOuverteId] = useState(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [medecins, setMedecins] = useState([]);
  const [plans, setPlans] = useState([]);
  const [confirmationAnnulation, setConfirmationAnnulation] = useState(null);

  const [valeurs, setValeurs] = useState({
    praticien: "", plan_traitement: "", date_intervention: new Date().toISOString().slice(0, 10),
    dent_concernee: "", type_extraction: "simple", anesthesie: "",
    consentement_obtenu: false, consentement_details: "", compte_rendu: "", prescriptions: "",
  });
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = () => {
    if (!accesConsultation) { setChargement(false); return; }
    setChargement(true);
    extractionsService.lister({ patient: patientId })
      .then(({ data }) => setExtractions(data.results || data))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, [patientId]);

  useEffect(() => {
    if (!accesGestion) return;
    utilisateursService.medecins().then(({ data }) => setMedecins(data));
    plansTraitementService.lister({ patient: patientId }).then(({ data }) => setPlans(data.results || data));
  }, [accesGestion, patientId]);

  if (!accesConsultation) return null;

  const champ = (nom) => ({
    value: valeurs[nom] ?? "",
    onChange: (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
  });

  const creerExtraction = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!valeurs.praticien || !valeurs.dent_concernee) {
      setErreur("Le praticien et la dent concernée sont obligatoires.");
      return;
    }
    setEnregistrement(true);
    try {
      await extractionsService.creer({
        ...valeurs,
        patient: patientId,
        plan_traitement: valeurs.plan_traitement || null,
      });
      setAfficherFormulaire(false);
      setValeurs({
        praticien: "", plan_traitement: "", date_intervention: new Date().toISOString().slice(0, 10),
        dent_concernee: "", type_extraction: "simple", anesthesie: "",
        consentement_obtenu: false, consentement_details: "", compte_rendu: "", prescriptions: "",
      });
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement de l'extraction.");
    } finally {
      setEnregistrement(false);
    }
  };

  const marquerRealisee = async (extraction) => {
    await extractionsService.modifier(extraction.id, { statut: "realisee" });
    charger();
  };

  const confirmerAnnulation = async () => {
    await extractionsService.annuler(confirmationAnnulation.id);
    setConfirmationAnnulation(null);
    setExtractionOuverteId(null);
    charger();
  };

  return (
    <div className="carte-moderne" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--couleur-primaire)", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
          <Scissors size={16} /> Extractions ({extractions.length})
        </div>
        {accesGestion && (
          <button onClick={() => setAfficherFormulaire((v) => !v)} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Nouvelle extraction
          </button>
        )}
      </div>

      {afficherFormulaire && (
        <form onSubmit={creerExtraction} style={{ marginTop: 14, padding: 16, background: "var(--couleur-fond)", borderRadius: 10 }}>
          {erreur && (
            <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>
              {erreur}
            </div>
          )}

          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Praticien *</label>
              <select {...champ("praticien")} required>
                <option value="">Sélectionner...</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Plan de traitement lié (optionnel)</label>
              <select {...champ("plan_traitement")}>
                <option value="">Aucun</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.numero_plan}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Date de l'intervention</label>
              <input type="date" {...champ("date_intervention")} />
            </div>
            <div className="champ-formulaire">
              <label>Dent(s) concernée(s) *</label>
              <input {...champ("dent_concernee")} placeholder="ex. 38" required />
            </div>
            <div className="champ-formulaire">
              <label>Type d'extraction</label>
              <select {...champ("type_extraction")}>
                {TYPES_EXTRACTION.map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>{libelle}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Anesthésie</label>
              <input {...champ("anesthesie")} placeholder="ex. locale, articaïne 4%..." />
            </div>
          </div>

          <label className={styles.caseConsentement}>
            <input
              type="checkbox"
              checked={valeurs.consentement_obtenu}
              onChange={(e) => setValeurs((v) => ({ ...v, consentement_obtenu: e.target.checked }))}
            />
            Consentement éclairé obtenu
          </label>

          <div className="champ-formulaire">
            <label>Détails du consentement</label>
            <textarea rows={2} {...champ("consentement_details")} placeholder="Informations données au patient, date..." />
          </div>

          <div className="champ-formulaire">
            <label>Compte-rendu opératoire</label>
            <textarea rows={2} {...champ("compte_rendu")} />
          </div>

          <div className="champ-formulaire" style={{ marginBottom: 12 }}>
            <label>Prescriptions post-opératoires</label>
            <textarea rows={2} {...champ("prescriptions")} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="bouton-secondaire" onClick={() => setAfficherFormulaire(false)}>Annuler</button>
            <button type="submit" className="bouton-primaire" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : "Enregistrer l'extraction"}
            </button>
          </div>
        </form>
      )}

      {chargement && <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Chargement...</p>}
      {!chargement && extractions.length === 0 && !afficherFormulaire && (
        <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Aucune extraction enregistrée pour ce patient.</p>
      )}

      {extractions.map((ext) => (
        <div key={ext.id}>
          <div className={styles.enteteExtraction} onClick={() => setExtractionOuverteId(extractionOuverteId === ext.id ? null : ext.id)}>
            <div>
              <div className={styles.numero}>{ext.numero_extraction} — Dent {ext.dent_concernee}</div>
              <div className={styles.sousInfo}>
                {new Date(ext.date_intervention).toLocaleDateString("fr-FR")} · {ext.type_extraction_affiche} · Dr {ext.praticien_nom}
              </div>
            </div>
            <span className={`${styles.badge} ${BADGES[ext.statut]}`}>{ext.statut_affiche}</span>
          </div>

          {extractionOuverteId === ext.id && (
            <div className={styles.detail}>
              <div className={styles.ligneDetail}>
                <div className={styles.labelDetail}>Anesthésie</div>
                <div>{ext.anesthesie || "—"}</div>
              </div>
              <div className={styles.ligneDetail}>
                <div className={styles.labelDetail}>Consentement</div>
                <div>{ext.consentement_obtenu ? "✓ Obtenu" : "Non renseigné"} {ext.consentement_details && `— ${ext.consentement_details}`}</div>
              </div>
              <div className={styles.ligneDetail}>
                <div className={styles.labelDetail}>Compte-rendu opératoire</div>
                <div>{ext.compte_rendu || "—"}</div>
              </div>
              <div className={styles.ligneDetail}>
                <div className={styles.labelDetail}>Prescriptions</div>
                <div>{ext.prescriptions || "—"}</div>
              </div>
              {ext.plan_traitement_numero && (
                <div className={styles.ligneDetail}>
                  <div className={styles.labelDetail}>Plan de traitement lié</div>
                  <div>{ext.plan_traitement_numero}</div>
                </div>
              )}

              {accesGestion && ext.statut === "planifiee" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => marquerRealisee(ext)} className="bouton-primaire" style={{ fontSize: 12 }}>
                    Marquer comme réalisée
                  </button>
                  <button onClick={() => setConfirmationAnnulation(ext)} className="bouton-secondaire" style={{ color: "var(--couleur-danger)", fontSize: 12 }}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {confirmationAnnulation && (
        <ConfirmModal
          titre="Annuler l'extraction"
          message={`Annuler l'extraction ${confirmationAnnulation.numero_extraction} ? Elle restera visible dans l'historique, marquée comme annulée.`}
          texteConfirmation="Annuler l'extraction"
          dangereux
          onConfirmer={confirmerAnnulation}
          onAnnuler={() => setConfirmationAnnulation(null)}
        />
      )}
    </div>
  );
}