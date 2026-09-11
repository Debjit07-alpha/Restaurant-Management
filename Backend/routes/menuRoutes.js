const express = require("express");

const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getMenuItems);

router.get("/:id", getMenuItem);

router.post("/", protect, adminOnly, upload.single("image"), createMenuItem);

router.put("/:id", protect, adminOnly, upload.single("image"), updateMenuItem);

router.delete("/:id", protect, adminOnly, deleteMenuItem);

module.exports = router;