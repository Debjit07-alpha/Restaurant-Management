const mongoose = require("mongoose");
const DeliveryZone = require("../models/DeliveryZone");
const {
  getSettings,
  isValidPincode,
  normalizePincode,
  quoteDelivery
} = require("../utils/deliveryService");

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Delivery error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

// Normalize admin input. Throws 400 on bad values.
const parseSettingsInput = (body) => {
  const pick = (key, fallback) =>
    body[key] === undefined || body[key] === "" ? fallback : Number(body[key]);
  const minimumOrderAmount = pick("minimumOrderAmount", 0);
  const baseDeliveryFee = pick("baseDeliveryFee", 40);
  const freeDeliveryThreshold = pick("freeDeliveryThreshold", 499);
  for (const [label, value] of [
    ["Minimum order amount", minimumOrderAmount],
    ["Base delivery fee", baseDeliveryFee],
    ["Free delivery threshold", freeDeliveryThreshold]
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      const err = new Error(`${label} cannot be negative`);
      err.status = 400;
      throw err;
    }
  }
  const estimatedDeliveryTime = String(body.estimatedDeliveryTime ?? "").trim();
  if (estimatedDeliveryTime.length > 60) {
    const err = new Error("Estimated delivery time is too long");
    err.status = 400;
    throw err;
  }
  return {
    minimumOrderAmount,
    baseDeliveryFee,
    freeDeliveryThreshold,
    estimatedDeliveryTime: estimatedDeliveryTime || "30–45 minutes"
  };
};

const parseZoneInput = async (body, ignoreId = null) => {
  const name = String(body.name || "").trim();
  if (!name) {
    const err = new Error("Zone name cannot be empty");
    err.status = 400;
    throw err;
  }
  if (name.length > 80) {
    const err = new Error("Zone name is too long");
    err.status = 400;
    throw err;
  }

  // Accept "700010, 700011" strings or arrays; normalize + dedupe.
  const raw = Array.isArray(body.pincodes)
    ? body.pincodes
    : String(body.pincodes || "").split(",");
  const pincodes = [...new Set(raw.map(normalizePincode).filter(Boolean))];
  if (pincodes.length === 0) {
    const err = new Error("At least one pincode is required");
    err.status = 400;
    throw err;
  }
  const bad = pincodes.find((code) => !isValidPincode(code));
  if (bad) {
    const err = new Error(`Invalid pincode: ${bad}. Use 6-digit pincodes.`);
    err.status = 400;
    throw err;
  }

  const deliveryFee = Number(body.deliveryFee);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    const err = new Error("Delivery fee cannot be negative");
    err.status = 400;
    throw err;
  }
  const minimumOrderAmount =
    body.minimumOrderAmount === "" ||
    body.minimumOrderAmount === null ||
    body.minimumOrderAmount === undefined
      ? null
      : Number(body.minimumOrderAmount);
  if (minimumOrderAmount !== null && !(minimumOrderAmount >= 0)) {
    const err = new Error("Minimum order cannot be negative");
    err.status = 400;
    throw err;
  }
  const estimatedDeliveryTime = String(body.estimatedDeliveryTime ?? "").trim();
  if (estimatedDeliveryTime.length > 60) {
    const err = new Error("Estimated delivery time is too long");
    err.status = 400;
    throw err;
  }

  // A pincode must belong to at most one zone (checked across all
  // zones so re-activating later can never create ambiguity).
  const clash = await DeliveryZone.findOne({
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    pincodes: { $in: pincodes }
  });
  if (clash) {
    const dup = pincodes.find((code) => clash.pincodes.includes(code));
    const err = new Error(
      `Pincode ${dup} already belongs to zone "${clash.name}"`
    );
    err.status = 400;
    throw err;
  }

  return {
    name,
    pincodes,
    deliveryFee,
    minimumOrderAmount,
    estimatedDeliveryTime,
    isActive: body.isActive !== false
  };
};

// =====================================
// GET SETTINGS (public: checkout reads them)
// =====================================
const getDeliverySettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    sendError(res, error, "Server error while fetching delivery settings");
  }
};

// =====================================
// CHECK DELIVERY (public: pincode + cart snapshot)
// GET /api/delivery/check?pincode=700010&subtotal=650&discount=100
// =====================================
const checkDelivery = async (req, res) => {
  try {
    const quote = await quoteDelivery({
      pincode: req.query.pincode,
      subtotal: Number(req.query.subtotal) || 0,
      discountAmount: Number(req.query.discount) || 0
    });
    res.status(200).json({ success: true, ...quote });
  } catch (error) {
    sendError(res, error, "Unable to calculate delivery.");
  }
};

// =====================================
// UPDATE SETTINGS (Admin)
// =====================================
const updateDeliverySettings = async (req, res) => {
  try {
    const fields = parseSettingsInput(req.body);
    const settings = await getSettings();
    Object.assign(settings, fields);
    await settings.save();
    res.status(200).json({
      success: true,
      message: "Delivery settings updated successfully",
      settings
    });
  } catch (error) {
    sendError(res, error, "Server error while saving delivery settings");
  }
};

// =====================================
// LIST ZONES (Admin)
// =====================================
const getZones = async (req, res) => {
  try {
    const zones = await DeliveryZone.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: zones.length, zones });
  } catch (error) {
    sendError(res, error, "Server error while fetching delivery zones");
  }
};

// =====================================
// CREATE ZONE (Admin)
// =====================================
const createZone = async (req, res) => {
  try {
    const fields = await parseZoneInput(req.body);
    const existing = await DeliveryZone.findOne({ name: fields.name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A delivery zone with this name already exists"
      });
    }
    const zone = await DeliveryZone.create(fields);
    res.status(201).json({
      success: true,
      message: "Delivery zone created successfully",
      zone
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A delivery zone with this name already exists"
      });
    }
    sendError(res, error, "Server error while creating delivery zone");
  }
};

// =====================================
// UPDATE ZONE (Admin)
// =====================================
const updateZone = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found"
      });
    }
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found"
      });
    }
    const fields = await parseZoneInput(req.body, zone._id);
    if (fields.name !== zone.name) {
      const clash = await DeliveryZone.findOne({ name: fields.name });
      if (clash) {
        return res.status(409).json({
          success: false,
          message: "A delivery zone with this name already exists"
        });
      }
    }
    Object.assign(zone, fields);
    await zone.save();
    res.status(200).json({
      success: true,
      message: "Delivery zone updated successfully",
      zone
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A delivery zone with this name already exists"
      });
    }
    sendError(res, error, "Server error while updating delivery zone");
  }
};

// =====================================
// DELETE ZONE (Admin: safe — orders snapshot their fee)
// =====================================
const deleteZone = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found"
      });
    }
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found"
      });
    }
    await zone.deleteOne();
    res.status(200).json({
      success: true,
      message: "Delivery zone deleted successfully"
    });
  } catch (error) {
    sendError(res, error, "Server error while deleting delivery zone");
  }
};

module.exports = {
  getDeliverySettings,
  checkDelivery,
  updateDeliverySettings,
  getZones,
  createZone,
  updateZone,
  deleteZone
};
