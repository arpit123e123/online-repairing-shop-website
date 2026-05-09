const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();
const usersFile = path.join(__dirname, "..", "data", "users.json");
const tokenSecret = process.env.AUTH_SECRET || "patwa-local-secret";

const isMongoConnected = () => mongoose.connection.readyState === 1;

const readLocalUsers = async () => {
  try {
    const data = await fs.readFile(usersFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    await writeLocalUsers([]);
    return [];
  }
};

const writeLocalUsers = async (users) => {
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, savedHash) => {
  const [salt] = savedHash.split(":");
  return hashPassword(password, salt) === savedHash;
};

const safeUser = (user) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: user.email,
  role: user.role || "customer"
});

const signToken = (user) => {
  const payload = Buffer.from(
    JSON.stringify({ id: safeUser(user).id, email: user.email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

const verifyToken = (token) => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  if (signature !== expected) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (Date.now() > data.exp) return null;

  return data;
};

const validateAuthInput = ({ name, email, password }, isRegister) => {
  if (isRegister && !name?.trim()) return "Name is required";
  if (!email?.trim()) return "Email is required";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Valid email is required";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  return "";
};

router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const validationError = validateAuthInput({ name, email, password }, true);

    if (validationError) return res.status(400).json({ error: validationError });

    if (isMongoConnected()) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const user = await User.create({ name, email, passwordHash: hashPassword(password) });
      return res.status(201).json({ user: safeUser(user), token: signToken(user) });
    }

    const users = await readLocalUsers();
    if (users.some((user) => user.email === email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      role: "customer",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await writeLocalUsers(users);
    res.status(201).json({ user: safeUser(user), token: signToken(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const validationError = validateAuthInput({ email, password }, false);

    if (validationError) return res.status(400).json({ error: validationError });

    if (isMongoConnected()) {
      const user = await User.findOne({ email });
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return res.json({ user: safeUser(user), token: signToken(user) });
    }

    const users = await readLocalUsers();
    const user = users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ user: safeUser(user), token: signToken(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = token ? verifyToken(token) : null;

    if (!session) return res.status(401).json({ error: "Login required" });

    if (isMongoConnected()) {
      const user = await User.findById(session.id);
      if (!user) return res.status(401).json({ error: "Login required" });
      return res.json({ user: safeUser(user) });
    }

    const users = await readLocalUsers();
    const user = users.find((item) => item.id === session.id);
    if (!user) return res.status(401).json({ error: "Login required" });

    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(401).json({ error: "Login required" });
  }
});

module.exports = router;
