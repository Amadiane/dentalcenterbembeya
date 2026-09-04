import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { patientsService } from "../../services/patientsService";
import styles from "../../theme/pages/patients/ListePatients.module.css";

export default function ListePatients() {
  const [patients, setPatients] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    patientsService.lister()
      .then(({ data }) => setPatients(data.results || data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Patients</h1>
        <Link to="/patients/nouveau" className={`bouton-primaire ${styles.boutonNouveau}`}>
          <Plus size={16} /> Nouveau patient
        </Link>
      </div>

      <div className="carte-moderne" style={{ padding: 0 }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && patients.length === 0 && <p className={styles.etatVide}>Aucun patient enregistré.</p>}

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
                  <td><Link to={`/patients/${p.id}`} className={styles.lienNom}>{p.nom}</Link></td>
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