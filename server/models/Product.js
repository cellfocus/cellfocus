const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['chargers', 'handsfree', 'airpods', 'accessories'],
      default: 'chargers',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80',
    },
    image2: {
      type: String,
      default: '',
    },
    image3: {
      type: String,
      default: '',
    },
    image4: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    details: {
      type: String,
      default: '',
    },
    stock: {
      type: Number,
      default: 20,
      min: 0,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    specs: {
      type: String,
      default: '',
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isHotDeal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);

