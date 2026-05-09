const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();
const dataFile = path.join(__dirname, "..", "data", "products.json");

const isMongoConnected = () => mongoose.connection.readyState === 1;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const seedProducts = [
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

const withDefaults = (product) => ({
  _id: product._id || crypto.randomUUID(),
  name: product.name,
  price: Number(product.price),
  category: product.category,
  description: product.description || "",
  image: product.image || "",
  stock: product.stock === "" || product.stock == null ? 10 : Number(product.stock),
  serviceItem: Boolean(product.serviceItem),
  isDeleted: Boolean(product.isDeleted),
  createdAt: product.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const normalizeProduct = (body) => withDefaults(body);

const validateProductInput = (product) => {
  if (!product.name?.trim()) return "Product name is required";
  if (!product.category?.trim()) return "Category is required";
  if (Number.isNaN(product.price) || product.price < 0) return "Valid price is required";
  if (Number.isNaN(product.stock) || product.stock < 0) return "Valid stock is required";
  return "";
};

const readLocalProducts = async () => {
  try {
    const data = await fs.readFile(dataFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;

    const products = seedProducts.map(withDefaults);
    await writeLocalProducts(products);
    return products;
  }
};

const writeLocalProducts = async (products) => {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(products, null, 2));
};

router.post("/", async (req, res) => {
  try {
    const productData = normalizeProduct(req.body);
    const validationError = validateProductInput(productData);

    if (validationError) return res.status(400).json({ error: validationError });

    if (isMongoConnected()) {
      const saved = await Product.create(productData);
      return res.status(201).json(saved);
    }

    const products = await readLocalProducts();
    products.unshift(productData);
    await writeLocalProducts(products);
    res.status(201).json(productData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Products array is required" });
    }

    const products = req.body.map(normalizeProduct);
    const validationError = products.map(validateProductInput).find(Boolean);

    if (validationError) return res.status(400).json({ error: validationError });

    if (isMongoConnected()) {
      const saved = await Product.insertMany(products);
      return res.status(201).json(saved);
    }

    const currentProducts = await readLocalProducts();
    const saved = [...products, ...currentProducts];
    await writeLocalProducts(saved);
    res.status(201).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search = "", category = "" } = req.query;

    if (isMongoConnected()) {
      const query = { isDeleted: false };
      if (category) query.category = category;
      if (search) query.name = { $regex: search, $options: "i" };

      const products = await Product.find(query).sort({ createdAt: -1 });
      return res.json(products);
    }

    const products = await readLocalProducts();
    const filtered = products.filter((product) => {
      const matchesDeleted = !product.isDeleted;
      const matchesCategory = !category || product.category === category;
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
      return matchesDeleted && matchesCategory && matchesSearch;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/trash", async (req, res) => {
  try {
    if (isMongoConnected()) {
      const products = await Product.find({ isDeleted: true }).sort({ updatedAt: -1 });
      return res.json(products);
    }

    const products = await readLocalProducts();
    res.json(products.filter((product) => product.isDeleted));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (isMongoConnected() && !isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (isMongoConnected()) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.json(product);
    }

    const products = await readLocalProducts();
    const product = products.find((item) => item._id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/restore/:id", async (req, res) => {
  try {
    if (isMongoConnected() && !isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (isMongoConnected()) {
      const restored = await Product.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false },
        { new: true }
      );
      if (!restored) return res.status(404).json({ error: "Product not found" });
      return res.json(restored);
    }

    const products = await readLocalProducts();
    const product = products.find((item) => item._id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isDeleted = false;
    product.updatedAt = new Date().toISOString();
    await writeLocalProducts(products);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const productData = normalizeProduct({ ...req.body, _id: req.params.id });
    const validationError = validateProductInput(productData);

    if (validationError) return res.status(400).json({ error: validationError });
    if (isMongoConnected() && !isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (isMongoConnected()) {
      const updated = await Product.findByIdAndUpdate(req.params.id, productData, {
        new: true,
        runValidators: true
      });
      if (!updated) return res.status(404).json({ error: "Product not found" });
      return res.json(updated);
    }

    const products = await readLocalProducts();
    const index = products.findIndex((item) => item._id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Product not found" });

    products[index] = { ...products[index], ...productData };
    await writeLocalProducts(products);
    res.json(products[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (isMongoConnected() && !isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (isMongoConnected()) {
      const deleted = await Product.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true },
        { new: true }
      );
      if (!deleted) return res.status(404).json({ error: "Product not found" });
      return res.json(deleted);
    }

    const products = await readLocalProducts();
    const product = products.find((item) => item._id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isDeleted = true;
    product.updatedAt = new Date().toISOString();
    await writeLocalProducts(products);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
