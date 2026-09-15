const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { ROLES, APPOINTMENT_STATUS } = require("../config/constants");

// POST /api/appointments - patient books an appointment
async function createAppointment(req, res, next) {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: "doctorId, date and timeSlot are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const clash = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    });
    if (clash) return res.status(409).json({ error: "That time slot is already booked" });

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      department: doctor.department,
      date,
      timeSlot,
      reason,
    });

    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments - scoped by role
async function listAppointments(req, res, next) {
  try {
    const filter = {};

    if (req.user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: req.user._id });
      filter.patient = patient?._id;
    } else if (req.user.role === ROLES.DOCTOR) {
      const doctor = await Doctor.findOne({ user: req.user._id });
      filter.doctor = doctor?._id;
    }
    if (req.query.status) filter.status = req.query.status;

    const appointments = await Appointment.find(filter)
      .populate({ path: "patient", populate: { path: "user", select: "name email phone" } })
      .populate({ path: "doctor", populate: { path: "user", select: "name email phone" } })
      .sort({ date: -1, createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/:id
async function getAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: "patient", populate: { path: "user", select: "name email phone" } })
      .populate({ path: "doctor", populate: { path: "user", select: "name email phone" } });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/appointments/:id/status - doctor confirms/completes, patient/admin cancels
async function updateAppointmentStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: req.user._id });
      const isOwner = patient && String(appointment.patient) === String(patient._id);
      if (!isOwner || status !== APPOINTMENT_STATUS.CANCELLED) {
        return res.status(403).json({ error: "Patients may only cancel their own appointment" });
      }
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

module.exports = { createAppointment, listAppointments, getAppointment, updateAppointmentStatus };
