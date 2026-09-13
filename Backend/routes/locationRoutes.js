const express = require("express");

const { reverseGeocode } = require("../controllers/locationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Authenticated one-shot reverse geocode for checkout address autofill.
// Keeps provider access server-side; no API keys in frontend code.
router.get("/reverse", protect, reverseGeocode);

module.exports = router;
