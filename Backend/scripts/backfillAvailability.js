// One-time backfill: give every menu item an availabilityStatus
// derived from the legacy boolean (false -> sold_out, else available).
// Run: node scripts/backfillAvailability.js

const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const backfill = async () => {
  await connectDB();
  const missing = await MenuItem.find({
    $or: [
      { availabilityStatus: { $exists: false } },
      { availabilityStatus: null },
      { availabilityStatus: { $nin: ["available", "sold_out", "hidden"] } }
    ]
  });
  let updated = 0;
  for (const item of missing) {
    item.availabilityStatus =
      item.availability === false ? "sold_out" : "available";
    await item.save();
    updated += 1;
  }
  console.log(`availability backfilled: ${updated} item(s)`);
  process.exit(0);
};

backfill().catch((err) => {
  console.error("Backfill availability error:", err.message);
  process.exit(1);
});
