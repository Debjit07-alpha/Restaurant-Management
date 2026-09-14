const express = require("express");

const {
  getMenuItems,
  getAllMenuItemsAdmin,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  deleteMenuItem
} = require("../controllers/menuController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getMenuItems);

// Admin-only full list (includes hidden items). Declared before /:id.
router.get("/admin/all", protect, adminOnly, getAllMenuItemsAdmin);

router.get("/:id", getMenuItem);

router.post("/", protect, adminOnly, upload.single("image"), createMenuItem);

router.put("/:id", protect, adminOnly, upload.single("image"), updateMenuItem);

// Admin-only quick availability toggle (declared before /:id routes
// would clash — PATCH with a sub-path is unambiguous).
router.patch("/:id/availability", protect, adminOnly, updateAvailability);

router.delete("/:id", protect, adminOnly, deleteMenuItem);

module.exports = router;