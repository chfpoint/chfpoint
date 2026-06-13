import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Bike, CheckCircle, Navigation, MapPin, ToggleLeft, ToggleRight, 
  Map, Phone, ShoppingCart, User, LogIn, ChevronRight, X, Compass, HelpCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import FoodMap from '../components/FoodMap';

interface RiderPanelProps {
  user: any;
  token: string | null;
  onLoginSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  onSwitchPanel: (panel: string) => void;
}

export default function RiderPanel({
  user,
  token,
  onLoginSuccess,
  onLogout,
  onSwitchPanel
}: RiderPanelProps) {
  // --- STATE SYSTEM ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [isRiderActive, setIsRiderActive] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual movement controls for iframe testing
  const [simLat, setSimLat] = useState(23.7561);
  const [simLng, setSimLng] = useState(90.3758);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeoTracking, setIsGeoTracking] = useState(false);

  // Store Geolocation watch ID ref
  const geoWatchIdRef = useRef<number | null>(null);

  // Fetch assigned orders on mount/token change
  const fetchRiderOrders = () => {
    if (!token) return;
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Riders only get their assigned orders
          setAssignedOrders(data);
          // Auto select first delivery if pending
          const active = data.find(o => ['accepted', 'picked_up'].includes(o.status));
          if (active) {
            setSelectedOrder(active);
            const hist = active.locationHistory;
            if (hist && hist.length > 0) {
              setSimLat(hist[hist.length - 1].lat);
              setSimLng(hist[hist.length - 1].lng);
            }
          }
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    if (token) {
      fetchRiderOrders();
    }
  }, [token]);

  // Auth Handler
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingAuth(true);

    try {
      // Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Verify with backend
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'rider' })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || 'Access denied');
      } else {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setLoginError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setLoginError('User not found');
      } else {
        setLoginError('Login failed. Try again');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleShortcutLogin = (riderEmail: string) => {
    setEmail(riderEmail);
    setPassword('rider123');
  };

  // Availability status toggler
  const toggleRiderAvailability = async () => {
    const nextState = !isRiderActive;
    try {
      const res = await fetch('/api/riders/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextState ? 'active' : 'inactive' })
      });
      if (res.ok) {
        setIsRiderActive(nextState);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Transition delivery order status
  const updateDeliveryStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        fetchRiderOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upload specific coordinates to API
  const pushRiderCoordinates = async (orderId: string, lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        // dynamic slight fetch
        fetchRiderOrders();
      }
    } catch (e) {
      console.error('Failed uploading live coordinate packet', e);
    }
  };

  // Standard HTML5 geolocation watch
  const startGeolocationSharing = (orderId: string) => {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation metrics.');
      return;
    }
    if (geoWatchIdRef.current) return;

    setIsGeoTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, latitude: lat, longitude: lng } = pos.coords;
        setSimLat(latitude);
        setSimLng(pos.coords.longitude);
        pushRiderCoordinates(orderId, latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation error codes:', err);
        setIsGeoTracking(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    geoWatchIdRef.current = watchId;
  };

  const stopGeolocationSharing = () => {
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    setIsGeoTracking(false);
  };

  // Simulating motion updates dynamically via coordinate adjustments
  const triggerManualLocStep = (latDelta: number, lngDelta: number) => {
    if (!selectedOrder) return;
    const nextLat = simLat + latDelta;
    const nextLng = simLng + lngDelta;
    setSimLat(nextLat);
    setSimLng(nextLng);
    pushRiderCoordinates(selectedOrder.id, nextLat, nextLng);
  };

  useEffect(() => {
    return () => {
      stopGeolocationSharing();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-slate-950 border-b border-slate-800 py-4.5 px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="bg-brand-primary text-white px-2.5 py-1 rounded-lg text-lg">🚴</span>
          <span className="font-extrabold text-lg text-white">panda<span className="text-brand-primary font-normal">Courier</span></span>
        </div>
        <div className="flex items-center gap-2.5">
          {token && (
            <button 
              onClick={onLogout}
              className="text-xs bg-red-950 border border-red-900 hover:bg-red-900 text-red-200 py-1.5 px-3.5 rounded-lg font-bold cursor-pointer"
            >
              Sign Out
            </button>
          )}
          <button 
            onClick={() => onSwitchPanel('customer')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3.5 rounded-lg border border-slate-700 transition"
          >
            Customer Desk
          </button>
        </div>
      </nav>

      {/* RIDER AUTH BOARD OR DISPATCH CONTROLS */}
      {!token ? (
        /* --- RIDER LOGIN ENTRY VIEW --- */
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="text-center">
              <span className="text-4xl">🔑</span>
              <h3 className="font-extrabold text-2xl text-white mt-3">Courier login portal</h3>
              <p className="text-xs text-slate-400 mt-1">Unlock assigned orders list, coordinates synchronizers and transit buttons</p>
            </div>

            <form onSubmit={handleRiderLogin} className="flex flex-col gap-4 text-xs font-bold leading-none">
              <div>
                <label className="text-slate-400 block mb-1">Rider Registered Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shakil@foodpanda.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Pass Coordinates</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              {loginError && (
                <p className="p-3 bg-red-950 border border-red-900 text-red-200 rounded-xl text-center leading-normal text-[11px]">{loginError}</p>
              )}

              <button 
                type="submit"
                disabled={isLoadingAuth}
                className="bg-brand-primary text-white py-3.5 rounded-xl text-xs font-extrabold uppercase hover:bg-brand-secondary transition tracking-wider shadow"
              >
                {isLoadingAuth ? 'Authorizing Shift...' : 'Start Shift Duty'}
              </button>
            </form>

            <div className="border-t border-slate-800 pt-5 mt-2 flex flex-col gap-3">
              <span className="text-[10px] text-brand-primary uppercase tracking-wider block text-center font-extrabold">Instant pre-seeded rider files</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => handleShortcutLogin('shakil@foodpanda.com')}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-slate-300 font-bold"
                >
                  Shakil Ahmed
                </button>
                <button 
                  onClick={() => handleShortcutLogin('korim@foodpanda.com')}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-slate-300 font-bold"
                >
                  Korim Ullah
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* --- RIDER ASSIGNED PANEL HUB --- */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ASSIGNED JOBS LIST COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User className="text-brand-primary" size={20} />
                <div>
                  <h4 className="font-bold text-gray-100 text-sm">{user?.name}</h4>
                  <span className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 block">Courier Duty status</span>
                </div>
              </div>

              {/* Status Toggler active/inactive */}
              <button 
                onClick={toggleRiderAvailability}
                className="hover:scale-105 transition cursor-pointer"
              >
                {isRiderActive ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-950/40 border border-green-900 py-1.5 px-3 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span>ONLINE Shift</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-full">
                    <span>OFFLINE Shift</span>
                  </div>
                )}
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <h3 className="font-bold text-gray-100 pb-2 border-b border-slate-800">Your Dispatched Deliveries</h3>
              
              <div className="flex flex-col gap-3 min-h-[150px] max-h-[50vh] overflow-y-auto">
                {assignedOrders.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-8">No assigned runs found currently. Go online and wait for admin assignments.</p>
                ) : (
                  assignedOrders.map((o) => (
                    <div 
                      key={o.id}
                      onClick={() => { setSelectedOrder(o); if(o.locationHistory.length>0) { const l = o.locationHistory[o.locationHistory.length-1]; setSimLat(l.lat); setSimLng(l.lng); } }}
                      className={`p-4 bg-slate-900 border rounded-xl cursor-pointer transition hover:border-brand-primary flex flex-col gap-2 ${selectedOrder?.id === o.id ? 'border-brand-primary bg-pink-950/5' : 'border-slate-800'}`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase font-bold">
                        <span className="text-gray-400">{o.id}</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          o.status === 'delivered' ? 'bg-green-950 text-green-400 border border-green-900' :
                          'bg-yellow-950 text-yellow-400 border border-yellow-900'
                        }`}>{o.status}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-200 block truncate">{o.customerName}</span>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">Dest: {o.customerAddress}</p>
                      </div>
                      <div className="border-t border-slate-850 pt-2 mt-1 flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">{o.items.reduce((ac, it) => ac + it.quantity, 0)} Items</span>
                        <span className="text-brand-primary">৳{o.total}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE ASSIGNED DETAILS WORKSPACE */}
          <div className="lg:col-span-8">
            {selectedOrder ? (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col gap-5 h-full">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">{selectedOrder.id}</span>
                    <h3 className="font-extrabold text-xl text-white mt-1">Delivery details sheet</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 text-xs font-bold font-mono">
                    <span className="text-brand-primary font-bold">Bill total: ৳{selectedOrder.total}</span>
                    <span className="text-slate-400">Placed: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Transition state buttons */}
                {selectedOrder.status === 'accepted' && (
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex flex-col items-center gap-3">
                    <Bike className="text-brand-primary animate-bounce" size={32} />
                    <p className="text-xs text-slate-300 font-medium text-center">Are you currently at the Kitchen/Vendor? Pick up order items and start delivery.</p>
                    <button 
                      onClick={() => updateDeliveryStatus(selectedOrder.id, 'picked_up')}
                      className="bg-brand-primary text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-brand-secondary cursor-pointer"
                    >
                      Confirm Items Picked Up ➔
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'picked_up' && (
                  <div className="bg-emerald-950/20 border border-emerald-900/60 p-4.5 rounded-2xl flex flex-col items-center gap-3">
                    <CheckCircle className="text-green-400" size={32} />
                    <p className="text-xs text-green-300 font-medium text-center">You are currently delivers keys to destination! Click button when customer receives package.</p>
                    <button 
                      onClick={() => updateDeliveryStatus(selectedOrder.id, 'delivered')}
                      className="bg-green-500 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-green-400 cursor-pointer"
                    >
                      Confirm Order Delivered! ✓
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'delivered' && (
                  <div className="bg-green-950/40 border border-green-900 p-4.5 rounded-2xl text-center text-xs text-green-400 font-bold flex flex-col items-center gap-1.5">
                    <CheckCircle size={32} />
                    <span>This package was delivered and closed. Ready for next order assigned!</span>
                  </div>
                )}

                {/* COORDINATE EMITTER BOX */}
                {['accepted', 'picked_up'].includes(selectedOrder.status) && (
                  <div className="border border-slate-850 p-4 rounded-2xl bg-slate-900 flex flex-col gap-4 text-xs font-semibold select-none">
                    <div className="flex justify-between items-center">
                      <span className="font-bold flex items-center gap-1.5 text-slate-300">
                        <Compass className="text-brand-primary" size={16} />
                        <span>Real-Time Tracker Sharing coordinates</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isGeoTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
                        <span className="text-[10px] text-gray-500">Coordinate Sync</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Standard Geolocation API triggers */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2 justify-between">
                        <span className="font-bold text-slate-200">Browser GPS coordinate tracker:</span>
                        <p className="text-[10px] text-slate-500 leading-normal">Requires HTTPS or standard local workspace permissions. Grabs browser location periodically.</p>
                        {isGeoTracking ? (
                          <button 
                            onClick={stopGeolocationSharing}
                            className="bg-red-950 text-red-200 text-xs font-bold py-2 rounded-lg border border-red-900"
                          >
                            Disable Geolocation GPS
                          </button>
                        ) : (
                          <button 
                            onClick={() => startGeolocationSharing(selectedOrder.id)}
                            className="bg-brand-primary text-white text-xs font-bold py-2 rounded-lg"
                          >
                            Connect Geolocation GPS
                          </button>
                        )}
                      </div>

                      {/* Manual mock simulator in standard iframe blocks */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-250">Interactive Simulation Steps:</span>
                          <span className="text-[10px] uppercase font-bold text-gray-500">Iframe Safe</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal mb-1.5">No location permission needed. Tap directional keys below to move motorcycle marker in real-time:</p>
                        
                        <div className="grid grid-cols-3 gap-1 px-4 text-center">
                          <div></div>
                          <button onClick={() => triggerManualLocStep(0.003, 0)} className="bg-slate-900 hover:bg-slate-805 p-1.5 rounded text-white font-bold cursor-pointer">▲ North</button>
                          <div></div>
                          <button onClick={() => triggerManualLocStep(0, -0.003)} className="bg-slate-900 hover:bg-slate-805 p-1.5 rounded text-white font-bold cursor-pointer">◀ West</button>
                          <div className="flex items-center justify-center p-1.5 text-scale-400 text-[10px] font-mono leading-none">BD</div>
                          <button onClick={() => triggerManualLocStep(0, 0.003)} className="bg-slate-900 hover:bg-slate-805 p-1.5 rounded text-white font-bold cursor-pointer">▶ East</button>
                          <div></div>
                          <button onClick={() => triggerManualLocStep(-0.003, 0)} className="bg-slate-900 hover:bg-slate-805 p-1.5 rounded text-white font-bold cursor-pointer">▼ South</button>
                          <div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Map monitor */}
                <div className="flex-1 h-[280px] rounded-2xl overflow-hidden relative">
                  <FoodMap 
                    riderLocation={{ lat: simLat, lng: simLng }}
                  />
                </div>

                {/* Checklist product info values */}
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-xs flex flex-col gap-1.5 font-medium text-slate-300">
                  <span className="font-bold text-white mb-1">Customer Delivery target specifications</span>
                  <div>👤 Name: {selectedOrder.customerName}</div>
                  <div>📞 Phone: {selectedOrder.customerPhone}</div>
                  <div>🏠 Address: {selectedOrder.customerAddress}</div>
                  <div className="text-gray-400 mt-1 italic">❝ {selectedOrder.notes || 'Deliver normally'} ❞</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-12 rounded-3xl border border-slate-800 text-center text-slate-500 italic flex flex-col items-center justify-center gap-4 h-full">
                <Bike className="text-slate-800 animate-pulse" size={48} />
                <p>Select any assigned and dispatched order task from the left sheet list to begin courier runs.</p>
              </div>
            )}
          </div>

        </main>
      )}

    </div>
  );
}