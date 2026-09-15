const express = require("express");
const {
  createDoctor,
  listDoctors,
  getDoctor,
  updateDoctor,
  setDoctorActive,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", listDoctors);
router.get("/:id", getDoctor);
router.post("/", authorize(ROLES.ADMIN), createDoctor);
router.patch("/:id", authorize(ROLES.ADMIN), updateDoctor);
router.patch("/:id/active", authorize(ROLES.ADMIN), setDoctorActive);

module.exports = router;
