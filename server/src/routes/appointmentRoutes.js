const express = require("express");
const {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", listAppointments);
router.get("/:id", getAppointment);
router.post("/", authorize(ROLES.PATIENT), createAppointment);
router.patch("/:id/status", authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), updateAppointmentStatus);

module.exports = router;
