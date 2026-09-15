const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { ROLES } = require("../config/constants");

// POST /api/doctors - admin only: creates a User(role=doctor) + Doctor profile in one step
async function createDoctor(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      phone,
      department,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
    } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: "name, email, password and department are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email is already registered" });

    const user = await User.create({ name, email, password, phone, role: ROLES.DOCTOR });
    const doctor = await Doctor.create({
      user: user._id,
      department,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
    });

    res.status(201).json(await doctor.populate("user", "name email phone isActive"));
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors?department=Cardiology - list doctors (any authenticated role)
async function listDoctors(req, res, next) {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;

    const doctors = await Doctor.find(filter)
      .populate("user", "name email phone isActive")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors/:id
async function getDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name email phone isActive"
    );
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/doctors/:id - admin only
async function updateDoctor(req, res, next) {
  try {
    const { department, specialization, qualification, experienceYears, consultationFee } =
      req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { department, specialization, qualification, experienceYears, consultationFee },
      { new: true, runValidators: true }
    ).populate("user", "name email phone isActive");
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/doctors/:id/deactivate - admin only: soft-delete via the linked User
async function setDoctorActive(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const user = await User.findByIdAndUpdate(
      doctor.user,
      { isActive: req.body.isActive },
      { new: true }
    );
    res.json({ id: doctor._id, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
}

module.exports = { createDoctor, listDoctors, getDoctor, updateDoctor, setDoctorActive };
