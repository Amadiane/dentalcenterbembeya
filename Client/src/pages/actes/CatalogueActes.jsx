import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { actesService } from "../../services/actesService";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/actes/CatalogueActes.module.css";

const ROLES_GESTION = ["administrateur_general", "medecin_chef"];

const CATEGORIES = [
  ["consultation", "Consultation"],
  ["soin_conservateur", "Soin conservateur"],
  ["endodontie", "Endodontie"],
  ["chirurgie", "Chirurgie / extraction"],
  ["prothese", "Prothèse dentaire"],
  ["orthodontie", "Orthodontie"],
  ["radiographie", "Radiographie / imagerie"],
  ["autre", "Autre"],
];

const formaterGNF = (montant) => new Intl.NumberFormat("fr-FR").format(montant) + " GNF";

export default function CatalogueActes() {
  const { utilisateur } = useAuth();
  const peutGerer = ROLES_GESTION.includes(utilisateur?.role);

  const [actes, setActes] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(() => {
    setChargement(true);
    actesService.lister({ search: recherche || undefined, categorie: categorie || undefined })
      .then(({ data }) => setActes(data.results || data))
      .finally(() => setChargement(false));
  }, [recherche, categorie]);

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [charger]);

  const desactiver = async (acte) => {
    if (!window.confirm(`Retirer "${acte.nom}" du catalogue ? Il n'apparaîtra plus dans les nouvelles sélections.`)) return;
    await actesService.desactiver(acte.id);
    charger();
  };

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Catalogue des actes</h1>
        {peutGerer && (
          <Link to="/actes/nouveau" className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Plus size={16} /> Nouvel acte
          </Link>
        )}
      </div>

      <div className={styles.filtres}>
        <input
          type="text"
          placeholder="Rechercher par nom ou code..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && actes.length === 0 && (
          <p className={styles.etatVide}>Aucun acte trouvé.</p>
        )}

        {!chargement && actes.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Tarif</th>
                <th>Durée</th>
                {peutGerer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {actes.map((acte) => (
                <tr key={acte.id}>
                  <td><span className={styles.code}>{acte.code}</span></td>
                  <td>{acte.nom}</td>
                  <td>{acte.categorie_affichee}</td>
                  <td className={styles.tarif}>{formaterGNF(acte.tarif)}</td>
                  <td>{acte.duree_estimee_minutes} min</td>
                  {peutGerer && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link to={`/actes/${acte.id}/modifier`} style={{ color: "var(--couleur-primaire)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                          Modifier
                        </Link>
                        <button onClick={() => desactiver(acte)} style={{ background: "transparent", border: "none", color: "var(--couleur-danger)", fontSize: 13, cursor: "pointer", padding: 0 }}>
                          Retirer
                        </button>
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