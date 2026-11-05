const seedOrders = [
  {
    orderId: 'CF-8401',
    customer: {
      name: 'Alexander Wright',
      email: 'alex.wright@example.com',
      phone: '+1 (555) 234-8901',
      address: '742 Evergreen Terrace, Apt 4B',
      city: 'San Francisco, CA'
    },
    items: [
      {
        id: 'ap-301',
        name: 'AirPods Pro ANC Edition',
        price: 59.00,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80'
      },
      {
        id: 'ch-101',
        name: 'GaN 65W Dual Port Charger',
        price: 24.00,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80'
      }
    ],
    subtotal: 83.00,
    shipping: 0.00,
    total: 83.00,
    status: 'Processing',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    orderId: 'CF-8402',
    customer: {
      name: 'Sophia Chen',
      email: 'sophia.c@example.com',
      phone: '+1 (555) 789-4321',
      address: '120 Market Street, Suite 900',
      city: 'Seattle, WA'
    },
    items: [
      {
        id: 'hf-201',
        name: 'Type-C Braided In-Ear Earphones',
        price: 15.00,
        qty: 2,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80'
      }
    ],
    subtotal: 30.00,
    shipping: 4.99,
    total: 34.99,
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    orderId: 'CF-8395',
    customer: {
      name: 'Marcus Vance',
      email: 'm.vance@example.com',
      phone: '+1 (555) 456-1122',
      address: '488 Tech Blvd',
      city: 'Austin, TX'
    },
    items: [
      {
        id: 'ch-102',
        name: '100W Multi-Port Desktop Hub',
        price: 48.00,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=700&q=80'
      }
    ],
    subtotal: 48.00,
    shipping: 0.00,
    total: 48.00,
    status: 'Delivered',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

module.exports = seedOrders;

