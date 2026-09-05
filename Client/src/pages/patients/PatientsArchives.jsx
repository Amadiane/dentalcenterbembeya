import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { patientsService } from "../../services/patientsService";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const anneeActuelle = new Date().getFullYear();
const ANNEES = Array.from({ length: 6 }, (_, i) => anneeActuelle - i);

export default function PatientsArchives() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [annee, setAnnee] = useState("");
  const [mois, setMois] = useState("");

  const [anneeArchivage, setAnneeArchivage] = useState(anneeActuelle);
  const [moisArchivage, setMoisArchivage] = useState("");
  const [enCours, setEnCours] = useState(false);

  const charger = () => {
    setChargement(true);
    patientsService.listerArchives({ annee: annee || undefined, mois: mois || undefined })
      .then(({ data }) => setPatients(data))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, [annee, mois]);

  const restaurer = async (patient) => {
    if (!window.confirm(`Restaurer le dossier de ${patient.nom} ${patient.prenom} ?`)) return;
    await patientsService.restaurer(patient.id);
    charger();
  };

  const archiverParPeriode = async () => {
    const libellePeriode = moisArchivage ? `${MOIS[moisArchivage - 1]} ${anneeArchivage}` : `l'année ${anneeArchivage}`;
    if (!window.confirm(`Archiver TOUS les dossiers actifs créés en ${libellePeriode} ? Cette action est réversible (restauration possible ensuite).`)) return;

    setEnCours(true);
    try {
      const { data } = await patientsService.archiverPeriode({
        annee: anneeArchivage, mois: moisArchivage || undefined,
      });
      alert(`${data.nombre_archives} dossier(s) archivé(s).`);
      charger();
    } finally {
      setEnCours(false);
    }
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
      <p style={{ color: "var(--couleur-texte-attenue)", marginBottom: 24 }}>
        Ces dossiers n'apparaissent plus dans la liste active mais restent conservés pour la traçabilité.
      </p>

      <div className="carte-moderne" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, color: "var(--couleur-primaire-fonce)" }}>Archiver une période entière</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={anneeArchivage} onChange={(e) => setAnneeArchivage(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8 }}>
            {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={moisArchivage} onChange={(e) => setMoisArchivage(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8 }}>
            <option value="">Toute l'année</option>
            {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <button onClick={archiverParPeriode} className="bouton-primaire" disabled={enCours}>
            {enCours ? "Archivage..." : "Archiver cette période"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8 }}>
          <option value="">Toutes les années</option>
          {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={mois} onChange={(e) => setMois(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--couleur-bordure)", borderRadius: 8 }}>
          <option value="">Tous les mois</option>
          {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {chargement && <p>Chargement...</p>}
      {!chargement && patients.length === 0 && <p>Aucun dossier archivé pour cette période.</p>}

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