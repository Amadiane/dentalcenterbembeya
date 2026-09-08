import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, X, CalendarDays, ClipboardList, Receipt, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HeaderPrincipal from "../components/HeaderPrincipal";
import styles from "../theme/components/DashboardLayout.module.css";

export default function DashboardLayout() {
  const { utilisateur } = useAuth();
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
          <NavLink to="/facturation" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
            <Receipt size={18} /> Facturation
          </NavLink>
          {utilisateur?.role === "administrateur_general" && (
            <NavLink to="/personnel" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `${styles.lien} ${isActive ? styles.lienActif : ""}`}>
              <UserCog size={18} /> Personnel
            </NavLink>
          )}
        </nav>
      </aside>

      {menuOuvert && <div className={styles.voile} onClick={() => setMenuOuvert(false)} />}

      <div className={styles.zoneDroite}>
        <HeaderPrincipal onOuvrirMenu={() => setMenuOuvert(true)} />
        <main className={styles.zonePrincipale}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}