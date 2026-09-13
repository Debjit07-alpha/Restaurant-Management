const express = require("express");

const {
  reverseGeocode,
  autocompleteAddress
} = require("../controllers/locationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Authenticated one-shot reverse geocode for checkout address autofill.
// Keeps provider access server-side; no API keys in frontend code.
router.get("/reverse", protect, reverseGeocode);

// Authenticated address search (no GPS needed). Key stays server-side.
router.get("/autocomplete", protect, autocompleteAddress);

module.exports = router;
