const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    image: {
      type: String,
      default: "",
      trim: true
    },
    stock: {
      type: Number,
      default: 10,
      min: [0, "Stock cannot be negative"]
    },
    serviceItem: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
