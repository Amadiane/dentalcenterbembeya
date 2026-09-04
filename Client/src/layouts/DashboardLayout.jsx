import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const styleLien = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  borderRadius: 8,
  color: isActive ? "#ffffff" : "rgba(255,255,255,0.85)",
  background: isActive ? "var(--couleur-accent)" : "transparent",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
});

export default function DashboardLayout() {
  const { utilisateur, deconnecter } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 240, background: "var(--couleur-primaire-fonce)",
        color: "#fff", padding: 20, display: "flex", flexDirection: "column",
      }}>
        <div style={{ fontWeight: 700, marginBottom: 30 }}>Centre Dentaire Bembeya</div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <NavLink to="/" end style={styleLien}>
            <LayoutDashboard size={18} /> Tableau de bord
          </NavLink>
          <NavLink to="/patients" style={styleLien}>
            <Users size={18} /> Patients
          </NavLink>
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {utilisateur?.first_name || utilisateur?.username}
          </div>
          <button
            onClick={deconnecter}
            style={{ background: "transparent", border: "none", color: "#fff", display: "flex", gap: 6, cursor: "pointer" }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 30 }}>
        <Outlet />
      </main>
    </div>
  );
}