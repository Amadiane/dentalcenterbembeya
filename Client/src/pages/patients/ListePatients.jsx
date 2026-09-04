import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { patientsService } from "../../services/patientsService";

export default function ListePatients() {
  const [patients, setPatients] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    patientsService.lister()
      .then(({ data }) => setPatients(data.results || data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>Patients</h1>
        <Link to="/patients/nouveau" className="bouton-primaire" style={{ textDecoration: "none" }}>
          + Nouveau patient
        </Link>
      </div>

      {chargement && <p>Chargement...</p>}
      {!chargement && patients.length === 0 && <p>Aucun patient enregistré.</p>}

      {!chargement && patients.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--couleur-bordure)" }}>
              <th style={{ padding: 10 }}>N° Dossier</th>
              <th style={{ padding: 10 }}>Nom</th>
              <th style={{ padding: 10 }}>Prénom</th>
              <th style={{ padding: 10 }}>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--couleur-bordure)" }}>
                <td style={{ padding: 10 }}>{p.numero_dossier}</td>
                <td style={{ padding: 10 }}>
                  <Link to={`/patients/${p.id}`}>{p.nom}</Link>
                </td>
                <td style={{ padding: 10 }}>{p.prenom}</td>
                <td style={{ padding: 10 }}>{p.telephone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}