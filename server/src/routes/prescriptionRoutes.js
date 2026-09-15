const express = require("express");
const {
  createPrescription,
  listPrescriptions,
  getPrescription,
} = require("../controllers/prescriptionController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.post("/", authorize(ROLES.DOCTOR), createPrescription);

module.exports = router;
