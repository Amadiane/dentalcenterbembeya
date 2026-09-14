import { useEffect, useState } from "react";
import { Plus, X, ClipboardList, Trash2, Check } from "lucide-react";
import { plansTraitementService } from "../services/plansTraitementService";
import { actesService } from "../services/actesService";
import { utilisateursService } from "../services/utilisateursService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import styles from "../theme/pages/patients/SectionPlansTraitement.module.css";

const ROLES_CONSULTATION = ["administrateur_general", "medecin_chef", "medecin", "infirmier", "hygieniste"];
const ROLES_GESTION = ["administrateur_general", "medecin_chef", "medecin"];

const BADGES = {
  en_cours: styles.badgeEnCours,
  termine: styles.badgeTermine,
  abandonne: styles.badgeAbandonne,
};

export default function SectionPlansTraitement({ patientId }) {
  const { utilisateur } = useAuth();
  const accesConsultation = ROLES_CONSULTATION.includes(utilisateur?.role);
  const accesGestion = ROLES_GESTION.includes(utilisateur?.role);

  const [plans, setPlans] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [planOuvertId, setPlanOuvertId] = useState(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [actesDisponibles, setActesDisponibles] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [confirmationAbandon, setConfirmationAbandon] = useState(null);

  const [praticien, setPraticien] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = () => {
    if (!accesConsultation) { setChargement(false); return; }
    setChargement(true);
    plansTraitementService.lister({ patient: patientId })
      .then(({ data }) => setPlans(data.results || data))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, [patientId]);

  useEffect(() => {
    if (!accesGestion) return;
    actesService.lister().then(({ data }) => setActesDisponibles(data.results || data));
    utilisateursService.medecins().then(({ data }) => setMedecins(data));
  }, [accesGestion]);

  useEffect(() => {
    if (afficherFormulaire && actesDisponibles.length > 0 && lignes.length === 0) {
      setLignes([{ acte: actesDisponibles[0].id, dent_concernee: "", realise: false }]);
    }
  }, [afficherFormulaire, actesDisponibles]);

  if (!accesConsultation) return null;

  const ajouterLigne = () => {
    if (actesDisponibles.length === 0) return;
    setLignes((l) => [...l, { acte: actesDisponibles[0].id, dent_concernee: "", realise: false }]);
  };

  const modifierLigne = (index, champ, valeur) => {
    setLignes((l) => l.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)));
  };

  const supprimerLigne = (index) => {
    setLignes((l) => l.filter((_, i) => i !== index));
  };

  const creerPlan = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!praticien) { setErreur("Sélectionnez un praticien."); return; }
    if (lignes.length === 0) { setErreur("Ajoutez au moins un acte au plan."); return; }

    setEnregistrement(true);
    try {
      await plansTraitementService.creer({
        patient: patientId,
        praticien,
        diagnostic,
        notes,
        date_creation_plan: new Date().toISOString().slice(0, 10),
        lignes,
      });
      setAfficherFormulaire(false);
      setPraticien(""); setDiagnostic(""); setNotes(""); setLignes([]);
      charger();
    } catch (err) {
      setErreur("Erreur lors de la création du plan de traitement.");
    } finally {
      setEnregistrement(false);
    }
  };

  const basculerLigneRealisee = async (plan, ligne) => {
    const nouvellesLignes = plan.lignes.map((l) =>
      l.id === ligne.id
        ? { ...l, realise: !l.realise, date_realisation: !l.realise ? new Date().toISOString().slice(0, 10) : null }
        : l
    );
    await plansTraitementService.modifier(plan.id, {
      lignes: nouvellesLignes.map((l) => ({
        acte: l.acte, dent_concernee: l.dent_concernee, realise: l.realise, date_realisation: l.date_realisation, notes: l.notes,
      })),
    });
    charger();
  };

  const confirmerAbandon = async () => {
    await plansTraitementService.abandonner(confirmationAbandon.id);
    setConfirmationAbandon(null);
    setPlanOuvertId(null);
    charger();
  };

  return (
    <div className="carte-moderne" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--couleur-primaire)", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={16} /> Plans de traitement ({plans.length})
        </div>
        {accesGestion && (
          <button onClick={() => setAfficherFormulaire((v) => !v)} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Nouveau plan
          </button>
        )}
      </div>

      {afficherFormulaire && (
        <form onSubmit={creerPlan} style={{ marginTop: 14, padding: 16, background: "var(--couleur-fond)", borderRadius: 10 }}>
          {erreur && (
            <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>
              {erreur}
            </div>
          )}

          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Praticien *</label>
              <select value={praticien} onChange={(e) => setPraticien(e.target.value)} required>
                <option value="">Sélectionner...</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Diagnostic</label>
              <input type="text" value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Actes du plan</span>
            <button type="button" onClick={ajouterLigne} className="bouton-secondaire" style={{ fontSize: 12, padding: "6px 10px" }}>
              + Ajouter un acte
            </button>
          </div>

          <table className={styles.tableauLignes}>
            <thead>
              <tr><th>Acte</th><th style={{ width: "25%" }}>Dent(s)</th><th style={{ width: 40 }}></th></tr>
            </thead>
            <tbody>
              {lignes.map((ligne, index) => (
                <tr key={index}>
                  <td>
                    <select value={ligne.acte} onChange={(e) => modifierLigne(index, "acte", e.target.value)}>
                      {actesDisponibles.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.nom}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="text" value={ligne.dent_concernee} onChange={(e) => modifierLigne(index, "dent_concernee", e.target.value)} />
                  </td>
                  <td>
                    <button type="button" onClick={() => supprimerLigne(index)} style={{ background: "transparent", border: "none", color: "var(--couleur-danger)", cursor: "pointer" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="champ-formulaire" style={{ marginBottom: 12 }}>
            <label>Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="bouton-secondaire" onClick={() => setAfficherFormulaire(false)}>Annuler</button>
            <button type="submit" className="bouton-primaire" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : "Créer le plan"}
            </button>
          </div>
        </form>
      )}

      {chargement && <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Chargement...</p>}
      {!chargement && plans.length === 0 && !afficherFormulaire && (
        <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, marginTop: 12 }}>Aucun plan de traitement enregistré pour ce patient.</p>
      )}

      {plans.map((plan) => (
        <div key={plan.id}>
          <div className={styles.entetePlan} onClick={() => setPlanOuvertId(planOuvertId === plan.id ? null : plan.id)}>
            <div>
              <div className={styles.numeroPlan}>{plan.numero_plan} — Dr {plan.praticien_nom}</div>
              <div className={styles.datePlan}>{new Date(plan.date_creation_plan).toLocaleDateString("fr-FR")} · {plan.diagnostic || "Sans diagnostic renseigné"}</div>
              <div className={styles.barreProgression}>
                <div className={styles.barreProgressionRemplie} style={{ width: `${plan.progression}%` }} />
              </div>
            </div>
            <span className={`${styles.badge} ${BADGES[plan.statut]}`}>{plan.statut_affiche} · {plan.progression}%</span>
          </div>

          {planOuvertId === plan.id && (
            <div style={{ padding: "10px 0 16px" }}>
              <table className={styles.tableauLignes}>
                <thead>
                  <tr><th>Acte</th><th>Dent(s)</th><th>Réalisé</th></tr>
                </thead>
                <tbody>
                  {plan.lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className={ligne.realise ? styles.ligneRealisee : ""}>{ligne.nom_acte}</td>
                      <td className={ligne.realise ? styles.ligneRealisee : ""}>{ligne.dent_concernee || "—"}</td>
                      <td>
                        {accesGestion ? (
                          <button
                            onClick={() => basculerLigneRealisee(plan, ligne)}
                            style={{ background: ligne.realise ? "var(--couleur-succes)" : "transparent", border: "1px solid var(--couleur-bordure)", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: ligne.realise ? "#fff" : "var(--couleur-texte-attenue)" }}
                          >
                            <Check size={14} />
                          </button>
                        ) : (
                          ligne.realise ? "✓" : "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {plan.notes && <p style={{ fontSize: 13, color: "var(--couleur-texte-attenue)", marginTop: 8 }}>Notes : {plan.notes}</p>}
              {accesGestion && plan.statut === "en_cours" && (
                <button onClick={() => setConfirmationAbandon(plan)} className="bouton-secondaire" style={{ color: "var(--couleur-danger)", fontSize: 12, marginTop: 8 }}>
                  Abandonner ce plan
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {confirmationAbandon && (
        <ConfirmModal
          titre="Abandonner le plan de traitement"
          message={`Abandonner le plan ${confirmationAbandon.numero_plan} ? Il restera visible dans l'historique du patient, marqué comme abandonné.`}
          texteConfirmation="Abandonner le plan"
          dangereux
          onConfirmer={confirmerAbandon}
          onAnnuler={() => setConfirmationAbandon(null)}
        />
      )}
    </div>
  );
}