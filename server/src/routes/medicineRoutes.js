const express = require("express");
const {
  listMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", listMedicines);
router.get("/:id", getMedicine);
router.post("/", authorize(ROLES.ADMIN), createMedicine);
router.patch("/:id", authorize(ROLES.ADMIN), updateMedicine);
router.delete("/:id", authorize(ROLES.ADMIN), deleteMedicine);

module.exports = router;
