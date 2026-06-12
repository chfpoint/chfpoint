import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingCart, MapPin, Bike, Check, Grid, 
  Trash2, X, Plus, Minus, ArrowRight, Star, Clock, Info, User
} from 'lucide-react';
import { Category, Product, Order, OrderItem } from '../types';
import FoodMap from '../components/FoodMap';

interface CustomerPanelProps {
  user: any;
  token: string | null;
  onLoginSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  onSwitchPanel: (panel: string) => void;
}

export default function CustomerPanel({
  user,
  token,
  onLoginSuccess,
  onLogout,
  onSwitchPanel
}: CustomerPanelProps) {
  // --- STATE LISTS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'food' | 'grocery'>('food');

  // Login form status
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Cart Status
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Selected Detail Product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  // Orders and Tracking State
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // --- SITE CONFIGURATIONS & DYNAMIC MARKETING STATES ---
  const [banners, setBanners] = useState<any[]>([]);
  const [deliveryBase, setDeliveryBase] = useState(29);
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState(500);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  
  // Site Metadata
  const [brandName, setBrandName] = useState('pandaExpress');
  const [logoUrl, setLogoUrl] = useState('🐼');
  const [siteTagline, setSiteTagline] = useState('Fastest Food and Grocery Delivery in Debpur & Chandpur District');
  const [sitePhone, setSitePhone] = useState('01711122333');
  const [siteEmail, setSiteEmail] = useState('support@pandaexpress.com.bd');
  const [siteFacebook, setSiteFacebook] = useState('https://facebook.com/pandaexpress.bd');
  const [siteInstagram, setSiteInstagram] = useState('https://instagram.com/pandaexpress.bd');
  const [siteEstimate, setSiteEstimate] = useState(25);
  const [siteAddress, setSiteAddress] = useState('Dhaka, Bangladesh');

  // Load Categories & Products on startup
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(e => console.error(e));

    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(data))
      .catch(e => console.error(e));

    fetch('/api/banners')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data.filter((b: any) => b.isActive));
        }
      })
      .catch(e => console.error(e));

    fetch('/api/settings/delivery-charges')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setDeliveryBase(Number(data.baseCharge) || 29);
          setDeliveryFreeThreshold(Number(data.freeDeliveryThreshold) || 500);
        }
      })
      .catch(e => console.error(e));

    fetch('/api/delivery-areas')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeOnly = data.filter((a: any) => a.isActive);
          setAreas(activeOnly);
          if (activeOnly.length > 0) {
            setSelectedArea(activeOnly[0].name);
          }
        }
      })
      .catch(e => console.error(e));

    fetch('/api/settings/site')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setBrandName(data.brandName || 'pandaExpress');
          setLogoUrl(data.logoUrl || '🐼');
          setSiteTagline(data.tagline || 'Fastest Food and Grocery Delivery in Debpur & Chandpur District');
          setSitePhone(data.phone || '01711122333');
          setSiteEmail(data.email || 'support@pandaexpress.com.bd');
          setSiteFacebook(data.facebookUrl || '');
          setSiteInstagram(data.instagramUrl || '');
          setSiteEstimate(Number(data.deliveryEstimateMins) || 25);
          setSiteAddress(data.contactAddress || 'Dhaka, Bangladesh');

          // Apply dynamic brand themes
          if (data.primaryColor) {
            document.documentElement.style.setProperty('--color-brand-primary', data.primaryColor);
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty('--color-brand-secondary', data.secondaryColor);
          }
        }
      })
      .catch(e => console.error(e));
  }, []);

  // Fetch orders if logged in
  useEffect(() => {
    if (token) {
      fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrderList(data);
            // Auto track first pending/active order if found
            const active = data.find(o => ['pending', 'accepted', 'picked_up'].includes(o.status));
            if (active) {
              setActiveOrder(active);
            }
          }
        })
        .catch(e => console.error(e));
    }
  }, [token, activeOrder?.status]);

  // Set default values when user loads
  useEffect(() => {
    if (user) {
      setDeliveryAddress(user.address || '');
      setDeliveryPhone(user.phone || '');
    }
  }, [user]);

  // Socket.IO live synchronization for active order tracking
  useEffect(() => {
    if (!activeOrder?.id) return;

    const { io } = require('socket.io-client');
    const socket = io(window.location.origin);

    socket.on('connect', () => {
      socket.emit('register', { token, orderId: activeOrder.id });
    });

    socket.on('message', (msg: any) => {
      if (msg.type === 'order_update' && msg.orderId === activeOrder.id) {
        setActiveOrder(prev => prev ? { ...prev, status: msg.status, riderId: msg.riderId || prev.riderId, riderName: msg.riderName || prev.riderName, riderPhone: msg.riderPhone || prev.riderPhone } : null);
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => Array.isArray(d) && setOrderList(d))
          .catch(err => console.error(err));
      } else if (msg.type === 'location_update' && msg.orderId === activeOrder.id) {
        setActiveOrder(prev => prev ? { 
          ...prev, 
          locationHistory: msg.locationHistory || [...(prev.locationHistory || []), { lat: msg.lat, lng: msg.lng, timestamp: msg.timestamp }]
        } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeOrder?.id, token]);

  // --- ACTIONS ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);

    const url = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode 
      ? { email, password, name, phone, address, role: 'customer' }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || 'Authentication failed');
      } else {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setAuthError('Server is not responding. Please retry.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleShortcutLogin = (role: 'customer' | 'admin' | 'rider') => {
    const defaultEmails = {
      customer: 'customer@foodpanda.com',
      admin: 'admin@foodpanda.com',
      rider: 'shakil@foodpanda.com'
    };
    const defaultPasswords = {
      customer: 'customer123',
      admin: 'admin123',
      rider: 'rider123'
    };

    setEmail(defaultEmails[role]);
    setPassword(defaultPasswords[role]);
    setIsRegisterMode(false);
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const activeAreaObj = areas.find(a => a.name === selectedArea);
  const areaDeliveryCharge = activeAreaObj ? Number(activeAreaObj.deliveryCharge) : deliveryBase;
  const deliveryFee = cartSubtotal === 0 
    ? 0 
    : (cartSubtotal >= deliveryFreeThreshold ? 0 : areaDeliveryCharge);
  const cartTotal = cartSubtotal + deliveryFee;

  const isMinOrderMet = activeAreaObj 
    ? cartSubtotal >= Number(activeAreaObj.minOrderAmount) 
    : true;

  // Checkout process
  const handleCheckout = async () => {
    if (!token) {
      alert('Please log in or register to complete your order!');
      return;
    }
    if (activeAreaObj && !isMinOrderMet) {
      alert(`The minimum order amount for ${activeAreaObj.name} is ৳${activeAreaObj.minOrderAmount}. Currently your subtotal is only ৳${cartSubtotal}. Please add more delicious items to check out!`);
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    if (cart.length === 0) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          customerAddress: deliveryAddress,
          phone: deliveryPhone,
          deliveryNotes,
          subtotal: cartSubtotal,
          deliveryFee,
          total: cartTotal
        })
      });
      
      const order = await res.json();
      if (res.ok) {
        setActiveOrder(order);
        setCart([]); // Clear cart
        setIsCartOpen(false);
        setDeliveryNotes('');
      } else {
        alert(order.message || 'Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error during checkout');
    }
  };

  // Filters logic
  const filteredProducts = products.filter(p => {
    const isOfTab = p.type === tab;
    const matchesCategory = activeCategory ? p.categoryId === activeCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isOfTab && matchesCategory && matchesSearch;
  });

  // Rider latest coordinates
  const latestRiderLoc = activeOrder?.locationHistory && activeOrder.locationHistory.length > 0
    ? activeOrder.locationHistory[activeOrder.locationHistory.length - 1]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* LOCAL NOTIFICATION FOR ACTIVE TRACKING */}
      {token && activeOrder && (
        <div className="bg-brand-primary text-white text-sm py-2 px-4 shadow flex justify-between items-center z-40 sticky top-0 md:relative">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-100 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-200"></span>
            </span>
            <span className="font-medium">Active Order status: {activeOrder.status.toUpperCase()}</span>
          </div>
          <button 
            onClick={() => { setShowOrderHistory(false); }} 
            className="underline hover:text-pink-100 text-xs font-semibold cursor-pointer"
          >
            Track on Map
          </button>
        </div>
      )}

      {/* --- UPPER NAVIGATION --- */}
      <nav id="customer_nav" className="sticky top-0 bg-white shadow-sm border-b border-pink-100 z-30 py-4 px-4 md:px-8 flex justify-between items-center transition-all text-slate-800">
        <div className="flex items-center gap-6">
          <button onClick={() => { setActiveCategory(null); setSearchQuery(''); setShowOrderHistory(false); }} className="flex items-center gap-2 text-brand-primary font-bold text-2xl tracking-tight cursor-pointer">
            <span className="bg-brand-primary text-white py-1 px-3 rounded-full flex items-center justify-center">{logoUrl}</span>
            <span>{brandName}</span>
          </button>
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-gray-200">
            <MapPin size={14} className="text-brand-primary" />
            <span>Delivering in Dhaka, BD</span>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="hidden md:flex max-w-[400px] w-full relative">
          <input 
            type="text" 
            placeholder={`Search for products, biryani or groceries...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm bg-slate-50"
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowOrderHistory(!showOrderHistory)}
            className={`text-sm font-semibold px-4 py-2 rounded-full cursor-pointer hover:bg-pink-50 transition ${showOrderHistory ? 'bg-brand-primary text-white hover:bg-brand-primary' : 'text-gray-700 bg-white border border-gray-200'}`}
          >
            My Orders
          </button>

          {/* Cart Icon trigger */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center p-2.5 rounded-full bg-brand-primary text-white hover:bg-brand-secondary transition shadow-sm cursor-pointer"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-950 text-white text-[10px] font-bold rounded-full w-5.5 h-5.5 flex items-center justify-center border-2 border-white">
                {cart.reduce((ac, item) => ac + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* --- MAIN PAGE CONTENT CANVAS --- */}
      {showOrderHistory ? (
        /* --- ORDER HISTORY & DETAILED LIVE MAP SCREEN --- */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Your Deliveries</h2>
              <button onClick={() => setShowOrderHistory(false)} className="text-brand-primary hover:underline text-sm font-medium">Back to Shop</button>
            </div>

            {/* PUBLIC ORDER ID SEARCH TOOL (NO LOGIN REQUIRED) */}
            <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col gap-2.5 shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider leading-none">Track any Order Publicly</span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Paste Order ID here..."
                  id="public_track_id"
                  className="flex-1 bg-slate-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-semibold"
                />
                <button 
                  onClick={() => {
                    const ordId = (document.getElementById('public_track_id') as HTMLInputElement)?.value?.trim();
                    if (!ordId) {
                      alert('Please input a valid Order ID.');
                      return;
                    }
                    fetch(`/api/tracking/${ordId}`)
                      .then(r => {
                        if (!r.ok) throw new Error('Order not found');
                        return r.json();
                      })
                      .then(data => {
                        if (data && data.order) {
                          setActiveOrder(data.order);
                          setOrderList(prev => {
                            if (prev.some(o => o.id === data.order.id)) return prev;
                            return [data.order, ...prev];
                          });
                        } else {
                          throw new Error('Invalid tracking payload');
                        }
                      })
                      .catch(() => alert('Order ID is invalid or not registered in any of our hubs.'));
                  }}
                  className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shrink-0 text-center"
                >
                  Track Route
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
              {orderList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
                  <p>You have not placed any orders yet.</p>
                </div>
              ) : (
                orderList.map((ord) => (
                  <div 
                    key={ord.id} 
                    onClick={() => setActiveOrder(ord)}
                    className={`bg-white p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${activeOrder?.id === ord.id ? 'border-brand-primary bg-pink-50/20 ring-1 ring-brand-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-semibold text-gray-500">{ord.id.toUpperCase()}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ord.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        ord.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        ord.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">Placed: {new Date(ord.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-600 line-clamp-1">
                      {ord.items.map(it => `${it.quantity}x ${it.product.name}`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs font-semibold">
                      <span className="text-gray-500">Total Charged:</span>
                      <span className="text-brand-primary">৳{ord.total}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            {activeOrder ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4 h-full min-h-[500px]">
                {/* Active Tracking Details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <span>Order # {activeOrder.id.toUpperCase()}</span>
                      <span className="text-xs font-normal text-gray-400 bg-gray-100 py-1 px-3 rounded-full">{new Date(activeOrder.createdAt).toLocaleTimeString()}</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Delivery address: {activeOrder.customerAddress}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-pink-50 p-3 rounded-xl border border-pink-100">
                    <Bike className="text-brand-primary" size={24} />
                    <div className="text-xs">
                      {activeOrder.riderId ? (
                        <>
                          <div className="font-bold text-gray-900">{activeOrder.riderName} (Rider)</div>
                          <div className="text-gray-500 mt-0.5">Contact: {activeOrder.riderPhone}</div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">Waiting for rider assignment...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Tracker Status Bar */}
                <div className="grid grid-cols-4 gap-2 text-center my-2 text-xs">
                  <div className={`p-2 rounded-lg font-semibold ${['pending', 'accepted', 'picked_up', 'delivered'].includes(activeOrder.status) ? 'bg-pink-100 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                    1. Received
                  </div>
                  <div className={`p-2 rounded-lg font-semibold ${['accepted', 'picked_up', 'delivered'].includes(activeOrder.status) ? 'bg-pink-100 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                    2. Kitchen Ready
                  </div>
                  <div className={`p-2 rounded-lg font-semibold ${['picked_up', 'delivered'].includes(activeOrder.status) ? 'bg-pink-100 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                    3. On the Way
                  </div>
                  <div className={`p-2 rounded-lg font-semibold ${activeOrder.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    4. Delivered
                  </div>
                </div>

                {/* Live Tracking map */}
                <div className="flex-1 h-[340px] rounded-xl overflow-hidden relative">
                  <FoodMap 
                    riderLocation={latestRiderLoc ? { lat: latestRiderLoc.lat, lng: latestRiderLoc.lng } : null}
                    pathHistory={activeOrder.locationHistory}
                  />
                </div>

                {/* Order Summary details in map layout */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs">
                  <span className="font-semibold text-gray-700">Order Summary:</span>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {activeOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{it.quantity}x {it.product.name}</span>
                        <span className="font-medium text-gray-900">৳{it.product.price * it.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <span className="text-brand-primary">৳{activeOrder.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center h-full flex flex-col items-center justify-center gap-4">
                <Bike size={48} className="text-gray-300 animate-bounce" />
                <p className="text-gray-500">Pick an order from the list to view its active live tracking map.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- MAIN FRONTEND SHOPPING VIEW --- */
        <>
          {/* BANNER WITH SEARCH & CATEGORIES */}
          <header className="bg-brand-primary text-white relative overflow-hidden py-12 md:py-16 px-4 md:px-8">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-20 -translate-y-10 scale-125">
              <span className="text-[250px]">{logoUrl}</span>
            </div>
            
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase bg-white/25 backdrop-blur-sm self-start px-3 py-1 rounded-full border border-white/20 capitalize">
                {brandName} Bangladesh
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {siteTagline}
              </h1>
              <p className="text-pink-100 text-base md:text-lg max-w-2xl font-light">
                Express distribution within {siteEstimate} minutes straight to your doorstep in {siteAddress}! Browse local delicacies and standard {brandName} groceries.
              </p>

              {/* Toggle switch Food VS Grocery */}
              <div className="flex gap-3 bg-white/10 backdrop-blur-sm self-start p-1.5 rounded-full border border-white/10 mt-2">
                <button 
                  onClick={() => { setTab('food'); setActiveCategory(null); }}
                  className={`px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition ${tab === 'food' ? 'bg-white text-brand-primary shadow-sm' : 'text-white hover:bg-white/5'}`}
                >
                  🥞 Food Delivery
                </button>
                <button 
                  onClick={() => { setTab('grocery'); setActiveCategory(null); }}
                  className={`px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition ${tab === 'grocery' ? 'bg-white text-brand-primary shadow-sm' : 'text-white hover:bg-white/5'}`}
                >
                  🍎 Pandamart Groceries
                </button>
              </div>
            </div>
          </header>

          {/* DYNAMIC CAMPAIGN BANNER SLIDER */}
          {banners.length > 0 && (
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6">
              <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10" />
                <img src={banners[0].image} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-12 z-20 max-w-lg text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-primary text-white px-2.5 py-1 rounded-full w-fit mb-3">
                    Exclusive Campaign
                  </span>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                    {banners[0].title}
                  </h2>
                  <p className="text-xs md:text-sm text-pink-100 font-medium mt-1 truncate">
                    {banners[0].subtitle}
                  </p>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('customer_nav');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-4 bg-white text-brand-primary text-xs font-bold px-4 py-2 rounded-xl w-fit hover:bg-slate-50 transition cursor-pointer"
                  >
                    Claim Promotion Now
                  </button>
                </div>

                {banners.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex gap-1 bg-black/40 px-2 py-1.5 rounded-full backdrop-blur-xs">
                    {banners.slice(0, 4).map((_, idx) => (
                      <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- CATEGORIES LIST --- */}
          <section className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
              <span>Explore Categories</span>
              {activeCategory && (
                <button 
                  onClick={() => setActiveCategory(null)} 
                  className="text-brand-primary hover:underline text-xs"
                >
                  Clear filter
                </button>
              )}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.filter(c => c.type === tab).map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                  className={`group bg-white p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-3 ${activeCategory === cat.id ? 'border-brand-primary ring-1 ring-brand-primary/20 bg-pink-50/20' : 'border-gray-200 hover:border-brand-primary/40 hover:shadow-md'}`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img referrerPolicy="no-referrer" src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-brand-primary transition">{cat.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* --- PRODUCT GRID LIST --- */}
          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeCategory ? categories.find(c => c.id === activeCategory)?.name : `${tab} Items`}</h2>
                  <p className="text-xs text-gray-500 mt-1">Showing {filteredProducts.length} delicious options</p>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white p-16 rounded-2xl border border-gray-200 text-center flex flex-col items-center justify-center max-w-md mx-auto gap-4">
                  <span className="text-4xl">🍙</span>
                  <div className="font-bold text-gray-800">No products found</div>
                  <p className="text-xs text-gray-500">We couldn't match any items with your current selection. Clear filters or adjust your search.</p>
                  <button onClick={() => { setActiveCategory(null); setSearchQuery(''); }} className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg">Reset Shop filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {filteredProducts.map((prod) => (
                    <div 
                      key={prod.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col"
                    >
                      {/* Product Image */}
                      <div 
                        onClick={() => { setSelectedProduct(prod); setDetailQty(1); }}
                        className="h-44 bg-slate-100 overflow-hidden relative cursor-pointer group"
                      >
                        <img referrerPolicy="no-referrer" src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <span className="absolute top-2.5 right-2.5 bg-white/95 text-[10px] font-bold text-gray-700 py-1 px-2.5 rounded-full shadow-sm">
                          ৳{prod.price}
                        </span>
                      </div>

                      {/* Info & Add */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div onClick={() => { setSelectedProduct(prod); setDetailQty(1); }} className="cursor-pointer">
                          <h4 className="font-bold text-gray-900 text-sm hover:text-brand-primary transition line-clamp-1">{prod.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">{prod.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                          <span className="font-extrabold text-brand-primary text-base">৳{prod.price}</span>
                          <button 
                            onClick={() => addToCart(prod, 1)}
                            className="bg-pink-100 text-brand-primary hover:bg-brand-primary hover:text-white transition px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* --- CART DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-brand-primary text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  <span className="font-bold">Your Order Cart</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Items Panel */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <ShoppingCart size={40} className="stroke-1" />
                    <p className="text-sm">Your cart is currently empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 border-b border-gray-100 pb-3 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                        <img referrerPolicy="no-referrer" src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{item.product.name}</h5>
                        <div className="text-xs text-brand-primary font-extrabold mt-1">৳{item.product.price}</div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 border border-gray-200 rounded-md hover:bg-slate-100">
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1 border border-gray-200 rounded-md hover:bg-slate-100">
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 p-2 text-xs cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}

                {/* Checkout Credentials Form inside drawer */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-800">Delivery Information</span>
                    
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500">Contact Phone</span>
                      <input 
                        type="text" 
                        required
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="01712XXXXXX"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    {areas.length > 0 && (
                      <div className="flex flex-col gap-1.5 animate-fade-in">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500">Select delivery zone</span>
                        <select 
                          value={selectedArea}
                          onChange={(e) => {
                            setSelectedArea(e.target.value);
                            if (!deliveryAddress.includes(e.target.value)) {
                              setDeliveryAddress(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-bold text-gray-700"
                        >
                          {areas.map((z) => (
                            <option key={z.id} value={z.name}>
                              📍 {z.name} (Service focus)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500">Delivery Street Coordinates</span>
                      <input 
                        type="text" 
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House Number, Road, Area, Dhaka"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500">Kitchen / Runner Notes</span>
                      <textarea 
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="E.g. Make it spicy, call when arrived at gate"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Subtotal & Action */}
              {cart.length > 0 && (
                <div className="bg-slate-50 p-4 border-t border-gray-200 flex flex-col gap-3">
                  {activeAreaObj && !isMinOrderMet && (
                    <div className="bg-red-50 text-red-700 border border-red-100 p-2.5 rounded-xl text-[11px] leading-tight font-bold flex flex-col gap-0.5">
                      <span>⚠️ Minimum Order amount for {activeAreaObj.name} is ৳{activeAreaObj.minOrderAmount}</span>
                      <span className="font-medium text-red-500">Please add ৳{Number(activeAreaObj.minOrderAmount) - cartSubtotal} more of food or groceries to check out!</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Items Subtotal</span>
                    <span>৳{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Panda Delivery Service</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t border-gray-200 pt-2 text-gray-900">
                    <span>Total Bill (Incl. VAT)</span>
                    <span className="text-brand-primary text-base">৳{cartTotal}</span>
                  </div>

                  {token ? (
                    <button 
                      onClick={handleCheckout}
                      disabled={activeAreaObj && !isMinOrderMet}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md ${
                        activeAreaObj && !isMinOrderMet 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                          : 'bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer'
                      }`}
                    >
                      <span>Pay & Place Order</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-center flex flex-col gap-2">
                      <p className="text-[11px] text-yellow-800 font-medium">Authentication required to finalize the order payment.</p>
                      <button 
                        onClick={() => {
                          setIsCartOpen(false);
                          setTimeout(() => {
                            document.getElementById('customer_login_box')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="text-xs bg-brand-primary text-white py-1.5 rounded-lg font-bold"
                      >
                        Authenticate Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SINGLE PRODUCT DETAILED MODAL --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm shadow hover:bg-slate-100 p-1.5 rounded-full text-gray-800 z-10 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="h-56 bg-slate-100 overflow-hidden relative">
                <img referrerPolicy="no-referrer" src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary bg-pink-50 py-1 px-3 rounded-full border border-pink-100">
                    {selectedProduct.type}
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900 mt-2.5">{selectedProduct.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedProduct.description}</p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">Unit Price</span>
                  <span className="font-extrabold text-brand-primary text-base">৳{selectedProduct.price}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setDetailQty(prev => prev > 1 ? prev - 1 : 1)}
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-slate-50 text-gray-600 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm text-gray-800 w-6 text-center">{detailQty}</span>
                    <button 
                      onClick={() => setDetailQty(prev => prev + 1)}
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-slate-50 text-gray-600 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      addToCart(selectedProduct, detailQty);
                      setSelectedProduct(null);
                    }}
                    className="bg-brand-primary text-white py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow hover:bg-brand-secondary transition"
                  >
                    <span>Add to basket • ৳{selectedProduct.price * detailQty}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FOOTER SECTIONS --- */}
      <footer className="bg-gray-900 text-gray-400 text-xs py-10 px-4 md:px-8 mt-auto border-t border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-brand-primary font-extrabold text-xl flex items-center gap-1.5">
            <span>{logoUrl}</span>
            <span className="capitalize">{brandName}</span>
          </span>
          <p className="mt-1">© 2026 {brandName} Ltd. Fully integrated in Dhaka, Bangladesh.</p>
          <p className="text-[11px] text-gray-500 font-medium">HQ: {siteAddress} | Support Email: {siteEmail}</p>
          <p className="text-[11px] text-gray-500 font-medium">Hotline Contact Desk: {sitePhone}</p>
        </div>
        <div className="flex flex-col md:items-end gap-3.5">
          {siteFacebook || siteInstagram ? (
            <div className="flex gap-3 text-[11px] font-bold">
              {siteFacebook && <a href={siteFacebook} target="_blank" rel="noopener noreferrer" className="text-pink-100 hover:underline">Facebook</a>}
              {siteInstagram && <a href={siteInstagram} target="_blank" rel="noopener noreferrer" className="text-pink-100 hover:underline">Instagram</a>}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4 font-bold">
            <button onClick={() => onSwitchPanel('customer')} className="text-white hover:text-brand-primary transition cursor-pointer">Customer Desk</button>
            <button onClick={() => onSwitchPanel('admin')} className="text-white hover:text-brand-primary transition cursor-pointer">Admin Workspace</button>
            <button onClick={() => onSwitchPanel('rider')} className="text-white hover:text-brand-primary transition cursor-pointer">Courier Hub</button>
          </div>
        </div>
      </footer>
    </div>
  );
}