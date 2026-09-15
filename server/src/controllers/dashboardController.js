const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const { APPOINTMENT_STATUS, ORDER_STATUS } = require("../config/constants");

// GET /api/dashboard/admin - admin only
async function getAdminStats(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalDoctors,
      totalPatients,
      todaysAppointments,
      pendingAppointments,
      lowStockMedicines,
      appointmentsByDept,
      ordersByStatus,
      revenueAgg,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Appointment.countDocuments({ status: APPOINTMENT_STATUS.PENDING }),
      Medicine.countDocuments({ stock: { $lte: 10 } }),
      Appointment.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      totalDoctors,
      totalPatients,
      todaysAppointments,
      pendingAppointments,
      lowStockMedicines,
      totalRevenue: revenueAgg[0]?.total || 0,
      appointmentsByDepartment: appointmentsByDept.map((d) => ({ department: d._id, count: d.count })),
      ordersByStatus: ordersByStatus.map((o) => ({ status: o._id, count: o.count })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/doctor - doctor only
async function getDoctorStats(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ error: "Doctor profile not found" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todaysAppointments, pending, completed, uniquePatients] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctor._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      }),
      Appointment.countDocuments({ doctor: doctor._id, status: APPOINTMENT_STATUS.PENDING }),
      Appointment.countDocuments({ doctor: doctor._id, status: APPOINTMENT_STATUS.COMPLETED }),
      Appointment.distinct("patient", { doctor: doctor._id }),
    ]);

    res.json({
      todaysAppointments,
      pendingAppointments: pending,
      completedAppointments: completed,
      totalPatientsSeen: uniquePatients.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAdminStats, getDoctorStats };
