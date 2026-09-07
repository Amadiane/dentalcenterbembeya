import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { utilisateursService } from "../../services/utilisateursService";
import styles from "../../theme/pages/personnel/ListePersonnel.module.css";

export default function ListePersonnel() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    utilisateursService.lister()
      .then(({ data }) => setPersonnel(data.results || data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="conteneur-page">
      <div className={styles.entete}>
        <h1 className={styles.titre}>Personnel</h1>
        <Link to="/personnel/nouveau" className="bouton-primaire" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <Plus size={16} /> Nouveau compte
        </Link>
      </div>

      <div className="carte-moderne" style={{ padding: 0, overflowX: "auto" }}>
        {chargement && <p className={styles.etatVide}>Chargement...</p>}
        {!chargement && personnel.length === 0 && <p className={styles.etatVide}>Aucun compte enregistré.</p>}

        {!chargement && personnel.length > 0 && (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Nom d'utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((u) => (
                <tr key={u.id} onClick={() => navigate(`/personnel/${u.id}/modifier`)} style={{ cursor: "pointer" }}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.username}</td>
                  <td><span className={styles.badgeRole}>{u.role_affiche}</span></td>
                  <td>
                    <span className={`${styles.badgeActif} ${u.actif ? styles.badgeActifOui : styles.badgeActifNon}`}>
                      {u.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}