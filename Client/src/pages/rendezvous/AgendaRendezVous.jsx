import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { rendezVousService } from "../../services/rendezVousService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/rendezvous/AgendaRendezVous.module.css";

const ROLES_GESTION = ["administrateur_general", "accueil_receptionniste", "medecin_chef", "medecin"];

const BADGES = {
  planifie: styles.badgePlanifie,
  confirme: styles.badgeConfirme,
  termine: styles.badgeTermine,
  absent: styles.badgeAbsent,
  annule: styles.badgeAnnule,
};

const aujourdHui = () => new Date().toISOString().slice(0, 10);

export default function AgendaRendezVous() {
  const { utilisateur } = useAuth();
  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);

  const [date, setDate] = useState(aujourdHui());
  const [rendezVous, setRendezVous] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(() => {
    setChargement(true);
    rendezVousService.lister({ date })
      .then(({ data }) => setRendezVous(data.results || data))
      .finally(() => setChargement(false));
  }, [date]);

  useEffect(() => { charger(); }, [charger]);

  const annuler = async (rdv) => {
    if (!window.confirm(`Annuler le rendez-vous de ${rdv.patient_nom} ${rdv.patient_prenom} à ${rdv.heure_debut} ?`)) return;
    await rendezVousService.annuler(rdv.id);
    charger();
  };

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

      <div className={styles.filtreDate}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--couleur-texte-attenue)" }}>Date :</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="bouton-secondaire" onClick={() => setDate(aujourdHui())}>Aujourd'hui</button>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && rendezVous.length === 0 && (
          <p className={styles.etatVide}>Aucun rendez-vous prévu ce jour-là.</p>
        )}

        {!chargement && rendezVous.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Patient</th>
                <th>Praticien</th>
                <th>Motif</th>
                <th>Statut</th>
                {peutGerer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rendezVous.map((rdv) => (
                <tr key={rdv.id}>
                  <td>{rdv.heure_debut.slice(0, 5)} – {rdv.heure_fin}</td>
                  <td>{rdv.patient_nom} {rdv.patient_prenom}</td>
                  <td>{rdv.praticien_nom}</td>
                  <td>{rdv.motif || "—"}</td>
                  <td><span className={`${styles.badge} ${BADGES[rdv.statut]}`}>{rdv.statut_affiche}</span></td>
                  {peutGerer && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link to={`/rendez-vous/${rdv.id}/modifier`} style={{ color: "var(--couleur-primaire)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Modifier</Link>
                        <button onClick={() => annuler(rdv)} style={{ background: "transparent", border: "none", color: "var(--couleur-danger)", fontSize: 13, cursor: "pointer", padding: 0 }}>Annuler</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}