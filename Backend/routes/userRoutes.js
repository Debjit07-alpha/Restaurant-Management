const express = require("express");

const {
  getUsers,
  deleteUser
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================
// ADMIN PROTECTED ROUTES
// =====================================

// Get all users
router.get("/", protect, adminOnly, getUsers);

// Delete user
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;