const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { ROLES, APPOINTMENT_STATUS } = require("../config/constants");

// POST /api/prescriptions - doctor writes a prescription for one of their appointments
async function createPrescription(req, res, next) {
  try {
    const { appointmentId, diagnosis, medicines, notes } = req.body;
    if (!appointmentId || !Array.isArray(medicines) || medicines.length === 0) {
      return res
        .status(400)
        .json({ error: "appointmentId and at least one medicine are required" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({ error: "You can only prescribe for your own appointments" });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId,
      doctor: doctor._id,
      patient: appointment.patient,
      diagnosis,
      medicines,
      notes,
    });

    appointment.status = APPOINTMENT_STATUS.COMPLETED;
    await appointment.save();

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
}

// GET /api/prescriptions - scoped by role
async function listPrescriptions(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: req.user._id });
      filter.patient = patient?._id;
    } else if (req.user.role === ROLES.DOCTOR) {
      const doctor = await Doctor.findOne({ user: req.user._id });
      filter.doctor = doctor?._id;
    }

    const prescriptions = await Prescription.find(filter)
      .populate({ path: "patient", populate: { path: "user", select: "name email phone" } })
      .populate({ path: "doctor", populate: { path: "user", select: "name email" } })
      .populate("appointment", "date timeSlot department")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    next(err);
  }
}

// GET /api/prescriptions/:id
async function getPrescription(req, res, next) {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: "patient", populate: { path: "user", select: "name email phone" } })
      .populate({ path: "doctor", populate: { path: "user", select: "name email" } })
      .populate("appointment", "date timeSlot department");
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });
    res.json(prescription);
  } catch (err) {
    next(err);
  }
}

module.exports = { createPrescription, listPrescriptions, getPrescription };
