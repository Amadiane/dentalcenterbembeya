import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { rendezVousService } from "../../services/rendezVousService";
import { patientsService } from "../../services/patientsService";
import { utilisateursService } from "../../services/utilisateursService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/rendezvous/FormulaireRendezVous.module.css";

const DUREES = [15, 30, 45, 60, 90];
const STATUTS_CLOS = ["termine", "absent"];

export default function FormulaireRendezVous() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const modeEdition = Boolean(id);
  const estAdminGeneral = utilisateur?.role === "administrateur_general";

  const [medecins, setMedecins] = useState([]);
  const [rechercheTexte, setRechercheTexte] = useState("");
  const [resultatsPatients, setResultatsPatients] = useState([]);
  const [patientChoisi, setPatientChoisi] = useState(null);

  const [valeurs, setValeurs] = useState({
    praticien: searchParams.get("praticienId") || "",
    date: "", heure_debut: "", duree_minutes: 30,
    motif: "", statut: "planifie", notes: "",
  });
  const [chargement, setChargement] = useState(modeEdition);
  const [erreur, setErreur] = useState("");
  const [avertissement, setAvertissement] = useState("");

  const rdvClos = modeEdition && STATUTS_CLOS.includes(valeurs.statut);

  useEffect(() => {
    utilisateursService.medecins().then(({ data }) => setMedecins(data));
  }, []);

  // Pré-remplissage du patient si on arrive via "Créer un nouveau rendez-vous" depuis un rdv clos
  useEffect(() => {
    if (modeEdition) return;
    const patientId = searchParams.get("patientId");
    if (patientId) {
      patientsService.obtenir(patientId).then(({ data }) => {
        setPatientChoisi({ id: data.id, nom: data.nom, prenom: data.prenom, numero_dossier: data.numero_dossier });
      });
    }
  }, [modeEdition, searchParams]);

  useEffect(() => {
    if (!modeEdition) return;
    rendezVousService.obtenir(id).then(({ data }) => {
      const estClos = STATUTS_CLOS.includes(data.statut);
      // Un non-admin qui atteint l'édition d'un rendez-vous clos (ex. lien direct) est renvoyé
      // vers la vue en lecture seule — la modification est réservée à l'administrateur général.
      if (estClos && utilisateur?.role !== "administrateur_general") {
        navigate(`/rendez-vous/${id}`, { replace: true });
        return;
      }
      setValeurs({
        praticien: data.praticien, date: data.date, heure_debut: data.heure_debut.slice(0, 5),
        duree_minutes: data.duree_minutes, motif: data.motif, statut: data.statut, notes: data.notes,
      });
      setPatientChoisi({ id: data.patient, nom: data.patient_nom, prenom: data.patient_prenom, numero_dossier: data.patient_numero_dossier });
    }).finally(() => setChargement(false));
  }, [id, modeEdition, utilisateur, navigate]);

  useEffect(() => {
    if (modeEdition || rechercheTexte.length < 2) { setResultatsPatients([]); return; }
    const delai = setTimeout(() => {
      patientsService.lister({ search: rechercheTexte }).then(({ data }) => {
        setResultatsPatients((data.results || data).slice(0, 6));
      });
    }, 300);
    return () => clearTimeout(delai);
  }, [rechercheTexte, modeEdition]);

  // Avertissement (non bloquant) : le patient a-t-il déjà un rendez-vous ce jour-là ?
  useEffect(() => {
    if (!patientChoisi || !valeurs.date) { setAvertissement(""); return; }
    rendezVousService.lister({ patient: patientChoisi.id, date: valeurs.date }).then(({ data }) => {
      const resultats = (data.results || data).filter((rdv) => rdv.id !== Number(id));
      if (resultats.length > 0) {
        setAvertissement(
          `${patientChoisi.nom} ${patientChoisi.prenom} a déjà ${resultats.length > 1 ? "plusieurs rendez-vous" : "un rendez-vous"} prévu ce jour-là (${resultats.map((r) => r.heure_debut.slice(0, 5)).join(", ")}). Vous pouvez continuer si c'est volontaire.`
        );
      } else {
        setAvertissement("");
      }
    });
  }, [patientChoisi, valeurs.date, id]);

  const champ = (nom) => ({
    value: valeurs[nom] ?? "",
    onChange: (e) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!modeEdition && !patientChoisi) {
      setErreur("Sélectionnez un patient dans la liste avant d'enregistrer.");
      return;
    }
    const donnees = { ...valeurs };
    if (!modeEdition) donnees.patient = patientChoisi.id;

    try {
      if (modeEdition) await rendezVousService.modifier(id, donnees);
      else await rendezVousService.creer(donnees);
      navigate("/rendez-vous");
    } catch (err) {
      const messageApi = err.response?.data?.date || err.response?.data?.heure_debut;
      setErreur(
        Array.isArray(messageApi) ? messageApi[0]
          : messageApi || "Erreur lors de l'enregistrement. Vérifiez que tous les champs obligatoires sont remplis."
      );
    }
  };

  if (chargement) return <p>Chargement...</p>;

  return (
    <div className="conteneur-page" style={{ maxWidth: 650 }}>
      <h1 className={styles.titre}>{modeEdition ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h1>

      {erreur && (
        <div style={{ background: "#fdecec", color: "var(--couleur-danger)", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      {avertissement && (
        <div style={{ background: "#fdf1de", color: "#b5720f", border: "1px solid #f5dfb8", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
          ⚠️ {avertissement}
        </div>
      )}

      {rdvClos && (
        <div style={{ background: "#eef0f2", border: "1px solid var(--couleur-bordure)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {estAdminGeneral
              ? "Ce rendez-vous est clôturé. En tant qu'administrateur général, vous pouvez encore le modifier — utilisez cette possibilité uniquement pour corriger une erreur de saisie."
              : "Ce rendez-vous est clôturé. La date et l'heure ne sont plus modifiables — pour une nouvelle consultation, créez un nouveau rendez-vous."}
          </div>
          <Link
            to={`/rendez-vous/nouveau?patientId=${patientChoisi?.id}&praticienId=${valeurs.praticien}`}
            className="bouton-primaire"
            style={{ display: "inline-block", textDecoration: "none", fontSize: 13 }}
          >
            Créer un nouveau rendez-vous pour ce patient
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="carte-moderne" style={{ marginBottom: 20 }}>
          <div className="champ-formulaire">
            <label>Patient *</label>
            {modeEdition || patientChoisi ? (
              <div className={styles.patientChoisi}>
                <span>{patientChoisi?.numero_dossier} — {patientChoisi?.nom} {patientChoisi?.prenom}</span>
                {!modeEdition && (
                  <button type="button" onClick={() => setPatientChoisi(null)} className="bouton-secondaire">Changer</button>
                )}
              </div>
            ) : (
              <div className={styles.rechercheZone}>
                <input
                  type="text"
                  placeholder="Rechercher un patient par nom ou numéro de dossier..."
                  value={rechercheTexte}
                  onChange={(e) => setRechercheTexte(e.target.value)}
                />
                {rechercheTexte.length >= 2 && (
                  <div className={styles.resultatsRecherche}>
                    {resultatsPatients.length === 0 ? (
                      <div className={styles.resultatItem} style={{ color: "var(--couleur-texte-attenue)", cursor: "default" }}>
                        Aucun patient trouvé pour "{rechercheTexte}"
                      </div>
                    ) : (
                      resultatsPatients.map((p) => (
                        <div key={p.id} className={styles.resultatItem} onClick={() => { setPatientChoisi(p); setRechercheTexte(""); setResultatsPatients([]); }}>
                          {p.numero_dossier} — {p.nom} {p.prenom}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="champ-formulaire">
            <label>Praticien *</label>
            <select {...champ("praticien")} required>
              <option value="">Sélectionner un médecin...</option>
              {medecins.map((m) => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name} — {m.role_affiche}</option>
              ))}
            </select>
          </div>

          <div className={styles.grille2}>
            <div className="champ-formulaire">
              <label>Date *</label>
              <input
                type="date"
                {...champ("date")}
                min={modeEdition ? undefined : new Date().toISOString().slice(0, 10)}
                disabled={rdvClos && !estAdminGeneral}
                required
              />
            </div>
            <div className="champ-formulaire">
              <label>Heure *</label>
              <input type="time" {...champ("heure_debut")} disabled={rdvClos && !estAdminGeneral} required />
            </div>
            <div className="champ-formulaire">
              <label>Durée</label>
              <select {...champ("duree_minutes")} disabled={rdvClos && !estAdminGeneral}>
                {DUREES.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            {modeEdition && (
              <div className="champ-formulaire">
                <label>Statut</label>
                <select {...champ("statut")}>
                  <option value="planifie">Planifié</option>
                  <option value="confirme">Confirmé</option>
                  <option value="termine">Terminé</option>
                  <option value="absent">Patient absent</option>
                </select>
              </div>
            )}
          </div>

          <div className="champ-formulaire">
            <label>Motif</label>
            <input {...champ("motif")} />
          </div>
          <div className="champ-formulaire">
            <label>Notes</label>
            <textarea rows={3} {...champ("notes")} />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="bouton-secondaire" onClick={() => navigate("/rendez-vous")}>Annuler</button>
          <button type="submit" className="bouton-primaire">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}