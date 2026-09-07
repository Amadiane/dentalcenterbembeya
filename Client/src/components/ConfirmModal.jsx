export default function ConfirmModal({ titre, message, texteConfirmation = "Confirmer", dangereux = false, onConfirmer, onAnnuler }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10, 20, 30, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onAnnuler}
    >
      <div
        className="carte-moderne"
        style={{ maxWidth: 420, width: "100%", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, color: "var(--couleur-primaire-fonce)" }}>{titre}</h3>
        <p style={{ fontSize: 14, color: "var(--couleur-texte)", marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="bouton-secondaire" onClick={onAnnuler}>Annuler</button>
          <button
            className="bouton-primaire"
            style={dangereux ? { background: "var(--couleur-danger)" } : undefined}
            onClick={onConfirmer}
          >
            {texteConfirmation}
          </button>
        </div>
      </div>
    </div>
  );
}