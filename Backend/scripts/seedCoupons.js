// Seed demo coupons (idempotent: upserts by code).
// Run: node scripts/seedCoupons.js
// Uses the same connection helper as the app.

const connectDB = require("../config/db");
const Coupon = require("../models/Coupon");

const DEMO_COUPONS = [
  {
    code: "SAVE50",
    discountType: "PERCENTAGE",
    discountValue: 50,
    minimumOrderAmount: 0,
    maximumDiscount: 100,
    usageLimit: null,
    perUserLimit: 1,
    startDate: null,
    expiryDate: null,
    isActive: true,
    applicableCategories: [],
    applicableProducts: []
  },
  {
    code: "FLAT100",
    discountType: "FIXED",
    discountValue: 100,
    minimumOrderAmount: 500,
    maximumDiscount: null,
    usageLimit: null,
    perUserLimit: 1,
    startDate: null,
    expiryDate: null,
    isActive: true,
    applicableCategories: [],
    applicableProducts: []
  },
  {
    code: "WELCOME",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumOrderAmount: 0,
    maximumDiscount: 150,
    usageLimit: null,
    perUserLimit: 1,
    startDate: null,
    expiryDate: null,
    isActive: true,
    applicableCategories: [],
    applicableProducts: []
  }
];

const seed = async () => {
  await connectDB();
  for (const data of DEMO_COUPONS) {
    await Coupon.findOneAndUpdate({ code: data.code }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
    console.log(`coupon ready: ${data.code}`);
  }
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed coupons error:", err.message);
  process.exit(1);
});
