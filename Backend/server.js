const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

// Database connection
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure MongoDB is connected before handling API requests.
// Locally this is a no-op (already connected at startup); on Vercel
// (serverless) it (re)connects using the cached connection in config/db.
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TastyBites Backend is running!"
  });
});

// Upload error handler (Multer + fileFilter errors -> clean JSON)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image file is too large. Maximum size is 5MB"
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error"
    });
  }

  next();
});

// Local development only: connect first, then listen on port 5001.
// On Vercel this file is imported as a serverless function (see api/index.js),
// so require.main !== module there and app.listen is skipped.
if (require.main === module) {
  const PORT = process.env.PORT || 5001;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
      });
    })
    .catch(() => process.exit(1));
}

module.exports = app;