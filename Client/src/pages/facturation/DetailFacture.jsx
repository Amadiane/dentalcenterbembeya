import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { facturationService } from "../../services/facturationService";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "../../theme/pages/facturation/DetailFacture.module.css";

const ROLES_GESTION = ["administrateur_general", "accueil_receptionniste"];

const BADGES = {
  impayee: styles.badgeImpayee,
  partiellement_payee: styles.badgePartiellementPayee,
  payee: styles.badgePayee,
  annulee: styles.badgeAnnulee,
};

const MODES_PAIEMENT = [
  ["especes", "Espèces"],
  ["orange_money", "Orange Money"],
  ["mtn_money", "MTN Money"],
  ["carte", "Carte bancaire"],
  ["virement", "Virement"],
];

const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(montant) + " GNF";

export default function DetailFacture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);
  const estAdminGeneral = utilisateur?.role === "administrateur_general";

  const [facture, setFacture] = useState(null);
  const [afficherFormPaiement, setAfficherFormPaiement] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState("");
  const [modePaiement, setModePaiement] = useState("especes");
  const [referencePaiement, setReferencePaiement] = useState("");
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmationAnnulation, setConfirmationAnnulation] = useState(false);

  const charger = () => {
    facturationService.obtenir(id).then(({ data }) => setFacture(data));
  };

  useEffect(() => { charger(); }, [id]);

  if (!facture) return <p>Chargement...</p>;

  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!montantPaiement || Number(montantPaiement) <= 0) {
      setErreur("Indiquez un montant valide.");
      return;
    }
    setEnregistrement(true);
    try {
      await facturationService.ajouterPaiement(id, {
        montant: montantPaiement,
        mode_paiement: modePaiement,
        reference: referencePaiement,
        date_paiement: new Date().toISOString().slice(0, 10),
      });
      setMontantPaiement("");
      setReferencePaiement("");
      setAfficherFormPaiement(false);
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setEnregistrement(false);
    }
  };

  const confirmerAnnulation = async () => {
    await facturationService.annuler(id);
    setConfirmationAnnulation(false);
    charger();
  };

  const telechargerRecu = async () => {
    const { data } = await facturationService.telechargerRecu(id);
    const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${facture.numero_facture}.pdf`;
    lien.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="conteneur-page" style={{ maxWidth: 750 }}>
      <button
        onClick={() => navigate("/facturation")}
        style={{ background: "transparent", border: "none", display: "flex", gap: 6, marginBottom: 18, cursor: "pointer", color: "var(--couleur-texte-attenue)" }}
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.numero}>{facture.numero_facture}</h1>
          <p className={styles.sousTitre}>
            {facture.patient_numero_dossier} — {facture.patient_nom} {facture.patient_prenom} · {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className={`${styles.badge} ${BADGES[facture.statut]}`}>{facture.statut_affiche}</span>
          <button onClick={telechargerRecu} className="bouton-secondaire">Télécharger le reçu</button>
        </div>
      </div>

      <div className="carte-moderne" style={{ marginBottom: 20 }}>
        <div className={styles.sectionTitre}>Actes facturés</div>
        <table className={styles.tableauLignes}>
          <thead>
            <tr>
              <th>Acte</th><th>Qté</th><th>Prix unitaire</th><th>Remise</th><th>Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((l) => (
              <tr key={l.id}>
                <td>{l.nom_acte}</td>
                <td>{l.quantite}</td>
                <td>{formaterGNF(l.prix_unitaire)}</td>
                <td>{l.remise_pourcentage > 0 ? `-${l.remise_pourcentage}%` : "—"}</td>
                <td style={{ fontWeight: 600 }}>{formaterGNF(l.sous_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.resume}>
          {facture.remise_globale_pourcentage > 0 && (
            <>
              <div className={styles.ligneResume}>
                <span>Sous-total</span><span>{formaterGNF(facture.montant_avant_remise_globale)}</span>
              </div>
              <div className={styles.ligneResume}>
                <span>Remise globale ({facture.remise_globale_pourcentage}%){facture.motif_remise ? ` — ${facture.motif_remise}` : ""}</span>
                <span>- {formaterGNF(facture.montant_avant_remise_globale - facture.montant_total)}</span>
              </div>
            </>
          )}
          <div className={styles.ligneResumeTotal}>
            <span>Total</span><span>{formaterGNF(facture.montant_total)}</span>
          </div>
          <div className={styles.ligneResume}>
            <span>Payé</span><span>{formaterGNF(facture.montant_paye)}</span>
          </div>
          {facture.montant_restant > 0 && facture.statut !== "annulee" && (
            <div className={styles.ligneResumeRestant}>
              <span>Reste à payer</span><span>{formaterGNF(facture.montant_restant)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="carte-moderne" style={{ marginBottom: 20 }}>
        <div className={styles.sectionTitre}>Paiements</div>

        {facture.paiements.length === 0 && (
          <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13 }}>Aucun paiement enregistré pour l'instant.</p>
        )}

        {facture.paiements.length > 0 && (
          <table className={styles.tableauPaiements}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Montant</th>
                <th>Mode</th>
                <th>Référence</th>
                <th>Enregistré par</th>
              </tr>
            </thead>
            <tbody>
              {facture.paiements.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
                  <td style={{ fontWeight: 700 }}>{formaterGNF(p.montant)}</td>
                  <td>{p.mode_paiement_affiche}</td>
                  <td>{p.reference || "—"}</td>
                  <td>{p.enregistre_par_nom || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {peutGerer && facture.montant_restant > 0 && facture.statut !== "annulee" && (
          <>
            {!afficherFormPaiement ? (
              <button onClick={() => setAfficherFormPaiement(true)} className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
                <Plus size={16} /> Enregistrer un paiement
              </button>
            ) : (
              <form onSubmit={enregistrerPaiement} className={styles.formPaiement}>
                {erreur && (
                  <div style={{ width: "100%", background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                    {erreur}
                  </div>
                )}
                <div className="champ-formulaire" style={{ marginBottom: 0, width: 160 }}>
                  <label>Montant (GNF)</label>
                  <input type="number" min="1" max={facture.montant_restant} value={montantPaiement} onChange={(e) => setMontantPaiement(e.target.value)} required />
                </div>
                <div className="champ-formulaire" style={{ marginBottom: 0, width: 180 }}>
                  <label>Mode de paiement</label>
                  <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                    {MODES_PAIEMENT.map(([valeur, libelle]) => (
                      <option key={valeur} value={valeur}>{libelle}</option>
                    ))}
                  </select>
                </div>
                <div className="champ-formulaire" style={{ marginBottom: 0, width: 180 }}>
                  <label>Référence (optionnel)</label>
                  <input value={referencePaiement} onChange={(e) => setReferencePaiement(e.target.value)} placeholder="N° de transaction" />
                </div>
                <button type="submit" className="bouton-primaire" disabled={enregistrement}>
                  {enregistrement ? "..." : "Valider"}
                </button>
                <button type="button" className="bouton-secondaire" onClick={() => setAfficherFormPaiement(false)}>Annuler</button>
              </form>
            )}
          </>
        )}
      </div>

      {estAdminGeneral && facture.statut !== "annulee" && (
        <button onClick={() => setConfirmationAnnulation(true)} className="bouton-secondaire" style={{ color: "var(--couleur-danger)" }}>
          Annuler cette facture
        </button>
      )}

      {confirmationAnnulation && (
        <ConfirmModal
          titre="Annuler la facture"
          message={`Annuler la facture ${facture.numero_facture} ? Les paiements déjà enregistrés resteront visibles pour la traçabilité.`}
          texteConfirmation="Annuler la facture"
          dangereux
          onConfirmer={confirmerAnnulation}
          onAnnuler={() => setConfirmationAnnulation(false)}
        />
      )}
    </div>
  );
}