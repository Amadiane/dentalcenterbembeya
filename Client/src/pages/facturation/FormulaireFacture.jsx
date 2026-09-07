import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import { facturationService } from "../../services/facturationService";
import { patientsService } from "../../services/patientsService";
import { actesService } from "../../services/actesService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/facturation/FormulaireFacture.module.css";

const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(Math.round(montant || 0)) + " GNF";

export default function FormulaireFacture() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const estAdminGeneral = utilisateur?.role === "administrateur_general";

  const [rechercheTexte, setRechercheTexte] = useState("");
  const [resultatsPatients, setResultatsPatients] = useState([]);
  const [patientChoisi, setPatientChoisi] = useState(null);

  const [actesDisponibles, setActesDisponibles] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [remiseGlobale, setRemiseGlobale] = useState(0);
  const [motifRemise, setMotifRemise] = useState("");
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    actesService.lister().then(({ data }) => setActesDisponibles(data.results || data));
  }, []);

  // Première ligne pré-remplie automatiquement dès que le catalogue est chargé
  useEffect(() => {
    if (actesDisponibles.length > 0 && lignes.length === 0) {
      setLignes([{ acte: actesDisponibles[0].id, quantite: 1, remise_pourcentage: 0 }]);
    }
  }, [actesDisponibles]);

  useEffect(() => {
    if (rechercheTexte.length < 2) { setResultatsPatients([]); return; }
    const delai = setTimeout(() => {
      patientsService.lister({ search: rechercheTexte }).then(({ data }) => {
        setResultatsPatients((data.results || data).slice(0, 6));
      });
    }, 300);
    return () => clearTimeout(delai);
  }, [rechercheTexte]);

  const ajouterLigne = () => {
    if (actesDisponibles.length === 0) return;
    const premierActe = actesDisponibles[0];
    setLignes((l) => [...l, { acte: premierActe.id, quantite: 1, remise_pourcentage: 0 }]);
  };

  const modifierLigne = (index, champ, valeur) => {
    setLignes((l) => l.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)));
  };

  const supprimerLigne = (index) => {
    setLignes((l) => l.filter((_, i) => i !== index));
  };

  const acteDeLaLigne = (ligne) => actesDisponibles.find((a) => a.id === Number(ligne.acte));

  const sousTotalLigne = (ligne) => {
    const acte = acteDeLaLigne(ligne);
    if (!acte) return 0;
    const brut = acte.tarif * Number(ligne.quantite || 1);
    return brut * (100 - Number(ligne.remise_pourcentage || 0)) / 100;
  };

  const montantAvantRemiseGlobale = lignes.reduce((somme, l) => somme + sousTotalLigne(l), 0);
  const montantTotal = montantAvantRemiseGlobale * (100 - Number(remiseGlobale || 0)) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!patientChoisi) {
      setErreur("Sélectionnez un patient avant d'enregistrer.");
      return;
    }
    if (lignes.length === 0) {
      setErreur("Ajoutez au moins un acte à la facture.");
      return;
    }

    setEnregistrement(true);
    try {
      const { data } = await facturationService.creer({
        patient: patientChoisi.id,
        date_emission: dateEmission,
        notes,
        remise_globale_pourcentage: remiseGlobale,
        motif_remise: motifRemise,
        lignes: lignes.map((l) => ({ acte: l.acte, quantite: l.quantite, remise_pourcentage: l.remise_pourcentage })),
      });
      navigate(`/facturation/${data.id}`);
    } catch (err) {
      const messageApi = err.response?.data?.remise_globale_pourcentage || err.response?.data?.lignes;
      setErreur(
        Array.isArray(messageApi) ? messageApi[0]
          : messageApi || "Erreur lors de l'enregistrement de la facture."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <div className="conteneur-page" style={{ maxWidth: 800 }}>
      <h1 className={styles.titre}>Nouvelle facture</h1>

      {erreur && (
        <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div className="champ-formulaire">
            <label>Patient *</label>
            {patientChoisi ? (
              <div className={styles.patientChoisi}>
                <span>{patientChoisi.numero_dossier} — {patientChoisi.nom} {patientChoisi.prenom}</span>
                <button type="button" onClick={() => setPatientChoisi(null)} className="bouton-secondaire">Changer</button>
              </div>
            ) : (
              <div className={styles.rechercheZone}>
                <input
                  type="text"
                  placeholder="Rechercher un patient par nom ou numéro de dossier..."
                  value={rechercheTexte}
                  onChange={(e) => setRechercheTexte(e.target.value)}
                />
                {rechercheTexte.length >= 2 && (
                  <div className={styles.resultatsRecherche}>
                    {resultatsPatients.length === 0 ? (
                      <div className={styles.resultatItem} style={{ color: "var(--couleur-texte-attenue)", cursor: "default" }}>
                        Aucun patient trouvé pour "{rechercheTexte}"
                      </div>
                    ) : (
                      resultatsPatients.map((p) => (
                        <div key={p.id} className={styles.resultatItem} onClick={() => { setPatientChoisi(p); setRechercheTexte(""); setResultatsPatients([]); }}>
                          {p.numero_dossier} — {p.nom} {p.prenom}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="champ-formulaire">
            <label>Date d'émission</label>
            <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} />
          </div>
        </div>

        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "var(--couleur-primaire-fonce)" }}>Actes facturés</div>
            <button type="button" onClick={ajouterLigne} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Ajouter un acte
            </button>
          </div>

          {lignes.length === 0 && (
            <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13 }}>Aucun acte ajouté pour l'instant.</p>
          )}

          {lignes.length > 0 && (
            <table className={styles.tableauLignes}>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Acte</th>
                  <th style={{ width: "12%" }}>Qté</th>
                  <th style={{ width: "15%" }}>Remise %</th>
                  <th style={{ width: "20%" }}>Sous-total</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, index) => (
                  <tr key={index}>
                    <td>
                      <select value={ligne.acte} onChange={(e) => modifierLigne(index, "acte", e.target.value)}>
                        {actesDisponibles.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.nom} ({formaterGNF(a.tarif)})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input type="number" min="1" value={ligne.quantite} onChange={(e) => modifierLigne(index, "quantite", e.target.value)} />
                    </td>
                    <td>
                      <input
                        type="number" min="0" max="100" value={ligne.remise_pourcentage}
                        onChange={(e) => modifierLigne(index, "remise_pourcentage", e.target.value)}
                        disabled={!estAdminGeneral}
                        title={!estAdminGeneral ? "Seul l'administrateur général peut accorder une remise" : ""}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{formaterGNF(sousTotalLigne(ligne))}</td>
                    <td>
                      <button type="button" onClick={() => supprimerLigne(index)} className={styles.boutonSupprimerLigne}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {estAdminGeneral && (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginTop: 10, flexWrap: "wrap" }}>
              <div className="champ-formulaire" style={{ marginBottom: 0, width: 160 }}>
                <label>Remise globale (%)</label>
                <input type="number" min="0" max="100" value={remiseGlobale} onChange={(e) => setRemiseGlobale(e.target.value)} />
              </div>
              <div className="champ-formulaire" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                <label>Motif de la remise</label>
                <input value={motifRemise} onChange={(e) => setMotifRemise(e.target.value)} placeholder="ex. geste commercial, patient fidèle..." />
              </div>
            </div>
          )}

          <div className={styles.resume}>
            {Number(remiseGlobale) > 0 && (
              <>
                <div className={styles.ligneResume}>
                  <span>Sous-total</span><span>{formaterGNF(montantAvantRemiseGlobale)}</span>
                </div>
                <div className={styles.ligneResume}>
                  <span>Remise globale ({remiseGlobale}%)</span>
                  <span>- {formaterGNF(montantAvantRemiseGlobale - montantTotal)}</span>
                </div>
              </>
            )}
            <div className={styles.ligneResumeTotal}>
              <span>Total</span><span>{formaterGNF(montantTotal)}</span>
            </div>
          </div>
        </div>

        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div className="champ-formulaire" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="bouton-secondaire" onClick={() => navigate("/facturation")}>Annuler</button>
          <button type="submit" className="bouton-primaire" disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : "Créer la facture"}
          </button>
        </div>
      </form>
    </div>
  );
}