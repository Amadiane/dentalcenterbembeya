import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { facturationService } from "../../services/facturationService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/facturation/ListeFactures.module.css";

const ROLES_GESTION = ["administrateur_general", "accueil_receptionniste"];

const BADGES = {
  impayee: styles.badgeImpayee,
  partiellement_payee: styles.badgePartiellementPayee,
  payee: styles.badgePayee,
  annulee: styles.badgeAnnulee,
};

const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(montant) + " GNF";

export default function ListeFactures() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientFiltre = searchParams.get("patient");
  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);

  const [factures, setFactures] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(() => {
    setChargement(true);
    facturationService.lister({
      search: recherche || undefined,
      statut: statut || undefined,
      patient: patientFiltre || undefined,
    })
      .then(({ data }) => setFactures(data.results || data))
      .finally(() => setChargement(false));
  }, [recherche, statut, patientFiltre]);

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [charger]);

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Facturation</h1>
        {peutGerer && (
          <Link to="/facturation/nouvelle" className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Plus size={16} /> Nouvelle facture
          </Link>
        )}
      </div>

      <div className={styles.filtres}>
        <input
          type="text"
          placeholder="Rechercher par numéro ou nom du patient..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="impayee">Impayée</option>
          <option value="partiellement_payee">Partiellement payée</option>
          <option value="payee">Payée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && factures.length === 0 && (
          <p className={styles.etatVide}>Aucune facture trouvée.</p>
        )}

        {!chargement && factures.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Reste</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id} onClick={() => navigate(`/facturation/${f.id}`)} style={{ cursor: "pointer" }}>
                  <td className={styles.colNumero}><span className={styles.numero}>{f.numero_facture}</span></td>
                  <td className={styles.colPatient} title={`${f.patient_nom} ${f.patient_prenom}`}>{f.patient_nom} {f.patient_prenom}</td>
                  <td>{new Date(f.date_emission).toLocaleDateString("fr-FR")}</td>
                  <td className={styles.montant}>{formaterGNF(f.montant_total)}</td>
                  <td>{formaterGNF(f.montant_paye)}</td>
                  <td>{formaterGNF(f.montant_restant)}</td>
                  <td><span className={`${styles.badge} ${BADGES[f.statut]}`}>{f.statut_affiche}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}