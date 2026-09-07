import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Menu, X, CalendarDays, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "../theme/components/DashboardLayout.module.css";

export default function DashboardLayout() {
  const { utilisateur, deconnecter } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className={styles.conteneur}>
      <aside className={`${styles.barre} ${menuOuvert ? styles.barreOuverte : ""}`}>
        <div className={styles.enteteBarre}>
          <div className={styles.nomEntreprise}>Centre Dentaire Bembeya</div>
          <button className={styles.boutonFermer} onClick={() => setMenuOuvert(false)}>
            <X size={22} />
          </button>
        </div>

        <nav className={styles.navigation}>
          <NavLink to="/" end onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <LayoutDashboard size={18} /> Tableau de bord
          </NavLink>
          <NavLink to="/patients" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <Users size={18} /> Patients
          </NavLink>
          <NavLink to="/rendez-vous" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <CalendarDays size={18} /> Rendez-vous
          </NavLink>
          <NavLink to="/actes" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <ClipboardList size={18} /> Catalogue des actes
          </NavLink>
        </nav>

        <div className={styles.pied}>
          <div className={styles.nomUtilisateur}>{utilisateur?.first_name || utilisateur?.username}</div>
          <button onClick={deconnecter} className={styles.boutonDeconnexion}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {menuOuvert && <div className={styles.voile} onClick={() => setMenuOuvert(false)} />}

      <div className={styles.zoneDroite}>
        <header className={styles.enteteMobile}>
          <button className={styles.boutonHamburger} onClick={() => setMenuOuvert(true)}>
            <Menu size={22} />
          </button>
          <span className={styles.titreMobile}>Centre Dentaire Bembeya</span>
        </header>

        <main className={styles.zonePrincipale}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}