const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    customer: {
      name: String,
      email: String
    },
    items: {
      type: [orderItemSchema],
      required: true
    },
    address: {
      fullName: String,
      phone: String,
      line1: String,
      city: String,
      pincode: String
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "upi", "card"],
      default: "cod"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },
    status: {
      type: String,
      enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed"
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
