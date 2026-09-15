const express = require("express");
const { listPatients, getPatient, updatePatient } = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", authorize(ROLES.ADMIN, ROLES.DOCTOR), listPatients);
router.get("/:id", getPatient);
router.patch("/:id", updatePatient);

module.exports = router;
