const express = require("express");
const { createOrder, listOrders, updateOrderStatus } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect);

router.get("/", listOrders);
router.post("/", authorize(ROLES.PATIENT), createOrder);
router.patch("/:id/status", authorize(ROLES.ADMIN), updateOrderStatus);

module.exports = router;
