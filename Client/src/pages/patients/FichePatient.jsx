import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Download, Pencil, ArrowLeft } from "lucide-react";
import { patientsService } from "../../services/patientsService";
import styles from "../../theme/pages/patients/FichePatient.module.css";

export default function FichePatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [telechargement, setTelechargement] = useState(false);

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
          <button onClick={telecharger} className={`bouton-primaire ${styles.actionBouton}`} disabled={telechargement}>
            <Download size={16} /> {telechargement ? "Génération..." : "Télécharger"}
          </button>
          <Link to={`/patients/${id}/modifier`} className={`bouton-secondaire ${styles.actionBouton}`}>
            <Pencil size={16} /> Modifier
          </Link>
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

        {"motif" in patient && (
          <>
            <div className={styles.sectionTitre}>Informations cliniques</div>
            {ligne("Motif de consultation", patient.motif)}
            {ligne("Soins", patient.soins)}
            {ligne("Allergies", patient.allergies)}
            {ligne("Antécédents médicaux", patient.antecedents_medicaux)}
          </>
        )}
      </div>
    </div>
  );
}