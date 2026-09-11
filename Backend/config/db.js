const mongoose = require("mongoose");

// Cached flag: on Vercel the same serverless instance can serve many
// requests, so reconnecting on every invocation would quickly exhaust
// the MongoDB Atlas connection limit. Locally this is a harmless no-op.
let isConnected = false;

// If the underlying connection drops (common when a serverless instance
// is frozen/thawed), drop the cache so the next request reconnects
// instead of querying over a dead socket.
mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

mongoose.connection.on("close", () => {
  isConnected = false;
});

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;