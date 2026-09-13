const express = require("express");

const {
  getUsers,
  deleteUser,
  getMyFavorites,
  addMyFavorite,
  removeMyFavorite,
  toggleMyFavorite
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================
// AUTHENTICATED USER FAVORITES
// (user is taken from the JWT, never from the frontend)
// =====================================

// Get current user's favorites
router.get("/me/favorites", protect, getMyFavorites);

// Add a menu item to favorites
router.post("/me/favorites", protect, addMyFavorite);

// Remove a menu item from favorites
router.delete("/me/favorites/:menuItemId", protect, removeMyFavorite);

// Toggle a favorite
router.put("/me/favorites/:menuItemId", protect, toggleMyFavorite);

// =====================================
// ADMIN PROTECTED ROUTES
// =====================================

// Get all users
router.get("/", protect, adminOnly, getUsers);

// Delete user
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;