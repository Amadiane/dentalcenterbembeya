import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "../theme/components/DashboardLayout.module.css";

export default function DashboardLayout() {
  const { utilisateur, deconnecter } = useAuth();

  return (
    <div className={styles.conteneur}>
      <aside className={styles.barre}>
        <div className={styles.nomEntreprise}>Centre Dentaire Bembeya</div>

        <nav className={styles.navigation}>
          <NavLink to="/" end className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <LayoutDashboard size={18} /> Tableau de bord
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <Users size={18} /> Patients
          </NavLink>
        </nav>

        <div className={styles.pied}>
          <div className={styles.nomUtilisateur}>{utilisateur?.first_name || utilisateur?.username}</div>
          <button onClick={deconnecter} className={styles.boutonDeconnexion}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className={styles.zonePrincipale}>
        <Outlet />
      </main>
    </div>
  );
}