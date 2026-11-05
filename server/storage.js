const fs = require('fs');
const path = require('path');
const initialProducts = require('./data/seedProducts');
const initialOrders = require('./data/seedOrders');
const Product = require('./models/Product');
const Order = require('./models/Order');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Ensure JSON stores exist
function ensureStores() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2), 'utf-8');
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
      return await Product.find(query).sort({ createdAt: -1 });
    }
    const products = readJson(PRODUCTS_FILE, initialProducts);
    if (category && category !== 'all') {
      return products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    return products;
  }

  async getProductById(id) {
    if (this.useMongo) {
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
      return await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });
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
      return await Order.findOneAndUpdate(
        { $or: [{ _id: id }, { orderId: id }] },
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
      return await Order.findOneAndDelete({ $or: [{ _id: id }, { orderId: id }] });
    }
    const orders = readJson(ORDERS_FILE, initialOrders);
    const index = orders.findIndex((o) => o.orderId === id || String(o._id) === String(id));
    if (index === -1) return false;

    const removed = orders.splice(index, 1);
    writeJson(ORDERS_FILE, orders);
    return removed[0];
  }
}

module.exports = new StorageEngine();
