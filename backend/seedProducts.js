const mongoose = require("mongoose");
const path = require("path");
const Product = require("./models/Product");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const products = [
  { name: "Men Slippers", price: 249, category: "Footwear" },
  { name: "Men Sandals", price: 499, category: "Footwear" },
  { name: "Sports Shoes", price: 1299, category: "Footwear" },
  { name: "Ladies Sandals", price: 599, category: "Footwear" },
  { name: "Fancy Heels", price: 999, category: "Footwear" },
  { name: "Kids Shoes", price: 499, category: "Footwear" },
  { name: "Shoe Lace", price: 40, category: "Repair Parts" },
  { name: "Insoles", price: 120, category: "Repair Parts" },
  { name: "Heel Tips", price: 80, category: "Repair Parts" },
  { name: "Rubber Sole Sheet", price: 180, category: "Repair Parts" },
  { name: "Leather Glue", price: 85, category: "Repair Parts" },
  { name: "Bag Chain", price: 90, category: "Bag Repair" },
  { name: "Bag Handle", price: 150, category: "Bag Repair" },
  { name: "Suitcase Wheel", price: 250, category: "Bag Repair" },
  { name: "Bag Lock", price: 90, category: "Bag Repair" },
  { name: "Umbrella Repair", price: 80, category: "Services", serviceItem: true },
  { name: "Umbrella Ribs", price: 120, category: "Umbrella" },
  { name: "Umbrella Spring", price: 50, category: "Umbrella" },
  { name: "Pad Lock", price: 220, category: "Locks" },
  { name: "Door Lock", price: 550, category: "Locks" },
  { name: "Cycle Lock", price: 250, category: "Locks" },
  { name: "Machine Needles", price: 35, category: "Sewing" },
  { name: "Bobbin", price: 50, category: "Sewing" },
  { name: "Machine Belt", price: 120, category: "Sewing" },
  { name: "Shuttle", price: 220, category: "Sewing" },
  { name: "Presser Foot", price: 180, category: "Sewing" },
  { name: "Thread Reel", price: 55, category: "Sewing" },
  { name: "Buttons Pack", price: 30, category: "Sewing" },
  { name: "Elastic Roll", price: 50, category: "Sewing" },
  { name: "Gas Burner", price: 250, category: "Gas Stove" },
  { name: "Burner Cap", price: 90, category: "Gas Stove" },
  { name: "Igniter", price: 140, category: "Gas Stove" },
  { name: "Gas Knob", price: 60, category: "Gas Stove" },
  { name: "Gas Nozzle", price: 45, category: "Gas Stove" },
  { name: "Cooker Gasket", price: 90, category: "Cooker" },
  { name: "Cooker Whistle", price: 70, category: "Cooker" },
  { name: "Safety Valve", price: 110, category: "Cooker" },
  { name: "Pressure Weight", price: 90, category: "Cooker" },
  { name: "Shoe Stitching Repair", price: 150, category: "Services", serviceItem: true },
  { name: "Bag Zip Repair", price: 120, category: "Services", serviceItem: true },
  { name: "Gas Stove Service", price: 250, category: "Services", serviceItem: true },
  { name: "Silai Machine Service", price: 300, category: "Services", serviceItem: true }
];

async function seedData() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log("Seed complete");
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedData();
