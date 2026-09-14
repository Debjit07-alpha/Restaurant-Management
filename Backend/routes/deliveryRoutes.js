const express = require("express");

const {
  getDeliverySettings,
  checkDelivery,
  updateDeliverySettings,
  getZones,
  createZone,
  updateZone,
  deleteZone
} = require("../controllers/deliveryController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Public: checkout reads settings + availability (customers never write).
router.get("/settings", getDeliverySettings);
router.get("/check", checkDelivery);

// Admin: manage settings + zones (existing admin auth, no new system).
router.put("/settings", protect, adminOnly, updateDeliverySettings);
router.get("/zones", protect, adminOnly, getZones);
router.post("/zones", protect, adminOnly, createZone);
router.put("/zones/:id", protect, adminOnly, updateZone);
router.delete("/zones/:id", protect, adminOnly, deleteZone);

module.exports = router;
