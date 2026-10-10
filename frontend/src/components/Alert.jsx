export function Alert({ type = "info", message, onClose, children }) {
  if (!message && !children) return null;

  const icons = {
    error: "⚠️",
    critical: "🚨",
    warning: "⚡",
    success: "✅",
    info: "ℹ️",
  };

  const alertClass = `rc-alert rc-alert-${type}`;

  return (
    <div className={alertClass} role="alert">
      <div className="rc-alert-icon">{icons[type] || "ℹ️"}</div>
      <div className="rc-alert-content">
        {message && <p className="rc-alert-message">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          className="rc-alert-close"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;
