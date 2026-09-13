// Backfill rating summary fields on pre-existing menu items.
// Run once: node scripts/backfillRatings.js
require("dotenv").config();
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

(async () => {
  await connectDB();
  const res = await MenuItem.updateMany(
    {
      $or: [
        { ratingAverage: { $exists: false } },
        { ratingCount: { $exists: false } }
      ]
    },
    { $set: { ratingAverage: 0, ratingCount: 0 } }
  );
  console.log(`backfillRatings: matched=${res.matchedCount} modified=${res.modifiedCount}`);
  process.exit(0);
})().catch((err) => {
  console.error("backfill failed:", err.message);
  process.exit(1);
});
