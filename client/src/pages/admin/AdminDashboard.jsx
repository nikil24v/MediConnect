import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardApi } from "../../api/endpoints.js";
import StatCard from "../../components/StatCard.jsx";
import Spinner from "../../components/Spinner.jsx";

const PIE_COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.admin().then(setStats);
  }, []);

  if (!stats) return <Spinner full />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Hospital-wide overview and analytics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Doctors" value={stats.totalDoctors} />
        <StatCard label="Patients" value={stats.totalPatients} />
        <StatCard label="Today's appointments" value={stats.todaysAppointments} />
        <StatCard label="Pending" value={stats.pendingAppointments} accent="amber" />
        <StatCard label="Low stock medicines" value={stats.lowStockMedicines} accent="red" />
        <StatCard label="Revenue" value={`₹${stats.totalRevenue}`} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-800">Appointments by department</h2>
          {stats.appointmentsByDepartment.length === 0 ? (
            <p className="text-sm text-slate-500">No appointment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.appointmentsByDepartment}>
                <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-800">Pharmacy orders by status</h2>
          {stats.ordersByStatus.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {stats.ordersByStatus.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
