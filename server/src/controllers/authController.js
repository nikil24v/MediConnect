const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const generateToken = require("../utils/generateToken");
const { ROLES } = require("../config/constants");

// POST /api/auth/register - public self-registration, always creates a PATIENT account
async function register(req, res, next) {
  try {
    const { name, email, password, phone, dob, gender } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email is already registered" });

    const user = await User.create({ name, email, password, phone, role: ROLES.PATIENT });
    const patient = await Patient.create({ user: user._id, dob, gender });

    res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profileId: patient._id,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    let profileId = null;
    if (user.role === ROLES.DOCTOR) {
      const doctor = await Doctor.findOne({ user: user._id });
      profileId = doctor?._id || null;
    } else if (user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: user._id });
      profileId = patient?._id || null;
    }

    res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profileId,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const { _id, name, email, role, phone } = req.user;
    let profile = null;
    if (role === ROLES.DOCTOR) profile = await Doctor.findOne({ user: _id });
    else if (role === ROLES.PATIENT) profile = await Patient.findOne({ user: _id });

    res.json({ id: _id, name, email, role, phone, profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
