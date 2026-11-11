const fs = require('fs');
const path = require('path');
const initialProducts = require('./data/seedProducts');
const initialOrders = require('./data/seedOrders');
const initialReviews = require('./data/seedReviews');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');
const mongoose = require('mongoose');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');

// Ensure JSON stores exist
function ensureStores() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2), 'utf-8');
  }
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(initialReviews, null, 2), 'utf-8');
  }
}

function readJson(file, fallback) {
  ensureStores();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

class StorageEngine {
  constructor() {
    this.useMongo = false;
    ensureStores();
  }

  setMongoActive(active) {
    this.useMongo = active;
  }

  // --- PRODUCTS ---
  async getAllProducts(category = null) {
    if (this.useMongo) {
      const query = category && category !== 'all' ? { category } : {};
      const sortRule = category && category !== 'all'
        ? { categoryOrder: 1, displayOrder: 1, createdAt: -1 }
        : { displayOrder: 1, categoryOrder: 1, createdAt: -1 };
      return await Product.find(query).sort(sortRule);
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    if (category && category !== 'all') {
      return products
        .filter((p) => p.category.toLowerCase() === category.toLowerCase())
        .sort((a, b) => {
          const ordA = a.categoryOrder !== undefined ? Number(a.categoryOrder) : (a.displayOrder !== undefined ? Number(a.displayOrder) : 999);
          const ordB = b.categoryOrder !== undefined ? Number(b.categoryOrder) : (b.displayOrder !== undefined ? Number(b.displayOrder) : 999);
          if (ordA !== ordB) return ordA - ordB;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }
    return [...products].sort((a, b) => {
      const ordA = a.displayOrder !== undefined ? Number(a.displayOrder) : 999;
      const ordB = b.displayOrder !== undefined ? Number(b.displayOrder) : 999;
      if (ordA !== ordB) return ordA - ordB;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  async getProductById(id) {
    if (this.useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await Product.findById(id);
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    return products.find((p) => String(p.id) === String(id) || String(p._id) === String(id));
  }

  async createProduct(data) {
    if (this.useMongo) {
      if (data.isHotDeal) {
        await Product.updateMany({}, { isHotDeal: false });
      }
      const newProduct = new Product(data);
      return await newProduct.save();
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    if (data.isHotDeal) {
      products.forEach((p) => { p.isHotDeal = false; });
    }
    const newProduct = {
      id: 'prod-' + Date.now(),
      _id: 'prod-' + Date.now(),
      name: data.name,
      category: data.category || 'chargers',
      price: Number(data.price) || 0,
      image: data.image || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80',
      image2: data.image2 || (data.images && data.images[1]) || '',
      image3: data.image3 || (data.images && data.images[2]) || '',
      image4: data.image4 || (data.images && data.images[3]) || '',
      images: data.images || [data.image, data.image2, data.image3, data.image4].filter(Boolean),
      details: data.details || '',
      stock: Number(data.stock) || 10,
      isOnSale: Boolean(data.isOnSale),
      originalPrice: Number(data.originalPrice) || 0,
      specs: data.specs || '',
      isBestSeller: Boolean(data.isBestSeller),
      isHotDeal: Boolean(data.isHotDeal),
      displayOrder: Number(data.displayOrder) > 0 ? Number(data.displayOrder) : (products.length + 1),
      categoryOrder: Number(data.categoryOrder) > 0 ? Number(data.categoryOrder) : 1,
      colors: Array.isArray(data.colors) ? data.colors.filter((c) => c && typeof c.name === 'string' && c.name.trim().length > 0) : [],
      createdAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    writeJson(PRODUCTS_FILE, products);
    return newProduct;
  }

  async updateProduct(id, data) {
    if (this.useMongo) {
      if (data.isHotDeal) {
        await Product.updateMany({ _id: { $ne: id } }, { isHotDeal: false });
      }
      return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    const index = products.findIndex((p) => String(p.id) === String(id) || String(p._id) === String(id));
    if (index === -1) return null;

    if (data.isHotDeal) {
      products.forEach((p) => {
        if (String(p.id) !== String(id) && String(p._id) !== String(id)) {
          p.isHotDeal = false;
        }
      });
    }

    products[index] = {
      ...products[index],
      ...data,
      price: data.price !== undefined ? Number(data.price) : products[index].price,
      stock: data.stock !== undefined ? Number(data.stock) : products[index].stock,
      isOnSale: data.isOnSale !== undefined ? Boolean(data.isOnSale) : (products[index].isOnSale || false),
      originalPrice: data.originalPrice !== undefined ? Number(data.originalPrice) : (products[index].originalPrice || 0),
      specs: data.specs !== undefined ? data.specs : (products[index].specs || ''),
      isBestSeller: data.isBestSeller !== undefined ? Boolean(data.isBestSeller) : (products[index].isBestSeller || false),
      isHotDeal: data.isHotDeal !== undefined ? Boolean(data.isHotDeal) : (products[index].isHotDeal || false),
      displayOrder: data.displayOrder !== undefined ? (Number(data.displayOrder) || 1) : (products[index].displayOrder !== undefined ? Number(products[index].displayOrder) : index + 1),
      categoryOrder: data.categoryOrder !== undefined ? (Number(data.categoryOrder) || 1) : (products[index].categoryOrder !== undefined ? Number(products[index].categoryOrder) : 1),
      colors: data.colors !== undefined
        ? (Array.isArray(data.colors) ? data.colors.filter((c) => c && typeof c.name === 'string' && c.name.trim().length > 0) : [])
        : (Array.isArray(products[index].colors) ? products[index].colors.filter((c) => c && typeof c.name === 'string' && c.name.trim().length > 0) : []),
      updatedAt: new Date().toISOString()
    };
    writeJson(PRODUCTS_FILE, products);
    return products[index];
  }

  async deleteProduct(id) {
    if (this.useMongo) {
      return await Product.findByIdAndDelete(id);
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    const index = products.findIndex((p) => String(p.id) === String(id) || String(p._id) === String(id));
    if (index === -1) return false;

    const removed = products.splice(index, 1);
    writeJson(PRODUCTS_FILE, products);
    return removed[0];
  }

  // --- ORDERS ---
  async getAllOrders(status = null) {
    if (this.useMongo) {
      const query = status && status !== 'all' ? { status } : {};
      return await Order.find(query).sort({ createdAt: -1 });
    }
    const orders = readJson(ORDERS_FILE, initialOrders);
    if (status && status !== 'all') {
      return orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }
    return orders;
  }

  async getOrderById(id) {
    if (this.useMongo) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };
      return await Order.findOne(query);
    }
    const orders = readJson(ORDERS_FILE, initialOrders);
    return orders.find((o) => o.orderId === id || String(o._id) === String(id) || String(o.id) === String(id));
  }

  async createOrder(data) {
    const orderId = 'CF-' + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      orderId,
      customer: data.customer,
      items: data.items,
      subtotal: Number(data.subtotal),
      shipping: Number(data.shipping || 0),
      total: Number(data.total),
      status: data.status || 'Pending',
      createdAt: new Date().toISOString()
    };

    if (this.useMongo) {
      const order = new Order(payload);
      return await order.save();
    }

    const orders = readJson(ORDERS_FILE, initialOrders);
    orders.unshift(payload);
    writeJson(ORDERS_FILE, orders);
    return payload;
  }

  async updateOrderStatus(id, status) {
    if (this.useMongo) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };
      return await Order.findOneAndUpdate(
        query,
        { status },
        { new: true }
      );
    }
    const orders = readJson(ORDERS_FILE, initialOrders);
    const index = orders.findIndex((o) => o.orderId === id || String(o._id) === String(id) || String(o.id) === String(id));
    if (index === -1) return null;

    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    return orders[index];
  }

  async deleteOrder(id) {
    if (this.useMongo) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };
      return await Order.findOneAndDelete(query);
    }
    const orders = readJson(ORDERS_FILE, initialOrders);
    const index = orders.findIndex((o) => o.orderId === id || String(o._id) === String(id));
    if (index === -1) return false;

    const removed = orders.splice(index, 1);
    writeJson(ORDERS_FILE, orders);
    return removed[0];
  }

  // --- CLIENT REVIEWS ---
  async getAllReviews() {
    if (this.useMongo) {
      return await Review.find().sort({ createdAt: -1 });
    }
    const reviews = readJson(REVIEWS_FILE, initialReviews);
    return [...reviews].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async getReviewById(id) {
    if (this.useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await Review.findById(id);
    }
    const reviews = readJson(REVIEWS_FILE, initialReviews);
    return reviews.find((r) => String(r.id) === String(id) || String(r._id) === String(id));
  }

  async createReview(data) {
    const payload = {
      id: 'rev-' + Date.now(),
      _id: 'rev-' + Date.now(),
      name: data.name ? data.name.trim() : 'Verified Customer',
      rating: Number(data.rating) || 5,
      comment: data.comment ? data.comment.trim() : '',
      city: data.city ? data.city.trim() : 'Pakistan',
      verified: data.verified !== undefined ? Boolean(data.verified) : true,
      productName: data.productName ? data.productName.trim() : '',
      createdAt: new Date().toISOString(),
    };

    if (this.useMongo) {
      const review = new Review(payload);
      return await review.save();
    }

    const reviews = readJson(REVIEWS_FILE, initialReviews);
    reviews.unshift(payload);
    writeJson(REVIEWS_FILE, reviews);
    return payload;
  }

  async updateReview(id, data) {
    if (this.useMongo) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { $or: [{ _id: id }, { id }] } : { id };
      return await Review.findOneAndUpdate(query, data, { new: true });
    }

    const reviews = readJson(REVIEWS_FILE, initialReviews);
    const index = reviews.findIndex((r) => String(r.id) === String(id) || String(r._id) === String(id));
    if (index === -1) return null;

    reviews[index] = {
      ...reviews[index],
      ...data,
      name: data.name !== undefined ? data.name.trim() : reviews[index].name,
      rating: data.rating !== undefined ? Number(data.rating) : reviews[index].rating,
      comment: data.comment !== undefined ? data.comment.trim() : reviews[index].comment,
      city: data.city !== undefined ? data.city.trim() : reviews[index].city,
      verified: data.verified !== undefined ? Boolean(data.verified) : reviews[index].verified,
      productName: data.productName !== undefined ? data.productName.trim() : reviews[index].productName,
      updatedAt: new Date().toISOString(),
    };
    writeJson(REVIEWS_FILE, reviews);
    return reviews[index];
  }

  async deleteReview(id) {
    if (this.useMongo) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { $or: [{ _id: id }, { id }] } : { id };
      return await Review.findOneAndDelete(query);
    }

    const reviews = readJson(REVIEWS_FILE, initialReviews);
    const index = reviews.findIndex((r) => String(r.id) === String(id) || String(r._id) === String(id));
    if (index === -1) return false;

    const removed = reviews.splice(index, 1);
    writeJson(REVIEWS_FILE, reviews);
    return removed[0];
  }
}

module.exports = new StorageEngine();
