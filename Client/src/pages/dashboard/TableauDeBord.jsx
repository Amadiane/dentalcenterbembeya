import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, CalendarCheck, TrendingUp, Wallet, Plus, CalendarPlus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { patientsService } from "../../services/patientsService";
import { rendezVousService } from "../../services/rendezVousService";
import { facturationService } from "../../services/facturationService";
import styles from "../../theme/pages/dashboard/TableauDeBord.module.css";

// Donnée encore fictive — nécessite un endpoint de statistiques mensuelles dédié
const EVOLUTION_MOCK = [
  { mois: "Avr", patients: 18 },
  { mois: "Mai", patients: 24 },
  { mois: "Juin", patients: 21 },
  { mois: "Juil", patients: 29 },
  { mois: "Août", patients: 34 },
  { mois: "Sept", patients: 27 },
];

export default function TableauDeBord() {
  const { utilisateur } = useAuth();
  const [nombrePatients, setNombrePatients] = useState(null);
  const [rendezVousJour, setRendezVousJour] = useState([]);
  const [chargementRdv, setChargementRdv] = useState(true);
  const [recettesDuMois, setRecettesDuMois] = useState(null);

  useEffect(() => {
    patientsService.lister({ page_size: 1 })
      .then(({ data }) => setNombrePatients(data.count ?? (Array.isArray(data) ? data.length : null)))
      .catch(() => setNombrePatients(null));

    rendezVousService.lister({ date: new Date().toISOString().slice(0, 10) })
      .then(({ data }) => setRendezVousJour(data.results || data))
      .catch(() => setRendezVousJour([]))
      .finally(() => setChargementRdv(false));

    const debutMois = new Date();
    debutMois.setDate(1);
    facturationService.lister({})
      .then(({ data }) => {
        const factures = data.results || data;
        const totalMoisCourant = factures
          .filter((f) => {
            const dateEmission = new Date(f.date_emission);
            return f.statut !== "annulee" && dateEmission >= debutMois;
          })
          .reduce((somme, f) => somme + f.montant_total, 0);
        setRecettesDuMois(totalMoisCourant);
      })
      .catch(() => setRecettesDuMois(null));
  }, []);

  const dateFormatee = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="conteneur-page" style={{ maxWidth: 1100 }}>
      <div className={styles.entete}>
        <h1 className={styles.salutation}>Bonjour {utilisateur?.first_name || utilisateur?.username} 👋</h1>
        <p className={styles.dateJour}>{dateFormatee}</p>
      </div>

      {/* --- Statistiques clés --- */}
      <div className={styles.grilleStats}>
        <div className={styles.carteStat} style={{ "--couleur-icone-fond": "#e5eef7", "--couleur-icone-texte": "#0f4c81" }}>
          <div className={styles.iconeStat}><Users size={22} /></div>
          <div className={styles.labelStat}>Patients enregistrés</div>
          <div className={styles.valeurStat}>{nombrePatients ?? "—"}</div>
          <div className={`${styles.tendance} ${styles.tendancePositive}`}>
            <ArrowUpRight size={14} /> Donnée réelle
          </div>
        </div>

        <div className={styles.carteStat} style={{ "--couleur-icone-fond": "#dcf5f5", "--couleur-icone-texte": "#1b8fab" }}>
          <div className={styles.iconeStat}><CalendarCheck size={22} /></div>
          <div className={styles.labelStat}>Rendez-vous aujourd'hui</div>
          <div className={styles.valeurStat}>{chargementRdv ? "—" : rendezVousJour.length}</div>
          <div className={`${styles.tendance} ${styles.tendanceNeutre}`}>Donnée réelle</div>
        </div>

        <div className={styles.carteStat} style={{ "--couleur-icone-fond": "#e7f5ea", "--couleur-icone-texte": "#2e9e5b" }}>
          <div className={styles.iconeStat}><Wallet size={22} /></div>
          <div className={styles.labelStat}>Facturé ce mois-ci</div>
          <div className={styles.valeurStat}>
            {recettesDuMois === null ? "—" : new Intl.NumberFormat("fr-FR").format(recettesDuMois) + " GNF"}
          </div>
          <div className={`${styles.tendance} ${styles.tendanceNeutre}`}>Donnée réelle</div>
        </div>

        {/* Fictif — pas de statistiques d'occupation encore */}
        <div className={styles.carteStat} style={{ "--couleur-icone-fond": "#fdf1de", "--couleur-icone-texte": "#b5720f" }}>
          <div className={styles.iconeStat}><TrendingUp size={22} /></div>
          <div className={styles.labelStat}>Taux d'occupation</div>
          <div className={styles.valeurStat}>78%</div>
          <div className={`${styles.tendance} ${styles.tendanceNegative}`}>
            <ArrowDownRight size={14} /> -3% (exemple)
          </div>
        </div>
      </div>

      {/* --- Graphique + rendez-vous du jour --- */}
      <div className={styles.grillePrincipale}>
        <div className={styles.carte}>
          <div className={styles.carteEntete}>
            <h3 className={styles.carteTitre}>Évolution des patients</h3>
            <span className={styles.badgeFictif}>Exemple</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={EVOLUTION_MOCK} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="degradePatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fb8d6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2fb8d6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8ef" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfe8ef", fontSize: 13 }} />
              <Area type="monotone" dataKey="patients" stroke="#0f4c81" strokeWidth={2.5} fill="url(#degradePatients)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.carte}>
          <div className={styles.carteEntete}>
            <h3 className={styles.carteTitre}>Rendez-vous d'aujourd'hui</h3>
          </div>

          {chargementRdv && <p className={styles.etatVide}>Chargement...</p>}
          {!chargementRdv && rendezVousJour.length === 0 && (
            <p className={styles.etatVide}>Aucun rendez-vous prévu aujourd'hui.</p>
          )}

          <div className={styles.listeRdv}>
            {rendezVousJour.slice(0, 6).map((rdv) => (
              <div key={rdv.id} className={styles.itemRdv}>
                <div className={styles.heureRdv}>{rdv.heure_debut?.slice(0, 5)}</div>
                <div className={styles.detailRdv}>
                  <div className={styles.nomPatientRdv}>{rdv.patient_nom} {rdv.patient_prenom}</div>
                  <div className={styles.praticienRdv}>{rdv.praticien_nom}</div>
                </div>
              </div>
            ))}
          </div>

          {rendezVousJour.length > 0 && (
            <Link to="/rendez-vous" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 13, fontWeight: 600, color: "var(--couleur-primaire)" }}>
              Voir tout l'agenda →
            </Link>
          )}
        </div>
      </div>

      {/* --- Actions rapides --- */}
      <div className={styles.actionsRapides}>
        <Link to="/patients/nouveau" className={`${styles.actionRapide} ${styles.actionPrimaire}`}>
          <Plus size={18} /> Nouveau patient
        </Link>
        <Link to="/rendez-vous/nouveau" className={`${styles.actionRapide} ${styles.actionSecondaire}`}>
          <CalendarPlus size={18} /> Nouveau rendez-vous
        </Link>
      </div>
    </div>
  );
}