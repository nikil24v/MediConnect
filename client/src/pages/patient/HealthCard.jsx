import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import api, { errMsg } from "../../api/client";
import RecordView from "../../components/RecordView";
import Empty from "../../components/Empty";

export default function HealthCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const qrBox = useRef(null);

  useEffect(() => {
    api.get("/records/me").then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  // Draw the card on a plain <canvas> and save it as a PNG image
  const download = () => {
    const p = data.patient;
    const qr = qrBox.current.querySelector("canvas");
    const cut = (text) => (text.length > 55 ? text.slice(0, 52) + "..." : text);

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 800, 460);
    ctx.fillStyle = "#0f766e";
    ctx.fillRect(0, 0, 800, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("MediConnect Health Card", 30, 46);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(p.name, 30, 130);
    ctx.font = "20px sans-serif";
    ctx.fillText(`Blood group: ${p.bloodGroup || "-"}`, 30, 180);
    ctx.fillText(`Allergies: ${cut(p.allergies.join(", ") || "None")}`, 30, 220);
    ctx.fillText(`Conditions: ${cut(p.conditions.join(", ") || "None")}`, 30, 260);
    ctx.fillText(`Emergency: ${cut(p.emergencyContact || "-")}`, 30, 300);

    ctx.drawImage(qr, 560, 100, 210, 210);
    ctx.font = "12px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(p.healthId, 500, 335);
    ctx.font = "16px sans-serif";
    ctx.fillText("Doctors: scan the QR code or enter the Health ID above.", 30, 420);

    const link = document.createElement("a");
    link.download = "mediconnect-health-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="loader"><div className="spinner" /></div>;

  const { patient, scanUrl, visits } = data;
  const noDetails = !patient.bloodGroup && !patient.allergies.length && !patient.conditions.length;

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)", alignItems: "start" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div className="card-title">{patient.name}</div>
        <div ref={qrBox} style={{ display: "inline-block", padding: 12, background: "#fff", borderRadius: 12 }}>
          <QRCodeCanvas value={scanUrl} size={210} level="M" />
        </div>
        <div className="small muted mt">Health ID</div>
        <div className="small" style={{ wordBreak: "break-all", fontFamily: "monospace" }}>{patient.healthId}</div>
        <button className="btn btn-primary btn-block mt" onClick={download}><Download size={16} /> Download card</button>
        <p className="small muted mt">Show this QR code to any doctor so they can see your health record.</p>
      </div>

      <div>
        {noDetails && (
          <div className="alert alert-warn mb">
            <QrCode size={18} /> Your card is empty. <Link to="/profile">Add your blood group, allergies and conditions</Link> so doctors can see them.
          </div>
        )}
        <RecordView patient={patient} visits={visits} canDownload canBuy />
      </div>
    </div>
  );
}
