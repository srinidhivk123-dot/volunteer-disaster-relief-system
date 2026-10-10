export function StatusBadge({ status, type = "status" }) {
  if (!status) return null;

  const raw = String(status).toLowerCase();
  let badgeClass;

  if (type === "priority") {
    switch (raw) {
      case "high":
      case "critical":
        badgeClass = "badge badge-critical";
        break;
      case "medium":
        badgeClass = "badge badge-amber";
        break;
      case "low":
        badgeClass = "badge badge-green";
        break;
      default:
        badgeClass = "badge badge-default";
    }
  } else {
    // General or assignment status
    switch (raw) {
      case "pending":
        badgeClass = "badge badge-amber";
        break;
      case "assigned":
      case "accepted":
        badgeClass = "badge badge-teal";
        break;
      case "in_progress":
        badgeClass = "badge badge-navy";
        break;
      case "completed":
        badgeClass = "badge badge-green";
        break;
      case "declined":
      case "cancelled":
        badgeClass = "badge badge-critical";
        break;
      case "active":
        badgeClass = "badge badge-green";
        break;
      default:
        badgeClass = "badge badge-default";
    }
  }

  const formatText = (val) => {
    return String(val)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <span className={`rc-status-badge ${badgeClass}`}>
      {formatText(status)}
    </span>
  );
}

export default StatusBadge;
