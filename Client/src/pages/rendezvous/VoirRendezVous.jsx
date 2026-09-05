import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { rendezVousService } from "../../services/rendezVousService";

const COULEURS_STATUT = {
  planifie: { bg: "#e5eef7", texte: "#0f4c81" },
  confirme: { bg: "#dcf5f5", texte: "#1b8fab" },
  termine: { bg: "#eef0f2", texte: "#5b6b7c" },
  absent: { bg: "#fdf1de", texte: "#b5720f" },
  annule: { bg: "#fdecec", texte: "#d94f4f" },
};

export default function VoirRendezVous() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rdv, setRdv] = useState(null);

  useEffect(() => {
    rendezVousService.obtenir(id).then(({ data }) => setRdv(data));
  }, [id]);

  if (!rdv) return <p>Chargement...</p>;

  const c = COULEURS_STATUT[rdv.statut] || COULEURS_STATUT.planifie;

  const ligne = (label, valeur) => (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--couleur-bordure)" }}>
      <div style={{ fontSize: 12, color: "var(--couleur-texte-attenue)", fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div>{valeur || "—"}</div>
    </div>
  );

  return (
    <div className="conteneur-page" style={{ maxWidth: 600 }}>
      <button
        onClick={() => navigate("/rendez-vous")}
        style={{ background: "transparent", border: "none", display: "flex", gap: 6, marginBottom: 18, cursor: "pointer", color: "var(--couleur-texte-attenue)" }}
      >
        <ArrowLeft size={16} /> Retour à l'agenda
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "var(--couleur-primaire-fonce)", margin: 0 }}>Rendez-vous clôturé</h1>
        <span style={{ background: c.bg, color: c.texte, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>
          {rdv.statut_affiche}
        </span>
      </div>

      <div className="carte-moderne" style={{ marginBottom: 20 }}>
        {ligne("Patient", `${rdv.patient_numero_dossier} — ${rdv.patient_nom} ${rdv.patient_prenom}`)}
        {ligne("Praticien", rdv.praticien_nom)}
        {ligne("Date", new Date(rdv.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}
        {ligne("Heure", `${rdv.heure_debut.slice(0, 5)} – ${rdv.heure_fin}`)}
        {ligne("Motif", rdv.motif)}
        {ligne("Notes", rdv.notes)}
      </div>

      <p style={{ fontSize: 13, color: "var(--couleur-texte-attenue)", marginBottom: 16 }}>
        Ce rendez-vous est clôturé et ne peut plus être modifié. Pour une nouvelle consultation, créez un nouveau rendez-vous.
      </p>

      <Link
        to={`/rendez-vous/nouveau?patientId=${rdv.patient}&praticienId=${rdv.praticien}`}
        className="bouton-primaire"
        style={{ display: "inline-block", textDecoration: "none" }}
      >
        Créer un nouveau rendez-vous pour ce patient
      </Link>
    </div>
  );
}