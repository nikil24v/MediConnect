import { CalendarDays, Clock, ClipboardList } from "lucide-react";
import { fmtDate, fmtTime } from "../utils/helpers";
import Empty from "./Empty";
import PrescriptionCard from "./PrescriptionCard";

// Small coloured tags for allergies / conditions
function Tags({ items, className }) {
  if (!items?.length) return <span className="muted small">None added</span>;
  return items.map((t) => <span key={t} className={`badge ${className}`}>{t}</span>);
}

// Shows a patient's health details and past visits.
// Used on the patient's Health Card page AND on the doctor's patient-record page.
// canDownload / canBuy = show "Download PDF" / "Buy medicines" (only for the patient's own card).
export default function RecordView({ patient, visits, uploaded = [], canDownload, canBuy }) {
  return (
    <>
      <div className="card mb">
        <div className="card-title">Health details</div>
        <div className="grid grid-3 small mb">
          <div><div className="muted">Blood group</div><strong>{patient.bloodGroup || "-"}</strong></div>
          <div><div className="muted">Age / Gender</div><strong style={{ textTransform: "capitalize" }}>{patient.age || "-"} / {patient.gender || "-"}</strong></div>
          <div><div className="muted">Phone</div><strong>{patient.phone || "-"}</strong></div>
        </div>

        <div className="muted small mb">Allergies</div>
        <div className="chips mb"><Tags items={patient.allergies} className="badge-cancelled" /></div>

        <div className="muted small mb">Medical conditions</div>
        <div className="chips mb"><Tags items={patient.conditions} className="badge-pending" /></div>

        <div className="muted small">Emergency contact</div>
        <strong className="small">{patient.emergencyContact || "-"}</strong>
      </div>

      <div className="card">
        <div className="card-title">Past visits</div>
        {visits.length === 0 ? (
          <Empty icon={ClipboardList} title="No past visits yet" text="Completed appointments will appear here." />
        ) : (
          visits.map((v) => (
            <div key={v._id} className="list-item">
              <div className="grow">
                <div className="title">{v.doctor?.name} <span className="muted small">· {v.doctor?.specialization}</span></div>
                <div className="flex small muted" style={{ marginTop: 2 }}>
                  <CalendarDays size={14} /> {fmtDate(v.date)} <Clock size={14} /> {fmtTime(v.time)}
                </div>
                {v.reason && <div className="small" style={{ marginTop: 4 }}>Reason: {v.reason}</div>}
                {v.notes && <div className="small" style={{ marginTop: 4 }}>Doctor's notes: {v.notes}</div>}
                {v.prescription && <PrescriptionCard rx={v.prescription} canDownload={canDownload} canBuy={canBuy} />}
              </div>
            </div>
          ))
        )}
      </div>

      {uploaded.length > 0 && (
        <div className="card mt">
          <div className="card-title">Prescriptions uploaded by the patient</div>
          <p className="muted small mb">Scanned from paper prescriptions by the patient. They are not linked to a visit here.</p>
          {uploaded.map((rx) => (
            <div key={rx._id} className="list-item">
              <div className="grow">
                <div className="title">Added on {fmtDate(rx.createdAt)} <span className="badge badge-brand">Uploaded by patient</span></div>
                <PrescriptionCard rx={rx} canDownload={canDownload} canBuy={canBuy} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
