import { useEffect, useState, useCallback } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { comptabiliteService } from "../../services/comptabiliteService";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "../../theme/pages/comptabilite/Comptabilite.module.css";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const anneeActuelle = new Date().getFullYear();
const ANNEES = Array.from({ length: 6 }, (_, i) => anneeActuelle - i);

const CATEGORIES = [
  ["loyer", "Loyer"],
  ["salaires", "Salaires"],
  ["fournitures_medicales", "Fournitures médicales"],
  ["equipement", "Équipement"],
  ["electricite_eau", "Électricité / Eau"],
  ["maintenance", "Maintenance / Réparations"],
  ["autre", "Autre"],
];

const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(montant) + " GNF";

export default function Comptabilite() {
  const [annee, setAnnee] = useState(anneeActuelle);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [synthese, setSynthese] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().slice(0, 10));
  const [categorie, setCategorie] = useState("autre");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmationRetrait, setConfirmationRetrait] = useState(null);

  const charger = useCallback((anneeCible = annee, moisCible = mois) => {
    setChargement(true);
    Promise.all([
      comptabiliteService.synthese({ annee: anneeCible, mois: moisCible }),
      comptabiliteService.listerDepenses({ annee: anneeCible, mois: moisCible }),
    ]).then(([synth, deps]) => {
      setSynthese(synth.data);
      setDepenses(deps.data.results || deps.data);
    }).finally(() => setChargement(false));
  }, [annee, mois]);

  useEffect(() => { charger(); }, [annee, mois]);

  const creerDepense = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!montant || Number(montant) <= 0 || !description) {
      setErreur("Le montant et la description sont obligatoires.");
      return;
    }
    setEnregistrement(true);
    try {
      await comptabiliteService.creerDepense({ date_depense: dateDepense, categorie, montant, description, notes });

      // Aligne automatiquement le filtre affiché sur le mois/année de la dépense
      // qu'on vient de créer, pour que le résultat soit visible immédiatement
      // même si on consultait une autre période au moment de la saisie.
      const dateCreee = new Date(dateDepense);
      const anneeCreee = dateCreee.getFullYear();
      const moisCree = dateCreee.getMonth() + 1;

      setMontant(""); setDescription(""); setNotes("");
      setAfficherFormulaire(false);

      if (anneeCreee !== Number(annee) || moisCree !== Number(mois)) {
        setAnnee(anneeCreee);
        setMois(moisCree);
        // Le changement d'annee/mois déclenche déjà charger() via le useEffect ci-dessus
      } else {
        charger(anneeCreee, moisCree);
      }
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement de la dépense.");
    } finally {
      setEnregistrement(false);
    }
  };

  const confirmerRetrait = async () => {
    await comptabiliteService.retirerDepense(confirmationRetrait.id);
    setConfirmationRetrait(null);
    charger();
  };

  const exporterCSV = () => {
    const lignes = [["Type", "Date", "Catégorie/Statut", "Montant (GNF)", "Description"]];
    depenses.forEach((d) => {
      lignes.push(["Dépense", d.date_depense, d.categorie_affichee, d.montant, d.description]);
    });
    const contenu = lignes.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `depenses_${MOIS[mois - 1]}_${annee}.csv`;
    lien.click();
    window.URL.revokeObjectURL(url);
  };

  const solde = synthese?.solde_net ?? 0;

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Comptabilité</h1>
        <div className={styles.filtres}>
          <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
            {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={mois} onChange={(e) => setMois(Number(e.target.value))}>
            {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {chargement && <p style={{ color: "var(--couleur-texte-attenue)" }}>Chargement...</p>}

      {!chargement && synthese && (
        <div className={styles.grilleSynthese}>
          <div className={styles.carteChiffre}>
            <div className={styles.labelChiffre}>Recettes ({synthese.nombre_factures} facture{synthese.nombre_factures > 1 ? "s" : ""})</div>
            <div className={`${styles.valeurChiffre} ${styles.valeurPositive}`}>{formaterGNF(synthese.total_recettes)}</div>
          </div>
          <div className={styles.carteChiffre}>
            <div className={styles.labelChiffre}>Dépenses ({synthese.nombre_depenses})</div>
            <div className={`${styles.valeurChiffre} ${styles.valeurNegative}`}>{formaterGNF(synthese.total_depenses)}</div>
          </div>
          <div className={styles.carteChiffre}>
            <div className={styles.labelChiffre}>Solde net</div>
            <div className={`${styles.valeurChiffre} ${solde >= 0 ? styles.valeurPositive : styles.valeurNegative}`}>
              {formaterGNF(solde)}
            </div>
          </div>
        </div>
      )}

      {!chargement && synthese?.depenses_par_categorie?.length > 0 && (
        <div className="carte-moderne" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--couleur-primaire-fonce)" }}>Répartition des dépenses</div>
          <div className={styles.repartition}>
            {synthese.depenses_par_categorie.map((c) => {
              const libelle = CATEGORIES.find(([val]) => val === c.categorie)?.[1] || c.categorie;
              return (
                <div key={c.categorie} className={styles.ligneCategorie}>
                  <span>{libelle}</span>
                  <strong>{formaterGNF(c.total)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.entete}>
        <h2 style={{ fontSize: 18, color: "var(--couleur-primaire-fonce)", margin: 0 }}>Dépenses du mois</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exporterCSV} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }} disabled={depenses.length === 0}>
            <Download size={15} /> Exporter CSV
          </button>
          <button onClick={() => setAfficherFormulaire((v) => !v)} className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Nouvelle dépense
          </button>
        </div>
      </div>

      {afficherFormulaire && (
        <form onSubmit={creerDepense} className="carte-moderne" style={{ marginBottom: 20 }}>
          {erreur && (
            <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>
              {erreur}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div className="champ-formulaire">
              <label>Date</label>
              <input type="date" value={dateDepense} onChange={(e) => setDateDepense(e.target.value)} />
            </div>
            <div className="champ-formulaire">
              <label>Catégorie</label>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                {CATEGORIES.map(([val, lib]) => <option key={val} value={val}>{lib}</option>)}
              </select>
            </div>
            <div className="champ-formulaire">
              <label>Montant (GNF) *</label>
              <input type="number" min="1" value={montant} onChange={(e) => setMontant(e.target.value)} required />
            </div>
            <div className="champ-formulaire">
              <label>Description *</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
          </div>
          <div className="champ-formulaire" style={{ marginBottom: 12 }}>
            <label>Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="bouton-secondaire" onClick={() => setAfficherFormulaire(false)}>Annuler</button>
            <button type="submit" className="bouton-primaire" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {!chargement && depenses.length === 0 && <p className={styles.etatVide}>Aucune dépense enregistrée pour cette période.</p>}

        {depenses.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th><th>Enregistré par</th><th></th></tr>
            </thead>
            <tbody>
              {depenses.map((d) => (
                <tr key={d.id}>
                  <td>{new Date(d.date_depense).toLocaleDateString("fr-FR")}</td>
                  <td>{d.categorie_affichee}</td>
                  <td>{d.description}</td>
                  <td style={{ fontWeight: 600 }}>{formaterGNF(d.montant)}</td>
                  <td>{d.enregistre_par_nom || "—"}</td>
                  <td>
                    <button onClick={() => setConfirmationRetrait(d)} style={{ background: "transparent", border: "none", color: "var(--couleur-danger)", cursor: "pointer" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmationRetrait && (
        <ConfirmModal
          titre="Retirer la dépense"
          message={`Retirer cette dépense de ${formaterGNF(confirmationRetrait.montant)} ? Elle ne sera plus comptée dans les totaux.`}
          texteConfirmation="Retirer"
          dangereux
          onConfirmer={confirmerRetrait}
          onAnnuler={() => setConfirmationRetrait(null)}
        />
      )}
    </div>
  );
}