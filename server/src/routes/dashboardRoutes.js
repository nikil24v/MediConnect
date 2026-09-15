const express = require("express");
const { getAdminStats, getDoctorStats } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/admin", authorize(ROLES.ADMIN), getAdminStats);
router.get("/doctor", authorize(ROLES.DOCTOR), getDoctorStats);

module.exports = router;
