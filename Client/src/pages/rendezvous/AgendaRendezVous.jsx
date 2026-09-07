import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { rendezVousService } from "../../services/rendezVousService";
import { utilisateursService } from "../../services/utilisateursService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/rendezvous/AgendaRendezVous.module.css";

const ROLES_GESTION = ["administrateur_general", "accueil_receptionniste", "medecin_chef", "medecin"];
const STATUTS_MODIFIABLES_DATE = ["planifie", "confirme"];

const BADGES = {
  planifie: styles.badgePlanifie,
  confirme: styles.badgeConfirme,
  termine: styles.badgeTermine,
  absent: styles.badgeAbsent,
  annule: styles.badgeAnnule,
};

const auFormatISO = (d) => d.toISOString().slice(0, 10);
const aujourdHui = () => auFormatISO(new Date());

// Renvoie le lundi de la semaine contenant la date donnée
function debutSemaine(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const jour = d.getDay() || 7; // dimanche = 0 -> 7
  d.setDate(d.getDate() - jour + 1);
  return d;
}

function joursDeLaSemaine(dateStr) {
  const lundi = debutSemaine(dateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const LIBELLES_JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function AgendaRendezVous() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();
  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);
  const estAdminGeneral = utilisateur?.role === "administrateur_general";

  const [vue, setVue] = useState("jour"); // "jour" | "semaine"
  const [date, setDate] = useState(aujourdHui());
  const [praticienFiltre, setPraticienFiltre] = useState("");
  const [medecins, setMedecins] = useState([]);
  const [rendezVous, setRendezVous] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    utilisateursService.medecins().then(({ data }) => setMedecins(data));
  }, []);

  const charger = useCallback(() => {
    setChargement(true);
    const params = { praticien: praticienFiltre || undefined };

    if (vue === "semaine") {
      const jours = joursDeLaSemaine(date);
      params.date_debut = auFormatISO(jours[0]);
      params.date_fin = auFormatISO(jours[6]);
    } else {
      params.date = date;
    }

    rendezVousService.lister(params)
      .then(({ data }) => setRendezVous(data.results || data))
      .finally(() => setChargement(false));
  }, [date, vue, praticienFiltre]);

  useEffect(() => { charger(); }, [charger]);

  const annuler = async (rdv) => {
    if (!window.confirm(`Annuler le rendez-vous de ${rdv.patient_nom} ${rdv.patient_prenom} à ${rdv.heure_debut} ?`)) return;
    await rendezVousService.annuler(rdv.id);
    charger();
  };

  const ligneActions = (rdv) => {
    const rdvModifiableDate = STATUTS_MODIFIABLES_DATE.includes(rdv.statut);
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {rdvModifiableDate || estAdminGeneral ? (
          <Link to={`/rendez-vous/${rdv.id}/modifier`} style={{ color: "var(--couleur-primaire)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            {rdvModifiableDate ? "Reprogrammer" : "Modifier"}
          </Link>
        ) : (
          <Link to={`/rendez-vous/${rdv.id}`} style={{ color: "var(--couleur-texte-attenue)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            Voir
          </Link>
        )}
        {(rdvModifiableDate || estAdminGeneral) && (
          <button onClick={() => annuler(rdv)} style={{ background: "transparent", border: "none", color: "var(--couleur-danger)", fontSize: 13, cursor: "pointer", padding: 0 }}>
            Annuler
          </button>
        )}
      </div>
    );
  };

  const ligneRdv = (rdv) => (
    <tr
      key={rdv.id}
      onClick={() => navigate(`/rendez-vous/${rdv.id}`)}
      style={{ cursor: "pointer" }}
    >
      <td>{rdv.heure_debut.slice(0, 5)} – {rdv.heure_fin}</td>
      <td>{rdv.patient_nom} {rdv.patient_prenom}</td>
      <td>{rdv.praticien_nom}</td>
      <td>{rdv.motif || "—"}</td>
      <td><span className={`${styles.badge} ${BADGES[rdv.statut]}`}>{rdv.statut_affiche}</span></td>
      {peutGerer && (
        <td onClick={(e) => e.stopPropagation()}>
          {ligneActions(rdv)}
        </td>
      )}
    </tr>
  );

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Rendez-vous</h1>
        {peutGerer && (
          <Link to="/rendez-vous/nouveau" className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Plus size={16} /> Nouveau rendez-vous
          </Link>
        )}
      </div>

      <div className={styles.barreControles}>
        <div className={styles.bascule}>
          <button
            className={`${styles.basculeBouton} ${vue === "jour" ? styles.basculeBoutonActif : ""}`}
            onClick={() => setVue("jour")}
          >
            Jour
          </button>
          <button
            className={`${styles.basculeBouton} ${vue === "semaine" ? styles.basculeBoutonActif : ""}`}
            onClick={() => setVue("semaine")}
          >
            Semaine
          </button>
        </div>

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="bouton-secondaire" onClick={() => setDate(aujourdHui())}>Aujourd'hui</button>

        <select value={praticienFiltre} onChange={(e) => setPraticienFiltre(e.target.value)}>
          <option value="">Tous les praticiens</option>
          {medecins.map((m) => (
            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
          ))}
        </select>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && rendezVous.length === 0 && (
          <p className={styles.etatVide}>Aucun rendez-vous prévu pour cette période.</p>
        )}

        {!chargement && rendezVous.length > 0 && vue === "jour" && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>Heure</th><th>Patient</th><th>Praticien</th><th>Motif</th><th>Statut</th>
                {peutGerer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>{rendezVous.map(ligneRdv)}</tbody>
          </table>
        )}

        {!chargement && rendezVous.length > 0 && vue === "semaine" && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>Heure</th><th>Patient</th><th>Praticien</th><th>Motif</th><th>Statut</th>
                {peutGerer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {joursDeLaSemaine(date).map((jour) => {
                const jourISO = auFormatISO(jour);
                const rdvDuJour = rendezVous
                  .filter((r) => r.date === jourISO)
                  .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
                if (rdvDuJour.length === 0) return null;
                return (
                  <>
                    <tr key={jourISO} className={styles.ligneJourSemaine}>
                      <td colSpan={peutGerer ? 6 : 5}>
                        {LIBELLES_JOURS[jour.getDay() === 0 ? 6 : jour.getDay() - 1]} {jour.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </td>
                    </tr>
                    {rdvDuJour.map(ligneRdv)}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}