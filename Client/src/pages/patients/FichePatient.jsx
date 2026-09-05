import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Download, Printer, Pencil, ArrowLeft, Archive, History } from "lucide-react";
import { patientsService } from "../../services/patientsService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/patients/FichePatient.module.css";

export default function FichePatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const estAdministrateurGeneral = utilisateur?.role === "administrateur_general";

  const [patient, setPatient] = useState(null);
  const [telechargement, setTelechargement] = useState(false);
  const [impression, setImpression] = useState(false);

  useEffect(() => {
    patientsService.obtenir(id).then(({ data }) => setPatient(data));
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
    </div>
  );
}