import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { initials } from "../../utils/helpers";
import RecordView from "../../components/RecordView";
import Empty from "../../components/Empty";

// Opened by scanning a patient's QR code: /scan/<healthId>
export default function PatientRecord() {
  const { healthId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api.get(`/records/${healthId}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [healthId]);

  if (error)
    return (
      <div className="card">
        <Empty icon={SearchX} title="Record not found" text={error}
          action={<Link to="/scan" className="btn btn-primary btn-sm">Try another Health ID</Link>} />
      </div>
    );
  if (!data) return <div className="loader"><div className="spinner" /></div>;

  const { patient, visits } = data;
  return (
    <>
      <div className="card mb flex">
        <div className="avatar">{initials(patient.name)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{patient.name}</div>
          <div className="small muted" style={{ fontFamily: "monospace" }}>Health ID: {patient.healthId}</div>
        </div>
      </div>
      <RecordView patient={patient} visits={visits} />
    </>
  );
}
