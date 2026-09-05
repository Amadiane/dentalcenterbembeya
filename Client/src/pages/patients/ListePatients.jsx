import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { patientsService } from "../../services/patientsService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/patients/ListePatients.module.css";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const anneeActuelle = new Date().getFullYear();
const ANNEES = Array.from({ length: 6 }, (_, i) => anneeActuelle - i);

export default function ListePatients() {
  const { utilisateur } = useAuth();
  const [patients, setPatients] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [annee, setAnnee] = useState("");
  const [mois, setMois] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const delai = setTimeout(() => {
      setChargement(true);
      patientsService
        .lister({ search: recherche || undefined, annee: annee || undefined, mois: mois || undefined })
        .then(({ data }) => setPatients(data.results || data))
        .finally(() => setChargement(false));
    }, 300);
    return () => clearTimeout(delai);
  }, [recherche, annee, mois]);

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Patients</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {utilisateur?.role === "administrateur_general" && (
            <Link to="/patients/archives" className="bouton-secondaire" style={{ textDecoration: "none" }}>
              Dossiers archivés
            </Link>
          )}
          <Link to="/patients/nouveau" className={`bouton-primaire ${styles.boutonNouveau}`}>
            <Plus size={16} /> Nouveau patient
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div className={styles.barreRecherche} style={{ marginBottom: 0 }}>
          <Search size={16} color="var(--couleur-texte-attenue)" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou numéro de dossier..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8, fontSize: 14 }}>
          <option value="">Toutes les années</option>
          {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={mois} onChange={(e) => setMois(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8, fontSize: 14 }}>
          <option value="">Tous les mois</option>
          {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && patients.length === 0 && (
          <p className={styles.etatVide}>Aucun patient trouvé.</p>
        )}

        {!chargement && patients.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.numero_dossier}</td>
                  <td>
                    <Link to={`/patients/${p.id}`} className={styles.lienNom}>
                      {p.nom}
                    </Link>
                  </td>
                  <td>{p.prenom}</td>
                  <td>{p.telephone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}