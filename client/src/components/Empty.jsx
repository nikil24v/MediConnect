export default function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={44} />}
      <p style={{ fontWeight: 600, color: "#334155" }}>{title}</p>
      {text && <p className="small" style={{ marginTop: 4 }}>{text}</p>}
      {action && <div className="mt">{action}</div>}
    </div>
  );
}
