import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { utilisateursService } from "../../services/utilisateursService";

export default function HistoriquePersonnel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entrees, setEntrees] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    utilisateursService.historique(id)
      .then(({ data }) => setEntrees(data))
      .finally(() => setChargement(false));
  }, [id]);

  return (
    <div className="conteneur-page" style={{ maxWidth: 750 }}>
      <button
        onClick={() => navigate(`/personnel/${id}/modifier`)}
        style={{ background: "transparent", border: "none", display: "flex", gap: 6, marginBottom: 18, cursor: "pointer", color: "var(--couleur-texte-attenue)" }}
      >
        <ArrowLeft size={16} /> Retour au compte
      </button>

      <h1>Historique du compte</h1>

      {chargement && <p>Chargement...</p>}
      {!chargement && entrees.length === 0 && <p>Aucune modification enregistrée pour l'instant.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {entrees.map((e) => (
          <div key={e.id} className="carte-moderne">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: e.modifications?.length ? 14 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--couleur-primaire-fonce)" }}>
                {e.action_affichee} — {e.auteur || "Système"}
              </div>
              <div style={{ fontSize: 12, color: "var(--couleur-texte-attenue)" }}>
                {new Date(e.timestamp).toLocaleString("fr-FR")}
              </div>
            </div>

            {e.modifications?.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--couleur-bordure)" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--couleur-texte-attenue)", fontSize: 11, textTransform: "uppercase" }}>Champ</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--couleur-texte-attenue)", fontSize: 11, textTransform: "uppercase" }}>Avant</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--couleur-texte-attenue)", fontSize: 11, textTransform: "uppercase" }}>Après</th>
                  </tr>
                </thead>
                <tbody>
                  {e.modifications.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--couleur-bordure)" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{m.champ}</td>
                      <td style={{ padding: "6px 8px", color: "var(--couleur-danger)" }}>{m.ancienne_valeur}</td>
                      <td style={{ padding: "6px 8px", color: "var(--couleur-succes)" }}>{m.nouvelle_valeur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}