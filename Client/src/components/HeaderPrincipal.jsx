import { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "../theme/components/HeaderPrincipal.module.css";

const dateFormatee = () => {
  const texte = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

export default function HeaderPrincipal({ onOuvrirMenu }) {
  const { utilisateur, deconnecter } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const initiales = `${utilisateur?.first_name?.[0] || ""}${utilisateur?.last_name?.[0] || utilisateur?.username?.[0] || ""}`.toUpperCase();

  return (
    <header className={styles.entete}>
      <svg className={styles.motif} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M 40 140 C 40 90, 110 70, 150 105 C 190 70, 260 90, 260 140 C 260 190, 190 215, 150 260 C 110 215, 40 190, 40 140 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M 200 60 C 200 20, 250 8, 275 32 C 300 8, 350 20, 350 60 C 350 100, 300 118, 275 145 C 250 118, 200 100, 200 60 Z" fill="none" stroke="rgba(127,212,230,0.18)" strokeWidth="1.5" />
      </svg>

      <div className={styles.gauche}>
        <button className={styles.boutonHamburger} onClick={onOuvrirMenu} aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
        <div className={styles.texteBienvenue}>
          <h1>Bienvenue, {utilisateur?.first_name || utilisateur?.username}</h1>
          <p>Connecté en tant que {utilisateur?.role_affiche || "utilisateur"}</p>
        </div>
      </div>

      <div className={styles.droite}>
        <span className={styles.badgeDate}>{dateFormatee()}</span>

        <button className={styles.boutonCloche} aria-label="Notifications">
          <Bell size={17} />
        </button>

        <div className={styles.zoneProfil}>
          <button className={styles.boutonProfil} onClick={() => setMenuOuvert((v) => !v)}>
            <span className={styles.avatar}>{initiales || "?"}</span>
            <span className={styles.nomProfil}>{utilisateur?.first_name || utilisateur?.username}</span>
            <ChevronDown size={15} />
          </button>

          {menuOuvert && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setMenuOuvert(false)} />
              <div className={styles.menuDeroulant}>
                <div className={styles.infosMenu}>
                  <div className={styles.nom}>{utilisateur?.first_name} {utilisateur?.last_name}</div>
                  <div className={styles.role}>{utilisateur?.role_affiche}</div>
                </div>
                <button className={styles.itemMenu} onClick={deconnecter}>
                  <LogOut size={15} /> Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}