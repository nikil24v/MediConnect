const Patient = require("../models/Patient");
const { ROLES } = require("../config/constants");

// GET /api/patients - admin/doctor only
async function listPatients(req, res, next) {
  try {
    const patients = await Patient.find()
      .populate("user", "name email phone isActive")
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    next(err);
  }
}

// GET /api/patients/:id - admin/doctor, or the patient themselves
async function getPatient(req, res, next) {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "user",
      "name email phone isActive"
    );
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    if (req.user.role === ROLES.PATIENT && String(patient.user._id) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only view your own profile" });
    }
    res.json(patient);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/patients/:id - the patient themselves updates their own profile
async function updatePatient(req, res, next) {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    if (req.user.role === ROLES.PATIENT && String(patient.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const { dob, gender, bloodGroup, address, medicalHistory } = req.body;
    Object.assign(patient, {
      dob: dob ?? patient.dob,
      gender: gender ?? patient.gender,
      bloodGroup: bloodGroup ?? patient.bloodGroup,
      address: address ?? patient.address,
      medicalHistory: medicalHistory ?? patient.medicalHistory,
    });
    await patient.save();
    res.json(patient);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPatients, getPatient, updatePatient };
