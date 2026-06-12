import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const JWT_SECRET = 'foodpanda_bangladesh_jwt_secret_999';
const DB_FILE = path.join(process.cwd(), 'db.json');

// --- DATABASE STATE & SEED DATA ---
interface LiveRider {
  id: string; // user id
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'delivering';
  currentLat: number;
  currentLng: number;
}

interface Database {
  users: any[];
  categories: any[];
  products: any[];
  orders: any[];
  riders: LiveRider[];
  banners: any[];
  deliveryChargeSettings: { baseCharge: number; freeDeliveryThreshold: number };
  deliveryAreas: any[];
  siteSettings: {
    brandName: string;
    logoUrl?: string;
    phone: string;
    email: string;
    facebookUrl?: string;
    instagramUrl?: string;
    deliveryEstimateMins: number;
    contactAddress: string;
    tagline?: string;
    whatsAppNumber?: string;
    youtubeUrl?: string;
    footerText?: string;
    footerLogoUrl?: string;
    faviconUrl?: string;
    mobileAppIconUrl?: string;
    logoWidth?: string | number;
    logoHeight?: string | number;
    logoPosition?: string;
    primaryColor?: string;
    secondaryColor?: string;
    buttonColor?: string;
    headerBgColor?: string;
    footerBgColor?: string;
    enableHeroBanner?: boolean;
    enableCategories?: boolean;
    enableFeaturedProducts?: boolean;
    enablePromotionalSections?: boolean;
    homepageSectionsOrder?: string[];
  };
}

const seedCategories = [
  { id: 'cat-1', name: 'Kacchi & Biryani', slug: 'kacchi-biryani', type: 'food', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80' },
  { id: 'cat-2', name: 'Snacks & Kebabs', slug: 'snacks-kebabs', type: 'food', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80' },
  { id: 'cat-3', name: 'Curry & Rice', slug: 'curry-rice', type: 'food', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=500&q=80' },
  { id: 'cat-4', name: 'Fresh Vegetables', slug: 'fresh-vegetables', type: 'grocery', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80' },
  { id: 'cat-5', name: 'Dairy & Eggs', slug: 'dairy-eggs', type: 'grocery', image: 'https://images.unsplash.com/photo-1528750994873-cd9d37d80ae0?auto=format&fit=crop&w=500&q=80' },
  { id: 'cat-6', name: 'Baking & Cooking Essentials', slug: 'cooking-essentials', type: 'grocery', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80' }
];

const seedProducts = [
  { id: 'p-1', name: 'Sultans Dine Style Kacchi', description: 'Richly flavored Basmati rice layered with premium mutton chunks marinated in authentic spices, potatoes, and soft saffron touch.', price: 349, image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-1', stock: 50, isAvailable: true, type: 'food' },
  { id: 'p-2', name: 'Tehari Mutton Special', description: 'Old Dhaka style mustard oil tehari cooked with aromatic Chinigura rice and tender diced mutton bits.', price: 290, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-1', stock: 40, isAvailable: true, type: 'food' },
  { id: 'p-3', name: 'Shami Kebab (Plain Beef)', description: 'Perfectly spiced beef minced patty, pan-fried with egg wash. Pack of 2.', price: 120, image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-2', stock: 100, isAvailable: true, type: 'food' },
  { id: 'p-4', name: 'Beef Bhuna Khichuri', description: 'Deep yellow bhuna khichuri cooked with premium lentils and served with delicious spicy beef curry.', price: 310, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-3', stock: 35, isAvailable: true, type: 'food' },
  { id: 'p-5', name: 'Morog Polao Special', description: 'Royal wedding style chicken roast cooked with soft ghee-infused fragant Beresta polao and boiled egg.', price: 280, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-3', stock: 45, isAvailable: true, type: 'food' },
  { id: 'p-6', name: 'Premium Rajshahi Mangoes 1kg', description: 'Sweet, fleshy, and extremely delicious Gopalbhog/Fazli mangoes direct from Rajshahi orchards.', price: 180, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-4', stock: 200, isAvailable: true, type: 'grocery' },
  { id: 'p-7', name: 'Farm Brand Eggs (Dozen)', description: 'Freshly packed organic brown shell chicken eggs from clean poultry farms.', price: 145, image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-5', stock: 80, isAvailable: true, type: 'grocery' },
  { id: 'p-8', name: 'Pran Full Cream Milk Powder 400g', description: 'Rich, high-calcium instant milk powder perfect for tea, yogurt, and delicious desserts.', price: 410, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-5', stock: 150, isAvailable: true, type: 'grocery' },
  { id: 'p-9', name: 'Radhuni Biryani Masala 40g', description: 'Complete spice mix formulation tailored for aromatic, wedding-style Biryani in Bangladeshi kitchens.', price: 55, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80', categoryId: 'cat-6', stock: 300, isAvailable: true, type: 'grocery' }
];

function loadDB(): Database {
  const defaultBanners = [
    { id: 'b-1', title: '50% Off First Guest Order', titleBn: 'প্রথম অর্ডারে ৫০% মূল্যছাড়!', subtitle: 'Use Code: PANDA50 | Traditional Chandpur & Traditional Delights', subtitleBn: 'কোড ব্যবহার করুন: PANDA50 | চাঁদপুরের ঐতিহ্যবাহী সুস্বাদু খাবারের মহাসম্ভার', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', isActive: true },
    { id: 'b-2', title: 'Chandpur Grocery Flash Deal', titleBn: 'চাঁদপুর মুদি বাজার ফ্ল্যাশ ডিল', subtitle: 'Fresh farm vegetables & organic eggs within 20 minutes delivery', subtitleBn: 'তাজা খামারের সবজি এবং ডিম মাত্র ২০ মিনিটে আপনার দ্বারে ডেলিভারি', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', isActive: true }
  ];

  const defaultDeliveryChargeSettings = { baseCharge: 30, freeDeliveryThreshold: 500 };

  const defaultDeliveryAreas = [
    { id: 'da-1', name: 'Debpur, Chandpur', radiusKm: 3, deliveryCharge: 20, minOrderAmount: 100, isActive: true },
    { id: 'da-2', name: 'Baburhat, Chandpur', radiusKm: 5, deliveryCharge: 35, minOrderAmount: 150, isActive: true },
    { id: 'da-3', name: 'Chandpur Sadar Town', radiusKm: 8, deliveryCharge: 50, minOrderAmount: 200, isActive: true }
  ];

  const defaultSiteSettings = {
    brandName: "pandamart Chandpur",
    tagline: "Fastest Food and Grocery Delivery in Debpur & Chandpur District",
    phone: "+8801711122333",
    whatsAppNumber: "+8801711122333",
    email: "support@pandachandpur.com.bd",
    facebookUrl: "https://facebook.com/pandachandpur",
    instagramUrl: "https://instagram.com/pandachandpur",
    youtubeUrl: "https://youtube.com/pandachandpur",
    footerText: "© 2026 pandamart Chandpur Ltd. Fastest digital food distribution in Debpur, Chandpur, Bangladesh.",
    deliveryEstimateMins: 20,
    contactAddress: "Debpur Bazar, Chandpur Sadar, Bangladesh",
    logoUrl: "🐼",
    footerLogoUrl: "🐼",
    faviconUrl: "🐼",
    mobileAppIconUrl: "🐼",
    logoWidth: "160",
    logoHeight: "45",
    logoPosition: "left" as const,
    primaryColor: "#e11d48",
    secondaryColor: "#be123c",
    buttonColor: "#e11d48",
    headerBgColor: "#ffffff",
    footerBgColor: "#0f172a",
    enableHeroBanner: true,
    enableCategories: true,
    enableFeaturedProducts: true,
    enablePromotionalSections: true,
    homepageSectionsOrder: ["hero", "categories", "promotions", "featured"]
  };

  if (!fs.existsSync(DB_FILE)) {
    // Generate initial seeds including default admin and rider
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const riderHash = bcrypt.hashSync('rider123', 10);
    const customerHash = bcrypt.hashSync('customer123', 10);

    const initialDB: any = {
      users: [
        { id: 'u-admin', email: 'admin@foodpanda.com', name: 'Mahbubur Rahman (Admin)', phone: '01711122333', address: 'Debpur Bazar, Chandpur, Bangladesh', role: 'admin', password: passwordHash, createdAt: new Date().toISOString() },
        { id: 'u-rider1', email: 'shakil@foodpanda.com', name: 'Shakil Ahmed (Rider)', phone: '01822334455', address: 'Debpur Central, Chandpur', role: 'rider', password: riderHash, createdAt: new Date().toISOString() },
        { id: 'u-rider2', email: 'korim@foodpanda.com', name: 'Korim Ullah (Rider)', phone: '01933445566', address: 'Baburhat, Chandpur', role: 'rider', password: riderHash, createdAt: new Date().toISOString() }
      ],
      categories: seedCategories,
      products: seedProducts,
      orders: [],
      riders: [
        { id: 'u-rider1', name: 'Shakil Ahmed (Rider)', phone: '01822334455', status: 'active', currentLat: 23.2325, currentLng: 90.7201 },
        { id: 'u-rider2', name: 'Korim Ullah (Rider)', phone: '01933445566', status: 'inactive', currentLat: 23.2285, currentLng: 90.7165 }
      ],
      banners: defaultBanners,
      deliveryChargeSettings: defaultDeliveryChargeSettings,
      deliveryAreas: defaultDeliveryAreas,
      siteSettings: defaultSiteSettings
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    
    // Fill in values for backward compatibility
    let dirty = false;
    if (!db.banners) {
      db.banners = defaultBanners;
      dirty = true;
    }
    if (!db.deliveryChargeSettings) {
      db.deliveryChargeSettings = defaultDeliveryChargeSettings;
      dirty = true;
    }
    if (!db.deliveryAreas) {
      db.deliveryAreas = defaultDeliveryAreas;
      dirty = true;
    }
    if (!db.siteSettings) {
      db.siteSettings = defaultSiteSettings;
      dirty = true;
    }

    if (dirty) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }

    return db;
  } catch (error) {
    console.error('Failed to read db file, recreating', error);
    return {
      users: [],
      categories: [],
      products: [],
      orders: [],
      riders: [],
      banners: defaultBanners,
      deliveryChargeSettings: defaultDeliveryChargeSettings,
      deliveryAreas: defaultDeliveryAreas,
      siteSettings: defaultSiteSettings
    };
  }
}

function saveDB(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Ensure database is initialized
let dbData = loadDB();

// --- WEB SOCKET SERVER SYSTEM ---
// Keep track of active connections
interface ClientSocket {
  ws: WebSocket;
  userId?: string;
  role?: string;
  orderId?: string; // watching orderId
}
const activeClients = new Set<ClientSocket>();

function broadcastToOrderWatchers(orderId: string, message: any) {
  const payloadStr = JSON.stringify(message);
  for (const client of activeClients) {
    if (client.orderId === orderId || client.role === 'admin' || client.userId === message.customerId) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payloadStr);
      }
    }
  }
}

function broadcastToAdmins(message: any) {
  const payloadStr = JSON.stringify(message);
  for (const client of activeClients) {
    if (client.role === 'admin') {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payloadStr);
      }
    }
  }
}

// --- EXPRESS APPLICATION SETUP ---
async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Parse JSON bodies (increased limits for Base64 image transfers)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // --- MIDDLEWARE FOR AUTH ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
      req.user = user;
      next();
    });
  };

  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
      }
      next();
    };
  };

  // --- REST API ENDPOINTS ---

  // Auth endpoints
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone, address, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const lowerEmail = email.toLowerCase().trim();
    dbData = loadDB();
    const existing = dbData.users.find(u => u.email.toLowerCase() === lowerEmail);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const assignedRole = role && ['customer', 'rider'].includes(role) ? role : 'customer';
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      email: lowerEmail,
      name,
      phone: phone || '',
      address: address || '',
      role: assignedRole,
      password: passwordHash,
      createdAt: new Date().toISOString()
    };

    dbData.users.push(newUser);

    // If registered as rider, add them to the trackable riders collection
    if (assignedRole === 'rider') {
      dbData.riders.push({
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        status: 'inactive',
        currentLat: 23.7561, // Starting coordinates centered in Dhaka
        currentLng: 90.3758
      });
    }

    saveDB(dbData);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, phone: newUser.phone, address: newUser.address, role: newUser.role }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    dbData = loadDB();
    const user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, address: user.address, role: user.role }
    });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    dbData = loadDB();
    const user = dbData.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
  });

  app.put('/api/auth/profile', authenticateToken, (req: any, res) => {
    const { name, phone, address } = req.body;
    dbData = loadDB();
    const idx = dbData.users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });

    dbData.users[idx].name = name || dbData.users[idx].name;
    dbData.users[idx].phone = phone || dbData.users[idx].phone;
    dbData.users[idx].address = address || dbData.users[idx].address;

    // sync active rider status details
    if (dbData.users[idx].role === 'rider') {
      const rIdx = dbData.riders.findIndex(r => r.id === req.user.id);
      if (rIdx !== -1) {
        dbData.riders[rIdx].name = dbData.users[idx].name;
        dbData.riders[rIdx].phone = dbData.users[idx].phone;
      }
    }

    saveDB(dbData);
    res.status(200).json({
      id: dbData.users[idx].id,
      email: dbData.users[idx].email,
      name: dbData.users[idx].name,
      phone: dbData.users[idx].phone,
      address: dbData.users[idx].address,
      role: dbData.users[idx].role
    });
  });

  // Category endpoints
  app.get('/api/categories', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.categories);
  });

  app.post('/api/admin/categories', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, nameBn, slug, type, image } = req.body;
    if (!name || !slug) return res.status(400).json({ message: 'Category Name and slug are required' });

    dbData = loadDB();
    const newCat = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      name,
      nameBn: nameBn || '',
      slug,
      type: type || 'food',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'
    };
    dbData.categories.push(newCat);
    saveDB(dbData);
    res.status(201).json(newCat);
  });

  app.put('/api/admin/categories/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, nameBn, slug, type, image } = req.body;
    dbData = loadDB();
    const idx = dbData.categories.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Category not found' });

    dbData.categories[idx] = {
      ...dbData.categories[idx],
      name: name || dbData.categories[idx].name,
      nameBn: nameBn !== undefined ? nameBn : dbData.categories[idx].nameBn,
      slug: slug || dbData.categories[idx].slug,
      type: type || dbData.categories[idx].type,
      image: image || dbData.categories[idx].image
    };

    saveDB(dbData);
    res.status(200).json(dbData.categories[idx]);
  });

  app.delete('/api/admin/categories/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    dbData = loadDB();
    dbData.categories = dbData.categories.filter(c => c.id !== req.params.id);
    saveDB(dbData);
    res.status(200).json({ message: 'Category deleted' });
  });

  // Product endpoints
  app.get('/api/products', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.products);
  });

  app.post('/api/admin/products', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, nameBn, description, descriptionBn, price, image, categoryId, stock, isAvailable, type } = req.body;
    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    dbData = loadDB();
    const newProduct = {
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      name,
      nameBn: nameBn || '',
      description: description || '',
      descriptionBn: descriptionBn || '',
      price: Number(price),
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
      categoryId,
      stock: stock !== undefined ? Number(stock) : 100,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      type: type || 'food'
    };
    dbData.products.push(newProduct);
    saveDB(dbData);
    res.status(201).json(newProduct);
  });

  app.put('/api/admin/products/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, nameBn, description, descriptionBn, price, image, categoryId, stock, isAvailable, type } = req.body;
    dbData = loadDB();
    const idx = dbData.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Product not found' });

    dbData.products[idx] = {
      ...dbData.products[idx],
      name: name || dbData.products[idx].name,
      nameBn: nameBn !== undefined ? nameBn : dbData.products[idx].nameBn,
      description: description !== undefined ? description : dbData.products[idx].description,
      descriptionBn: descriptionBn !== undefined ? descriptionBn : dbData.products[idx].descriptionBn,
      price: price !== undefined ? Number(price) : dbData.products[idx].price,
      image: image || dbData.products[idx].image,
      categoryId: categoryId || dbData.products[idx].categoryId,
      stock: stock !== undefined ? Number(stock) : dbData.products[idx].stock,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : dbData.products[idx].isAvailable,
      type: type || dbData.products[idx].type
    };

    saveDB(dbData);
    res.status(200).json(dbData.products[idx]);
  });

  app.delete('/api/admin/products/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    dbData = loadDB();
    dbData.products = dbData.products.filter(p => p.id !== req.params.id);
    saveDB(dbData);
    res.status(200).json({ message: 'Product deleted successfully' });
  });

  // Rider tracking lists
  app.get('/api/riders', authenticateToken, requireRole(['admin']), (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.riders);
  });

  app.put('/api/riders/status', authenticateToken, requireRole(['rider']), (req: any, res) => {
    const { status } = req.body;
    dbData = loadDB();
    const rIdx = dbData.riders.findIndex(r => r.id === req.user.id);
    if (rIdx === -1) {
      // create rider if missing
      dbData.riders.push({
        id: req.user.id,
        name: req.user.name,
        phone: '',
        status: status || 'active',
        currentLat: 23.7561,
        currentLng: 90.3758
      });
    } else {
      dbData.riders[rIdx].status = status || dbData.riders[rIdx].status;
    }
    saveDB(dbData);
    res.status(200).json(dbData.riders.find(r => r.id === req.user.id));
  });

  // Order endpoints
  app.get('/api/orders', authenticateToken, (req: any, res) => {
    dbData = loadDB();
    let userOrders = [];
    if (req.user.role === 'admin') {
      userOrders = dbData.orders;
    } else if (req.user.role === 'rider') {
      userOrders = dbData.orders.filter(o => o.riderId === req.user.id);
    } else {
      userOrders = dbData.orders.filter(o => o.customerId === req.user.id);
    }
    // sort newest first
    res.status(200).json(userOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get('/api/orders/:id', authenticateToken, (req: any, res) => {
    dbData = loadDB();
    const order = dbData.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Access control check
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }
    if (req.user.role === 'rider' && order.riderId !== req.user.id) {
      return res.status(403).json({ message: 'No access privileges for this order' });
    }

    res.status(200).json(order);
  });

  app.post('/api/orders', authenticateToken, requireRole(['customer']), (req: any, res) => {
    const { items, customerAddress, deliveryNotes, subtotal, deliveryFee, total, phone } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    dbData = loadDB();
    const newOrder = {
      id: 'ord-' + Math.random().toString(36).substr(2, 9),
      customerId: req.user.id,
      customerName: req.user.name,
      customerPhone: phone || req.user.phone || '01XXXXXXXXX',
      customerAddress: customerAddress || req.user.address || 'Dhaka',
      items,
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee),
      total: Number(total),
      status: 'pending',
      riderId: null,
      riderName: null,
      riderPhone: null,
      createdAt: new Date().toISOString(),
      locationHistory: [], // empty till rider starts delivery
      notes: deliveryNotes || ''
    };

    dbData.orders.push(newOrder);
    saveDB(dbData);

    // Notify administrators of new pending order
    broadcastToAdmins({
      type: 'new_order',
      order: newOrder
    });

    res.status(201).json(newOrder);
  });

  // Admin assignments
  app.put('/api/orders/:id/assign', authenticateToken, requireRole(['admin']), (req, res) => {
    const { riderId } = req.body;
    dbData = loadDB();
    const orderIdx = dbData.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) return res.status(404).json({ message: 'Order not found' });

    const rider = dbData.users.find(u => u.id === riderId && u.role === 'rider');
    if (!rider) return res.status(400).json({ message: 'Selected user is not a valid rider' });

    dbData.orders[orderIdx].riderId = riderId;
    dbData.orders[orderIdx].riderName = rider.name;
    dbData.orders[orderIdx].riderPhone = rider.phone || '01XXXXXXXXX';
    dbData.orders[orderIdx].status = 'accepted'; // automatic change on assignment

    // update rider's trackable state
    const trackRiderIdx = dbData.riders.findIndex(r => r.id === riderId);
    if (trackRiderIdx !== -1) {
      dbData.riders[trackRiderIdx].status = 'delivering';
    }

    saveDB(dbData);

    // Broadcast update via websockets
    const updatedOrder = dbData.orders[orderIdx];
    broadcastToOrderWatchers(updatedOrder.id, {
      type: 'order_update',
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      riderId: updatedOrder.riderId,
      riderName: updatedOrder.riderName,
      riderPhone: updatedOrder.riderPhone,
      order: updatedOrder
    });

    res.status(200).json(updatedOrder);
  });

  // Rider state modifications
  app.put('/api/orders/:id/status', authenticateToken, requireRole(['rider', 'admin']), (req: any, res) => {
    const { status } = req.body;
    if (!['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status transition' });
    }

    dbData = loadDB();
    const orderIdx = dbData.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) return res.status(404).json({ message: 'Order not found' });

    const order = dbData.orders[orderIdx];
    // check authentication
    if (req.user.role === 'rider' && order.riderId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to status-update this order' });
    }

    dbData.orders[orderIdx].status = status;

    // release rider if delivered or canceled
    if (['delivered', 'cancelled'].includes(status) && order.riderId) {
      const rIdx = dbData.riders.findIndex(r => r.id === order.riderId);
      if (rIdx !== -1) {
        dbData.riders[rIdx].status = 'active'; // free to accept another order
      }
    }

    saveDB(dbData);

    const updatedOrder = dbData.orders[orderIdx];
    broadcastToOrderWatchers(updatedOrder.id, {
      type: 'order_update',
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      order: updatedOrder
    });

    res.status(200).json(updatedOrder);
  });

  // Rider live uploads of coordinates
  app.put('/api/orders/:id/location', authenticateToken, requireRole(['rider']), (req: any, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'Coordinates missing' });

    dbData = loadDB();
    const orderIdx = dbData.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) return res.status(404).json({ message: 'Order not found' });

    const order = dbData.orders[orderIdx];
    if (order.riderId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized location sharing' });
    }

    const timestamp = Date.now();
    const newLoc = { lat: Number(lat), lng: Number(lng), timestamp };

    // Record history
    dbData.orders[orderIdx].locationHistory = dbData.orders[orderIdx].locationHistory || [];
    dbData.orders[orderIdx].locationHistory.push(newLoc);

    // Sync current globally trackable state for rider lists
    const rIdx = dbData.riders.findIndex(r => r.id === req.user.id);
    if (rIdx !== -1) {
      dbData.riders[rIdx].currentLat = Number(lat);
      dbData.riders[rIdx].currentLng = Number(lng);
    }

    saveDB(dbData);

    // Broadcast location immediately to tracking customer & admin map
    broadcastToOrderWatchers(order.id, {
      type: 'location_update',
      orderId: order.id,
      lat: Number(lat),
      lng: Number(lng),
      timestamp,
      locationHistory: dbData.orders[orderIdx].locationHistory
    });

    res.status(200).json({ success: true, count: dbData.orders[orderIdx].locationHistory.length });
  });

  // --- SETTINGS, BANNERS & CONFIGS ---

  // Banners Endpoints
  app.get('/api/banners', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.banners || []);
  });

  app.post('/api/admin/banners', authenticateToken, requireRole(['admin']), (req, res) => {
    const { title, titleBn, subtitle, subtitleBn, image, isActive } = req.body;
    if (!title || !image) {
      return res.status(400).json({ message: 'Title and Image URL are required' });
    }
    dbData = loadDB();
    const newBanner = {
      id: 'b-' + Math.random().toString(36).substr(2, 9),
      title,
      titleBn: titleBn || '',
      subtitle: subtitle || '',
      subtitleBn: subtitleBn || '',
      image,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };
    dbData.banners.push(newBanner);
    saveDB(dbData);
    res.status(201).json(newBanner);
  });

  app.put('/api/admin/banners/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    const { title, titleBn, subtitle, subtitleBn, image, isActive } = req.body;
    dbData = loadDB();
    const bIdx = dbData.banners.findIndex(b => b.id === req.params.id);
    if (bIdx === -1) return res.status(404).json({ message: 'Banner not found' });

    dbData.banners[bIdx] = {
      ...dbData.banners[bIdx],
      title: title !== undefined ? title : dbData.banners[bIdx].title,
      titleBn: titleBn !== undefined ? titleBn : dbData.banners[bIdx].titleBn,
      subtitle: subtitle !== undefined ? subtitle : dbData.banners[bIdx].subtitle,
      subtitleBn: subtitleBn !== undefined ? subtitleBn : dbData.banners[bIdx].subtitleBn,
      image: image !== undefined ? image : dbData.banners[bIdx].image,
      isActive: isActive !== undefined ? Boolean(isActive) : dbData.banners[bIdx].isActive
    };
    saveDB(dbData);
    res.status(200).json(dbData.banners[bIdx]);
  });

  app.delete('/api/admin/banners/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    dbData = loadDB();
    dbData.banners = dbData.banners.filter(b => b.id !== req.params.id);
    saveDB(dbData);
    res.status(200).json({ message: 'Banner deleted successfully' });
  });

  // Delivery Charges Config
  app.get('/api/settings/delivery-charges', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.deliveryChargeSettings);
  });

  app.put('/api/admin/settings/delivery-charges', authenticateToken, requireRole(['admin']), (req, res) => {
    const { baseCharge, freeDeliveryThreshold } = req.body;
    if (baseCharge === undefined || freeDeliveryThreshold === undefined) {
      return res.status(400).json({ message: 'baseCharge and freeDeliveryThreshold are required' });
    }
    dbData = loadDB();
    dbData.deliveryChargeSettings = {
      baseCharge: Number(baseCharge),
      freeDeliveryThreshold: Number(freeDeliveryThreshold)
    };
    saveDB(dbData);
    res.status(200).json(dbData.deliveryChargeSettings);
  });

  // Delivery Areas
  app.get('/api/delivery-areas', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.deliveryAreas || []);
  });

  app.post('/api/admin/delivery-areas', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, radiusKm, deliveryCharge, minOrderAmount, isActive } = req.body;
    if (!name || radiusKm === undefined) {
      return res.status(400).json({ message: 'Area name and radiusKm are required' });
    }
    dbData = loadDB();
    const newArea = {
      id: 'da-' + Math.random().toString(36).substr(2, 9),
      name,
      radiusKm: Number(radiusKm),
      deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : 30,
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 100,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };
    dbData.deliveryAreas.push(newArea);
    saveDB(dbData);
    res.status(201).json(newArea);
  });

  app.put('/api/admin/delivery-areas/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    const { name, radiusKm, deliveryCharge, minOrderAmount, isActive } = req.body;
    dbData = loadDB();
    const aIdx = dbData.deliveryAreas.findIndex(a => a.id === req.params.id);
    if (aIdx === -1) return res.status(404).json({ message: 'Delivery area not found' });

    dbData.deliveryAreas[aIdx] = {
      ...dbData.deliveryAreas[aIdx],
      name: name !== undefined ? name : dbData.deliveryAreas[aIdx].name,
      radiusKm: radiusKm !== undefined ? Number(radiusKm) : dbData.deliveryAreas[aIdx].radiusKm,
      deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : dbData.deliveryAreas[aIdx].deliveryCharge !== undefined ? Number(dbData.deliveryAreas[aIdx].deliveryCharge) : 30,
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : dbData.deliveryAreas[aIdx].minOrderAmount !== undefined ? Number(dbData.deliveryAreas[aIdx].minOrderAmount) : 100,
      isActive: isActive !== undefined ? Boolean(isActive) : dbData.deliveryAreas[aIdx].isActive
    };
    saveDB(dbData);
    res.status(200).json(dbData.deliveryAreas[aIdx]);
  });

  app.delete('/api/admin/delivery-areas/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    dbData = loadDB();
    dbData.deliveryAreas = dbData.deliveryAreas.filter(a => a.id !== req.params.id);
    saveDB(dbData);
    res.status(200).json({ message: 'Delivery area deleted successfully' });
  });

  // Site Settings
  app.get('/api/settings/site', (req, res) => {
    dbData = loadDB();
    res.status(200).json(dbData.siteSettings);
  });

  app.put('/api/admin/settings/site', authenticateToken, requireRole(['admin']), (req, res) => {
    const { 
      brandName, tagline, phone, whatsAppNumber, email, facebookUrl, instagramUrl, youtubeUrl, footerText, deliveryEstimateMins, contactAddress,
      logoUrl, footerLogoUrl, faviconUrl, mobileAppIconUrl, logoWidth, logoHeight, logoPosition,
      primaryColor, secondaryColor, buttonColor, headerBgColor, footerBgColor,
      enableHeroBanner, enableCategories, enableFeaturedProducts, enablePromotionalSections, homepageSectionsOrder
    } = req.body;

    if (!brandName || !phone || !email) {
      return res.status(400).json({ message: 'brandName, phone, and email are required' });
    }
    dbData = loadDB();
    dbData.siteSettings = {
      brandName,
      tagline: tagline !== undefined ? tagline : dbData.siteSettings.tagline,
      phone,
      whatsAppNumber: whatsAppNumber !== undefined ? whatsAppNumber : dbData.siteSettings.whatsAppNumber,
      email,
      facebookUrl: facebookUrl !== undefined ? facebookUrl : dbData.siteSettings.facebookUrl,
      instagramUrl: instagramUrl !== undefined ? instagramUrl : dbData.siteSettings.instagramUrl,
      youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : dbData.siteSettings.youtubeUrl,
      footerText: footerText !== undefined ? footerText : dbData.siteSettings.footerText,
      deliveryEstimateMins: Number(deliveryEstimateMins || 25),
      contactAddress: contactAddress || '',
      logoUrl: logoUrl !== undefined ? logoUrl : dbData.siteSettings.logoUrl,
      footerLogoUrl: footerLogoUrl !== undefined ? footerLogoUrl : dbData.siteSettings.footerLogoUrl,
      faviconUrl: faviconUrl !== undefined ? faviconUrl : dbData.siteSettings.faviconUrl,
      mobileAppIconUrl: mobileAppIconUrl !== undefined ? mobileAppIconUrl : dbData.siteSettings.mobileAppIconUrl,
      logoWidth: logoWidth !== undefined ? logoWidth : dbData.siteSettings.logoWidth,
      logoHeight: logoHeight !== undefined ? logoHeight : dbData.siteSettings.logoHeight,
      logoPosition: logoPosition !== undefined ? logoPosition : dbData.siteSettings.logoPosition,
      primaryColor: primaryColor !== undefined ? primaryColor : dbData.siteSettings.primaryColor,
      secondaryColor: secondaryColor !== undefined ? secondaryColor : dbData.siteSettings.secondaryColor,
      buttonColor: buttonColor !== undefined ? buttonColor : dbData.siteSettings.buttonColor,
      headerBgColor: headerBgColor !== undefined ? headerBgColor : dbData.siteSettings.headerBgColor,
      footerBgColor: footerBgColor !== undefined ? footerBgColor : dbData.siteSettings.footerBgColor,
      enableHeroBanner: enableHeroBanner !== undefined ? Boolean(enableHeroBanner) : dbData.siteSettings.enableHeroBanner,
      enableCategories: enableCategories !== undefined ? Boolean(enableCategories) : dbData.siteSettings.enableCategories,
      enableFeaturedProducts: enableFeaturedProducts !== undefined ? Boolean(enableFeaturedProducts) : dbData.siteSettings.enableFeaturedProducts,
      enablePromotionalSections: enablePromotionalSections !== undefined ? Boolean(enablePromotionalSections) : dbData.siteSettings.enablePromotionalSections,
      homepageSectionsOrder: homepageSectionsOrder !== undefined ? homepageSectionsOrder : dbData.siteSettings.homepageSectionsOrder
    };
    saveDB(dbData);
    res.status(200).json(dbData.siteSettings);
  });

  // Public order tracking (un-authenticated guest tracking)
  app.get('/api/tracking/:orderId', (req, res) => {
    dbData = loadDB();
    const order = dbData.orders.find(o => o.id === req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order tracking ID not found' });

    let liveRiderLocation = null;
    if (order.riderId) {
      const riderLive = dbData.riders.find(r => r.id === order.riderId);
      if (riderLive) {
        liveRiderLocation = {
          lat: riderLive.currentLat,
          lng: riderLive.currentLng,
          status: riderLive.status
        };
      }
    }

    res.status(200).json({
      order,
      liveRiderLocation
    });
  });

  // Initialize WebSockets Server attached on the same HTTP Node process!
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientSocket = { ws };
    activeClients.add(client);

    ws.on('message', (messageRaw: string) => {
      try {
        const msg = JSON.parse(messageRaw);
        if (msg.type === 'register') {
          // Token auth for websockets safely
          if (msg.token) {
            jwt.verify(msg.token, JWT_SECRET, (err: any, decoded: any) => {
              if (!err && decoded) {
                client.userId = decoded.id;
                client.role = decoded.role;
              }
            });
          } else {
            client.role = msg.role;
          }
          if (msg.orderId) {
            client.orderId = msg.orderId;
          }
        } else if (msg.type === 'watch_order') {
          client.orderId = msg.orderId;
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    });

    ws.on('close', () => {
      activeClients.delete(client);
    });

    ws.on('error', () => {
      activeClients.delete(client);
    });
  });

  // --- INTEGRATION FOR FRONTEND SPA (VITE / REACT) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // production static file serves
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server boot failure', err);
});
