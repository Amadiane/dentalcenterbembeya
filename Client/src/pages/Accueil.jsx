import { useAuth } from "../context/AuthContext";

export default function Accueil() {
  const { utilisateur } = useAuth();
  return (
    <div>
      <h1>Bonjour {utilisateur?.first_name || utilisateur?.username} 👋</h1>
      <p>Bienvenue sur le système de gestion du Centre Dentaire Bembeya.</p>
    </div>
  );
}