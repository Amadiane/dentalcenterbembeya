import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Download, Printer, Pencil, ArrowLeft, Archive, History, CalendarDays, Receipt } from "lucide-react";
import { patientsService } from "../../services/patientsService";
import { rendezVousService } from "../../services/rendezVousService";
import { facturationService } from "../../services/facturationService";
import { useAuth } from "../../context/AuthContext";
import SectionRadiographies from "../../components/SectionRadiographies";
import styles from "../../theme/pages/patients/FichePatient.module.css";

export default function FichePatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const estAdministrateurGeneral = utilisateur?.role === "administrateur_general";

  const [patient, setPatient] = useState(null);
  const [telechargement, setTelechargement] = useState(false);
  const [impression, setImpression] = useState(false);
  const [rendezVous, setRendezVous] = useState([]);
  const [factures, setFactures] = useState([]);

  useEffect(() => {
    patientsService.obtenir(id).then(({ data }) => setPatient(data));
  }, [id]);

  useEffect(() => {
    rendezVousService.lister({ patient: id, inclure_annules: true })
      .then(({ data }) => setRendezVous(data.results || data));
  }, [id]);

  useEffect(() => {
    facturationService.lister({ patient: id })
      .then(({ data }) => setFactures(data.results || data));
  }, [id]);

  const telecharger = async () => {
    setTelechargement(true);
    try {
      const { data } = await patientsService.telechargerFiche(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${patient.numero_dossier}.pdf`;
      lien.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setTelechargement(false);
    }
  };

  const imprimer = async () => {
    setImpression(true);
    try {
      const { data } = await patientsService.telechargerFiche(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      window.open(url, "_blank");
    } finally {
      setImpression(false);
    }
  };

  const archiverPatient = async () => {
    if (!window.confirm(`Archiver le dossier de ${patient.nom} ${patient.prenom} ? Il n'apparaîtra plus dans la liste, mais restera conservé pour la traçabilité.`)) return;
    await patientsService.archiver(id);
    navigate("/patients");
  };

  if (!patient) return <p>Chargement...</p>;

  const ligne = (label, valeur) => (
    <div className={styles.ligne}>
      <div className={styles.label}>{label}</div>
      <div>{valeur || "—"}</div>
    </div>
  );

  const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(montant) + " GNF";

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const rdvAvenir = rendezVous
    .filter((r) => r.date >= aujourdHui && r.statut !== "annule")
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure_debut.localeCompare(b.heure_debut));
  const rdvPasses = rendezVous
    .filter((r) => r.date < aujourdHui || r.statut === "annule")
    .sort((a, b) => b.date.localeCompare(a.date) || b.heure_debut.localeCompare(a.heure_debut));

  const COULEURS_STATUT = {
    planifie: { bg: "#e5eef7", texte: "#0f4c81" },
    confirme: { bg: "#dcf5f5", texte: "#1b8fab" },
    termine: { bg: "#eef0f2", texte: "#5b6b7c" },
    absent: { bg: "#fdf1de", texte: "#b5720f" },
    annule: { bg: "#fdecec", texte: "#d94f4f" },
  };

  const badgeRdv = (rdv) => {
    const c = COULEURS_STATUT[rdv.statut] || COULEURS_STATUT.planifie;
    return (
      <span style={{ background: c.bg, color: c.texte, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
        {rdv.statut_affiche}
      </span>
    );
  };

  const ligneRdv = (rdv) => (
    <div key={rdv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--couleur-bordure)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} à {rdv.heure_debut.slice(0, 5)}
        </div>
        <div style={{ fontSize: 12, color: "var(--couleur-texte-attenue)" }}>
          {rdv.praticien_nom}{rdv.motif ? ` — ${rdv.motif}` : ""}
        </div>
      </div>
      {badgeRdv(rdv)}
    </div>
  );

  const COULEURS_STATUT_FACTURE = {
    impayee: { bg: "#fdecec", texte: "#d94f4f" },
    partiellement_payee: { bg: "#fdf1de", texte: "#b5720f" },
    payee: { bg: "#e7f5ea", texte: "#2e9e5b" },
    annulee: { bg: "#eef0f2", texte: "#5b6b7c" },
  };

  const ligneFacture = (f) => {
    const c = COULEURS_STATUT_FACTURE[f.statut] || COULEURS_STATUT_FACTURE.impayee;
    return (
      <Link
        key={f.id}
        to={`/facturation/${f.id}`}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--couleur-bordure)", textDecoration: "none", color: "inherit" }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {f.numero_facture} — {new Date(f.date_emission).toLocaleDateString("fr-FR")}
          </div>
          <div style={{ fontSize: 12, color: "var(--couleur-texte-attenue)" }}>
            {formaterGNF(f.montant_total)}{f.montant_restant > 0 && f.statut !== "annulee" ? ` · reste ${formaterGNF(f.montant_restant)}` : ""}
          </div>
        </div>
        <span style={{ background: c.bg, color: c.texte, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
          {f.statut_affiche}
        </span>
      </Link>
    );
  };

  return (
    <div className="conteneur-page" style={{ maxWidth: 700 }}>
      <button className={styles.retour} onClick={() => navigate("/patients")}>
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.nom}>{patient.nom} {patient.prenom}</h1>
          <p className={styles.numeroDossier}>{patient.numero_dossier}</p>
        </div>
        <div className={styles.actions}>
          <button onClick={imprimer} className={`bouton-secondaire ${styles.actionBouton}`} disabled={impression}>
            <Printer size={16} /> {impression ? "Génération..." : "Imprimer"}
          </button>
          <button onClick={telecharger} className={`bouton-primaire ${styles.actionBouton}`} disabled={telechargement}>
            <Download size={16} /> {telechargement ? "Génération..." : "Télécharger"}
          </button>
          <Link to={`/patients/${id}/modifier`} className={`bouton-secondaire ${styles.actionBouton}`}>
            <Pencil size={16} /> Modifier
          </Link>
          <Link to={`/patients/${id}/historique`} className={`bouton-secondaire ${styles.actionBouton}`}>
            <History size={16} /> Historique
          </Link>
          {estAdministrateurGeneral && (
            <button onClick={archiverPatient} className={`bouton-secondaire ${styles.actionBouton}`} style={{ color: "var(--couleur-danger)" }}>
              <Archive size={16} /> Archiver
            </button>
          )}
        </div>
      </div>

      <div className="carte-moderne">
        <div className={styles.sectionTitre}>Identité</div>
        {ligne("Âge", patient.age)}
        {ligne("Sexe", patient.sexe === "H" ? "Homme" : patient.sexe === "F" ? "Femme" : "")}
        {ligne("Profession", patient.profession)}
        {ligne("Adresse", patient.adresse)}
        {ligne("Téléphone", patient.telephone)}
        {ligne("E-mail", patient.email)}

        <div className={styles.sectionTitre}>Motif de consultation</div>
        {ligne("Motif", patient.motif)}

        {"diagnostic" in patient && (
          <>
            <div className={styles.sectionTitre}>Informations cliniques</div>
            {ligne("Diagnostic", patient.diagnostic)}
            {ligne("Allergies", patient.allergies)}
            {ligne("Antécédents médicaux", patient.antecedents_medicaux)}
            {ligne("Soins", patient.soins)}
          </>
        )}
      </div>

      <div className="carte-moderne" style={{ marginTop: 20 }}>
        <div className={styles.sectionTitre} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={16} /> Rendez-vous ({rendezVous.length})
        </div>

        {rendezVous.length === 0 && (
          <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, padding: "10px 0" }}>
            Aucun rendez-vous enregistré pour ce patient.
          </p>
        )}

        {rdvAvenir.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--couleur-accent-fonce)", marginTop: 12, marginBottom: 4, textTransform: "uppercase" }}>
              À venir
            </div>
            {rdvAvenir.map(ligneRdv)}
          </>
        )}

        {rdvPasses.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--couleur-texte-attenue)", marginTop: 16, marginBottom: 4, textTransform: "uppercase" }}>
              Historique
            </div>
            {rdvPasses.map(ligneRdv)}
          </>
        )}
      </div>

      <div className="carte-moderne" style={{ marginTop: 20 }}>
        <div className={styles.sectionTitre} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Receipt size={16} /> Factures ({factures.length})
        </div>

        {factures.length === 0 && (
          <p style={{ color: "var(--couleur-texte-attenue)", fontSize: 13, padding: "10px 0" }}>
            Aucune facture enregistrée pour ce patient.
          </p>
        )}

        {factures.map(ligneFacture)}
      </div>

      <SectionRadiographies patientId={id} />
    </div>
  );
}