/**
 * Simple fixed overlay used when placement/reposition is blocked.
 */
export default function PlacementBlockedPopup({ show, message }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        background: "#1a1a1a",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        border: "2px solid #e03030",
        fontFamily: "system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: "90vw",
      }}
      role="alert"
    >
      <span style={{ color: "#e03030", fontSize: 20 }}>⚠</span>
      <span>{message}</span>
    </div>
  );
}

