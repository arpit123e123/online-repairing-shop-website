const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const { notifyOrderPlaced } = require("../services/notificationService");

const router = express.Router();
const ordersFile = path.join(__dirname, "..", "data", "orders.json");
const usersFile = path.join(__dirname, "..", "data", "users.json");
const tokenSecret = process.env.AUTH_SECRET || "patwa-local-secret";

const isMongoConnected = () => mongoose.connection.readyState === 1;

const readJson = async (file, fallback) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    await writeJson(file, fallback);
    return fallback;
  }
};

const writeJson = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};

const safeUser = (user) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: user.email,
  role: user.role || "customer"
});

const verifyToken = (token) => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  if (signature !== expected) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (Date.now() > data.exp) return null;

  return data;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = token ? verifyToken(token) : null;

    if (!session) return res.status(401).json({ error: "Login required" });

    if (isMongoConnected()) {
      const user = await User.findById(session.id);
      if (!user) return res.status(401).json({ error: "Login required" });
      req.user = safeUser(user);
      return next();
    }

    const users = await readJson(usersFile, []);
    const user = users.find((item) => item.id === session.id);
    if (!user) return res.status(401).json({ error: "Login required" });

    req.user = safeUser(user);
    next();
  } catch (err) {
    res.status(401).json({ error: "Login required" });
  }
};

const validateOrder = ({ items, address, paymentMethod }) => {
  if (!Array.isArray(items) || items.length === 0) return "Cart is empty";
  if (!["cod", "upi", "card"].includes(paymentMethod)) return "Invalid payment method";

  const missingItem = items.some((item) => {
    return !item.productId || !item.name || Number(item.price) < 0 || Number(item.quantity) < 1;
  });

  if (missingItem) return "Invalid cart items";

  const requiredAddressFields = ["fullName", "phone", "line1", "city", "pincode"];
  const missingAddress = requiredAddressFields.some((field) => !address?.[field]?.trim());

  if (missingAddress) return "Delivery address is required";
  return "";
};

const normalizeOrder = (body, user) => {
  const items = body.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity)
  }));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    userId: user.id,
    customer: {
      name: user.name,
      email: user.email
    },
    items,
    address: body.address,
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentMethod === "cod" ? "pending" : "paid",
    status: "placed",
    total
  };
};

router.post("/", requireAuth, async (req, res) => {
  try {
    const validationError = validateOrder(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const orderData = normalizeOrder(req.body, req.user);

    if (isMongoConnected()) {
      const order = await Order.create(orderData);
      await notifyOrderPlaced(order);
      return res.status(201).json(order);
    }

    const orders = await readJson(ordersFile, []);
    const order = {
      ...orderData,
      _id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.unshift(order);
    await writeJson(ordersFile, orders);
    await notifyOrderPlaced(order);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json(orders);
    }

    const orders = await readJson(ordersFile, []);
    res.json(orders.filter((order) => order.userId === req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
