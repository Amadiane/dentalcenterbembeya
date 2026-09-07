import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, History, Pencil } from "lucide-react";
import { rendezVousService } from "../../services/rendezVousService";
import { useAuth } from "../../context/AuthContext";

const ROLES_GESTION = ["administrateur_general", "accueil_receptionniste", "medecin_chef", "medecin"];
const STATUTS_MODIFIABLES_DATE = ["planifie", "confirme"];
const STATUTS_CLOS = ["termine", "absent"];

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
  const { utilisateur } = useAuth();
  const [rdv, setRdv] = useState(null);

  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);
  const estAdminGeneral = utilisateur?.role === "administrateur_general";

  useEffect(() => {
    rendezVousService.obtenir(id).then(({ data }) => setRdv(data));
  }, [id]);

  if (!rdv) return <p>Chargement...</p>;

  const c = COULEURS_STATUT[rdv.statut] || COULEURS_STATUT.planifie;
  const estClos = STATUTS_CLOS.includes(rdv.statut);
  const dateModifiable = STATUTS_MODIFIABLES_DATE.includes(rdv.statut);
  const peutModifier = peutGerer && (dateModifiable || estAdminGeneral);
  const peutAnnuler = peutGerer && (dateModifiable || estAdminGeneral) && rdv.statut !== "annule";

  const annuler = async () => {
    if (!window.confirm(`Annuler le rendez-vous de ${rdv.patient_nom} ${rdv.patient_prenom} à ${rdv.heure_debut.slice(0, 5)} ?`)) return;
    await rendezVousService.annuler(id);
    navigate("/rendez-vous");
  };

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 22, color: "var(--couleur-primaire-fonce)", margin: 0 }}>Détail du rendez-vous</h1>
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

      {estClos && (
        <p style={{ fontSize: 13, color: "var(--couleur-texte-attenue)", marginBottom: 16 }}>
          Ce rendez-vous est clôturé{estAdminGeneral ? "" : " et ne peut plus être modifié"}. Pour une nouvelle consultation, créez un nouveau rendez-vous.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {peutModifier && (
          <Link to={`/rendez-vous/${id}/modifier`} className="bouton-primaire" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Pencil size={16} /> {dateModifiable ? "Reprogrammer" : "Modifier"}
          </Link>
        )}

        {estClos && (
          <Link
            to={`/rendez-vous/nouveau?patientId=${rdv.patient}&praticienId=${rdv.praticien}`}
            className={peutModifier ? "bouton-secondaire" : "bouton-primaire"}
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            Créer un nouveau rendez-vous pour ce patient
          </Link>
        )}

        {peutAnnuler && (
          <button onClick={annuler} className="bouton-secondaire" style={{ color: "var(--couleur-danger)" }}>
            Annuler ce rendez-vous
          </button>
        )}

        <Link
          to={`/rendez-vous/${id}/historique`}
          className="bouton-secondaire"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
        >
          <History size={16} /> Historique
        </Link>
      </div>
    </div>
  );
}