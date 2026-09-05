import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { patientsService } from "../../services/patientsService";

export default function PatientsArchives() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    setChargement(true);
    patientsService.listerArchives()
      .then(({ data }) => setPatients(data))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, []);

  const restaurer = async (patient) => {
    if (!window.confirm(`Restaurer le dossier de ${patient.nom} ${patient.prenom} ? Il réapparaîtra dans la liste active.`)) return;
    await patientsService.restaurer(patient.id);
    charger();
  };

  return (
    <div className="conteneur-page">
      <button
        onClick={() => navigate("/patients")}
        style={{ background: "transparent", border: "none", display: "flex", gap: 6, marginBottom: 18, cursor: "pointer", color: "var(--couleur-texte-attenue)" }}
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <h1>Dossiers archivés</h1>
      <p style={{ color: "var(--couleur-texte-attenue)", marginBottom: 20 }}>
        Ces dossiers n'apparaissent plus dans la liste active mais restent conservés pour la traçabilité.
      </p>

      {chargement && <p>Chargement...</p>}
      {!chargement && patients.length === 0 && <p>Aucun dossier archivé.</p>}

      <div className="carte-moderne" style={{ padding: 0 }}>
        {patients.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--couleur-bordure)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.nom} {p.prenom}</div>
              <div style={{ fontSize: 12, color: "var(--couleur-texte-attenue)" }}>{p.numero_dossier}</div>
            </div>
            <button onClick={() => restaurer(p)} className="bouton-secondaire" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={15} /> Restaurer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}