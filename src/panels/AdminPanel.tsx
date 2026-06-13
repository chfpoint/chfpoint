import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShoppingBag, DollarSign, Bike, Plus, Trash2, 
  Settings, Key, MapPin, Eye, Edit3, CheckCircle, RefreshCcw, X, Layers,
  Image, Coins, Globe, Compass
} from 'lucide-react';
import { Category, Product, Order, User, OrderItem } from '../types';
import FoodMap from '../components/FoodMap';

interface AdminPanelProps {
  user: any;
  token: string | null;
  onLoginSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  onSwitchPanel: (panel: string) => void;
}

export default function AdminPanel({
  user,
  token,
  onLoginSuccess,
  onLogout,
  onSwitchPanel
}: AdminPanelProps) {
  // --- STATE SYSTEM ---
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isLoadingAdminAuth, setIsLoadingAdminAuth] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'products' | 'categories' | 'riders' | 'banners' | 'delivery' | 'areas' | 'settings'
  >('dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [riders, setRiders] = useState<any[]>([]);

  // Detailed Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Product Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pNameBn, setPNameBn] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pDescBn, setPDescBn] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('50');
  const [pCategory, setPCategory] = useState('');
  const [pType, setPType] = useState<'food' | 'grocery'>('food');
  const [pImage, setPImage] = useState('');
  const [pAvailable, setPAvailable] = useState(true);

  // Category Form states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [cName, setCName] = useState('');
  const [cNameBn, setCNameBn] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cType, setCType] = useState<'food' | 'grocery'>('food');
  const [cImage, setCImage] = useState('');

  // Rider Form states
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [rEmail, setREmail] = useState('');
  const [rPassword, setRPassword] = useState('');
  const [rName, setRName] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rAddress, setRAddress] = useState('');
  const [riderRegError, setRiderRegError] = useState('');

  // --- CONFIGURATION MANAGEMENT STATES ---
  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bTitle, setBTitle] = useState('');
  const [bTitleBn, setBTitleBn] = useState('');
  const [bSubtitle, setBSubtitle] = useState('');
  const [bSubtitleBn, setBSubtitleBn] = useState('');
  const [bImage, setBImage] = useState('');
  const [bActive, setBActive] = useState(true);

  // Delivery Charges State
  const [deliveryBase, setDeliveryBase] = useState('29');
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState('500');
  const [isUpdatingDeliverySettings, setIsUpdatingDeliverySettings] = useState(false);
  const [deliverySettingsSuccess, setDeliverySettingsSuccess] = useState('');

  // Delivery Areas State
  const [areas, setAreas] = useState<any[]>([]);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [aName, setAName] = useState('');
  const [aRadius, setARadius] = useState('5');
  const [aActive, setAActive] = useState(true);

  // Site Settings States with full CMS controls
  const [brandName, setBrandName] = useState('pandamart Chandpur');
  const [tagline, setTagline] = useState('Fastest Food and Grocery Delivery in Debpur & Chandpur District');
  const [sitePhone, setSitePhone] = useState('+8801711122333');
  const [whatsAppNumber, setWhatsAppNumber] = useState('+8801711122333');
  const [siteEmail, setSiteEmail] = useState('support@pandachandpur.com.bd');
  const [siteFacebook, setSiteFacebook] = useState('https://facebook.com/pandachandpur');
  const [siteInstagram, setSiteInstagram] = useState('https://instagram.com/pandachandpur');
  const [siteYoutube, setSiteYoutube] = useState('https://youtube.com/pandachandpur');
  const [footerText, setFooterText] = useState('© 2026 pandamart Chandpur Ltd. Fastest digital food distribution in Debpur, Chandpur, Bangladesh.');
  const [siteEstimate, setSiteEstimate] = useState('20');
  const [siteAddress, setSiteAddress] = useState('Debpur Bazar, Chandpur Sadar, Bangladesh');

  // Branding Image assets
  const [logoUrl, setLogoUrl] = useState('🐼');
  const [footerLogoUrl, setFooterLogoUrl] = useState('🐼');
  const [faviconUrl, setFaviconUrl] = useState('🐼');
  const [mobileAppIconUrl, setMobileAppIconUrl] = useState('🐼');
  const [logoWidth, setLogoWidth] = useState('160');
  const [logoHeight, setLogoHeight] = useState('45');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left');

  // Styling theme states
  const [primaryColor, setPrimaryColor] = useState('#e11d48');
  const [secondaryColor, setSecondaryColor] = useState('#be123c');
  const [buttonColor, setButtonColor] = useState('#e11d48');
  const [headerBgColor, setHeaderBgColor] = useState('#ffffff');
  const [footerBgColor, setFooterBgColor] = useState('#0f172a');

  // Homepage Builder Sections Config
  const [enableHeroBanner, setEnableHeroBanner] = useState(true);
  const [enableCategories, setEnableCategories] = useState(true);
  const [enableFeaturedProducts, setEnableFeaturedProducts] = useState(true);
  const [enablePromotionalSections, setEnablePromotionalSections] = useState(true);
  const [homepageSectionsOrder, setHomepageSectionsOrder] = useState<string[]>(['hero', 'categories', 'promotions', 'featured']);

  const [isUpdatingSiteSettings, setIsUpdatingSiteSettings] = useState(false);
  const [siteSettingsSuccess, setSiteSettingsSuccess] = useState('');

  // Socket.IO Live Sync
  useEffect(() => {
    const { io } = require('socket.io-client');
    const socket = io(window.location.origin);

    socket.on('connect', () => {
      socket.emit('register', { token, role: 'admin' });
    });

    socket.on('message', (msg: any) => {
      if (msg.type === 'new_order') {
        setOrders(prev => [msg.order, ...prev]);
      } else if (msg.type === 'order_update') {
        setOrders(prev => prev.map(o => o.id === msg.orderId ? { ...o, status: msg.status, riderId: msg.riderId || o.riderId, riderName: msg.riderName || o.riderName, riderPhone: msg.riderPhone || o.riderPhone } : o));
        if (selectedOrder?.id === msg.orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: msg.status, riderId: msg.riderId || prev.riderId, riderName: msg.riderName || prev.riderName, riderPhone: msg.riderPhone || prev.riderPhone } : null);
        }
      } else if (msg.type === 'location_update') {
        setOrders(prev => prev.map(o => o.id === msg.orderId ? { ...o, locationHistory: msg.locationHistory } : o));
        if (selectedOrder?.id === msg.orderId) {
          setSelectedOrder(prev => prev ? { ...prev, locationHistory: msg.locationHistory } : null);
        }
        setRiders(prev => prev.map(r => r.id === msg.riderId ? { ...r, currentLat: msg.lat, currentLng: msg.lng } : r));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedOrder?.id]);

  // --- REFETCH UTILITIES ---
  const refetchData = () => {
    fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setOrders(d))
      .catch(e => console.error(e));

    fetch('/api/products')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setProducts(d))
      .catch(e => console.error(e));

    fetch('/api/categories')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setCategories(d))
      .catch(e => console.error(e));

    fetch('/api/riders', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setRiders(d))
      .catch(e => console.error(e));

    fetch('/api/banners')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setBanners(d))
      .catch(e => console.error(e));

    fetch('/api/settings/delivery-charges')
      .then(r => r.json())
      .then(d => {
        if (d) {
          setDeliveryBase(String(d.baseCharge));
          setDeliveryFreeThreshold(String(d.freeDeliveryThreshold));
        }
      })
      .catch(e => console.error(e));

    fetch('/api/delivery-areas')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setAreas(d))
      .catch(e => console.error(e));

    fetch('/api/settings/site')
      .then(r => r.json())
      .then(d => {
        if (d) {
          setBrandName(d.brandName || 'pandamart Chandpur');
          setTagline(d.tagline || '');
          setLogoUrl(d.logoUrl || '🐼');
          setSitePhone(d.phone || '');
          setWhatsAppNumber(d.whatsAppNumber || '');
          setSiteEmail(d.email || '');
          setSiteFacebook(d.facebookUrl || '');
          setSiteInstagram(d.instagramUrl || '');
          setSiteYoutube(d.youtubeUrl || '');
          setSiteEstimate(String(d.deliveryEstimateMins || 20));
          setSiteAddress(d.contactAddress || '');
          setFooterText(d.footerText || '');
          setFooterLogoUrl(d.footerLogoUrl || '🐼');
          setFaviconUrl(d.faviconUrl || '🐼');
          setMobileAppIconUrl(d.mobileAppIconUrl || '🐼');
          setLogoWidth(d.logoWidth || '160');
          setLogoHeight(d.logoHeight || '45');
          setLogoPosition(d.logoPosition || 'left');
          setPrimaryColor(d.primaryColor || '#e11d48');
          setSecondaryColor(d.secondaryColor || '#be123c');
          setButtonColor(d.buttonColor || '#e11d48');
          setHeaderBgColor(d.headerBgColor || '#ffffff');
          setFooterBgColor(d.footerBgColor || '#0f172a');
          setEnableHeroBanner(d.enableHeroBanner !== undefined ? d.enableHeroBanner : true);
          setEnableCategories(d.enableCategories !== undefined ? d.enableCategories : true);
          setEnableFeaturedProducts(d.enableFeaturedProducts !== undefined ? d.enableFeaturedProducts : true);
          setEnablePromotionalSections(d.enablePromotionalSections !== undefined ? d.enablePromotionalSections : true);
          setHomepageSectionsOrder(d.homepageSectionsOrder || ['hero', 'categories', 'promotions', 'featured']);

          // Apply dynamic brand themes
          if (d.primaryColor) {
            document.documentElement.style.setProperty('--color-brand-primary', d.primaryColor);
          }
          if (d.secondaryColor) {
            document.documentElement.style.setProperty('--color-brand-secondary', d.secondaryColor);
          }
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    if (token) {
      refetchData();
    }
  }, [token]);

  // Handle Base64 Image transformations
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setField: (b64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setField(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- FORM ACTIONS ---

  // Product mutations
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice || !pCategory) {
      alert('Required product parameters missing!');
      return;
    }

    const payload = {
      name: pName,
      nameBn: pNameBn || pName,
      description: pDesc,
      descriptionBn: pDescBn || pDesc,
      price: Number(pPrice),
      stock: Number(pStock),
      categoryId: pCategory,
      type: pType,
      image: pImage,
      isAvailable: pAvailable
    };

    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        // reset form
        setPName(''); setPNameBn(''); setPDesc(''); setPDescBn(''); setPPrice(''); setPStock('50'); setPCategory(''); setPImage(''); setPAvailable(true);
        refetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPNameBn(prod.nameBn || '');
    setPDesc(prod.description);
    setPDescBn(prod.descriptionBn || '');
    setPPrice(String(prod.price));
    setPStock(String(prod.stock));
    setPCategory(prod.categoryId);
    setPType(prod.type);
    setPImage(prod.image);
    setPAvailable(prod.isAvailable);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Category mutations
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cSlug) return;

    const payload = {
      name: cName,
      nameBn: cNameBn || cName,
      slug: cSlug,
      type: cType,
      image: cImage
    };

    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setCName(''); setCNameBn(''); setCSlug(''); setCImage('');
        refetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategoryClick = (cat: Category) => {
    setEditingCategory(cat);
    setCName(cat.name);
    setCNameBn(cat.nameBn || '');
    setCSlug(cat.slug);
    setCType(cat.type);
    setCImage(cat.image);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products mapped to this ID might lose reference.')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Rider registration (Creating users with rider role)
  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRiderRegError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: rEmail,
          password: rPassword,
          name: rName,
          phone: rPhone,
          address: rAddress,
          role: 'rider'
        })
      });
      const d = await res.json();
      if (res.ok) {
        setIsRiderModalOpen(false);
        setREmail(''); setRPassword(''); setRName(''); setRPhone(''); setRAddress('');
        refetchData();
      } else {
        setRiderRegError(d.message || 'Failed to add rider profile');
      }
    } catch (err) {
      setRiderRegError('Server error while adding rider');
    }
  };

  // Assign Rider to order action
  const handleAssignRiderToOrder = async (orderId: string, riderId: string) => {
    if (!riderId) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riderId })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        refetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to assign rider');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Promotional Banners Administration Handlers
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bImage) return;

    const payload = {
      title: bTitle,
      titleBn: bTitleBn || bTitle,
      subtitle: bSubtitle,
      subtitleBn: bSubtitleBn || bSubtitle,
      image: bImage,
      isActive: bActive
    };

    const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
    const method = editingBanner ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsBannerModalOpen(false);
        setEditingBanner(null);
        setBTitle(''); setBTitleBn(''); setBSubtitle(''); setBSubtitleBn(''); setBImage(''); setBActive(true);
        refetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditBannerClick = (banner: any) => {
    setEditingBanner(banner);
    setBTitle(banner.title);
    setBTitleBn(banner.titleBn || '');
    setBSubtitle(banner.subtitle || '');
    setBSubtitleBn(banner.subtitleBn || '');
    setBImage(banner.image);
    setBActive(banner.isActive);
    setIsBannerModalOpen(true);
  };

  const handleToggleBannerActive = async (bannerId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Permanently delete this promotional banner? This change will reflect on the guest homepage immediately.')) return;
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delivery Charges Administration Handlers
  const handleDeliveryChargesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDeliverySettings(true);
    setDeliverySettingsSuccess('');

    try {
      const res = await fetch('/api/admin/settings/delivery-charges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          baseCharge: Number(deliveryBase),
          freeDeliveryThreshold: Number(deliveryFreeThreshold)
        })
      });
      if (res.ok) {
        setDeliverySettingsSuccess('Delivery charge configurations updated successfully.');
        setTimeout(() => setDeliverySettingsSuccess(''), 4000);
        refetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingDeliverySettings(false);
    }
  };

  // Delivery Areas Administration Handlers
  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName) return;

    try {
      const res = await fetch('/api/admin/delivery-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: aName,
          radiusKm: Number(aRadius),
          isActive: aActive
        })
      });
      if (res.ok) {
        setIsAreaModalOpen(false);
        setAName(''); setARadius('5'); setAActive(true);
        refetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAreaActive = async (areaId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/delivery-areas/${areaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Delete this delivery area from system records?')) return;
    try {
      const res = await fetch(`/api/admin/delivery-areas/${areaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Site Settings Administration Handlers
  const handleSiteSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSiteSettings(true);
    setSiteSettingsSuccess('');

    try {
      const res = await fetch('/api/admin/settings/site', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brandName,
          tagline,
          phone: sitePhone,
          whatsAppNumber,
          email: siteEmail,
          facebookUrl: siteFacebook,
          instagramUrl: siteInstagram,
          youtubeUrl: siteYoutube,
          footerText,
          deliveryEstimateMins: Number(siteEstimate),
          contactAddress: siteAddress,
          logoUrl,
          footerLogoUrl,
          faviconUrl,
          mobileAppIconUrl,
          logoWidth,
          logoHeight,
          logoPosition,
          primaryColor,
          secondaryColor,
          buttonColor,
          headerBgColor,
          footerBgColor,
          enableHeroBanner,
          enableCategories,
          enableFeaturedProducts,
          enablePromotionalSections,
          homepageSectionsOrder
        })
      });
      if (res.ok) {
        setSiteSettingsSuccess('Dynamic site settings and operational parameters persisted.');
        setTimeout(() => setSiteSettingsSuccess(''), 4000);

        // Apply updated color variables in real-time
        if (primaryColor) {
          document.documentElement.style.setProperty('--color-brand-primary', primaryColor);
        }
        if (secondaryColor) {
          document.documentElement.style.setProperty('--color-brand-secondary', secondaryColor);
        }

        refetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingSiteSettings(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsLoadingAdminAuth(true);

    try {
      // Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Verify with backend and get user data
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'admin' })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminLoginError(data.message || 'Access denied');
      } else {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setAdminLoginError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setAdminLoginError('User not found');
      } else if (err.code === 'auth/too-many-requests') {
        setAdminLoginError('Too many attempts. Try again later');
      } else {
        setAdminLoginError('Login failed. Try again');
      }
    } finally {
      setIsLoadingAdminAuth(false);
    }
  };

  if (!token || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* NAVBAR */}
        <nav className="bg-slate-950 border-b border-slate-800 py-4.5 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-brand-primary text-white p-1 rounded-lg text-lg">🐼</span>
            <span className="font-extrabold text-lg text-white">panda<span className="text-brand-primary font-normal">Backstage</span></span>
          </div>
          <button 
            onClick={() => onSwitchPanel('customer')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3.5 rounded-lg border border-slate-700 transition"
          >
            Customer Desk
          </button>
        </nav>

        {/* ADMIN LOGIN DIALOG */}
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-900">
          <div className="max-w-md w-full bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="text-center">
              <span className="text-4xl">🔐</span>
              <h3 className="font-extrabold text-2xl text-white mt-3">Admin Backstage Portal</h3>
              <p className="text-xs text-slate-400 mt-1">Unlock products, active orders, category desks and realtime courier coordinates monitors</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4 text-xs font-bold leading-none">
              <div>
                <label className="text-slate-400 block mb-1">Admin Email Address</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@foodpanda.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Access Coordinates</label>
                <input 
                  type="password" 
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              {adminLoginError && (
                <p className="p-3 bg-red-950 border border-red-900 text-red-200 rounded-xl text-center leading-normal text-[11px]">{adminLoginError}</p>
              )}

              <button 
                type="submit"
                disabled={isLoadingAdminAuth}
                className="bg-brand-primary text-white py-3.5 rounded-xl text-xs font-extrabold uppercase hover:bg-brand-secondary transition tracking-wider shadow"
              >
                {isLoadingAdminAuth ? 'Authorizing Desk...' : 'Acquire Backstage Access'}
              </button>
            </form>

            <div className="border-t border-slate-800 pt-5 mt-2 flex flex-col gap-3">
              <span className="text-[10px] text-brand-primary uppercase tracking-wider block text-center font-extrabold">Instant pre-seeded admin credentials</span>
              <button 
                onClick={() => {
                  setAdminEmail('admin@foodpanda.com');
                  setAdminPassword('admin123');
                }}
                className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-850 py-2.5 px-3 rounded-lg font-bold text-center text-slate-300"
              >
                Auto-fill Admin Account (admin@foodpanda.com)
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- STATS DERIVATIVES ---
  const grossRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const activeDeliveriesCount = orders.filter(o => ['accepted', 'picked_up'].includes(o.status)).length;
  const activeRidersCount = riders.filter(r => r.status !== 'inactive').length;

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      
      {/* LEFT STATIC SIDE NAVIGATION FOR ADMINS */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-850 shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-850">
          <div className="flex items-center gap-2.5 text-white">
            <span className="bg-brand-primary text-white p-1 rounded-lg text-lg">🐼</span>
            <span className="font-extrabold text-lg tracking-tight">panda<span className="text-brand-primary font-normal">Backstage</span></span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">Main Operations Desk</span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 font-semibold text-sm">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='dashboard' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Layers size={18} />
            <span>Dashboard Hub</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition cursor-pointer ${activeTab==='orders' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} />
              <span>Real-Time Orders</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="bg-yellow-500 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-full animate-pulse">{pendingOrdersCount}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='products' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Settings size={18} />
            <span>Products Catalog</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='categories' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Layers size={18} />
            <span>Categories Desk</span>
          </button>
          <button 
            onClick={() => setActiveTab('riders')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='riders' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Bike size={18} />
            <span>Riders Tracker</span>
          </button>
          <button 
            onClick={() => setActiveTab('banners')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='banners' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Image size={18} />
            <span>Promotional Banners</span>
          </button>
          <button 
            onClick={() => setActiveTab('delivery')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='delivery' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Coins size={18} />
            <span>Delivery Fees Config</span>
          </button>
          <button 
            onClick={() => setActiveTab('areas')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='areas' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Globe size={18} />
            <span>Delivery Zones</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${activeTab==='settings' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-900 hover:text-white'}`}
          >
            <Settings size={18} />
            <span>Branding & Info</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-850 flex flex-col gap-3">
          <div className="text-xs">
            <div className="text-slate-400 font-bold">{user?.name}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">Admin Workspace</div>
          </div>
          <button 
            onClick={() => onSwitchPanel('customer')}
            className="w-full bg-slate-900 hover:bg-slate-850 text-white text-xs py-2 rounded-lg font-bold border border-slate-800 transition"
          >
            Back to Customer View
          </button>
          <button 
            onClick={onLogout}
            className="w-full bg-red-950/40 hover:bg-red-950 border border-red-900 text-red-100 text-xs py-2 rounded-lg font-medium transition"
          >
            Disconnect Account
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        
        {/* UPPER BAR FOR MOBILE CHANNELS */}
        <header className="bg-slate-950 text-slate-300 md:bg-white md:text-slate-900 shadow-sm border-b border-slate-200/50 py-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="md:hidden text-lg">🐼</span>
            <h1 className="font-extrabold text-lg text-white md:text-gray-900 capitalize flex items-center gap-2">
              <span>Backstage Hub:</span>
              <span className="text-brand-primary font-normal">{activeTab}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refetchData} className="p-2 border border-slate-800 md:border-gray-200 text-slate-300 md:text-gray-600 rounded-lg hover:bg-slate-900 hover:text-white md:hover:bg-slate-50 transition cursor-pointer" title="Refresh Live Data">
              <RefreshCcw size={16} />
            </button>
            <button onClick={() => onSwitchPanel('customer')} className="md:hidden text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-800">Shop Drawer</button>
          </div>
        </header>

        {/* MOBILE NAVIGATION TABS (visible only on phones) */}
        <div className="md:hidden bg-slate-950 border-b border-slate-850 p-2 flex gap-1.5 overflow-x-auto text-xs shrink-0 select-none">
          {['dashboard', 'orders', 'products', 'categories', 'riders', 'banners', 'delivery', 'areas', 'settings'].map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold uppercase text-[10px] ${activeTab === t ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* WORKSPACE CONTENT BODY */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* --- MODULE 1: DASHBOARD HUB --- */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8">
              {/* Gross Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-green-50 text-green-600 p-4 rounded-full">
                    <DollarSign size={26} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold block">Gross Revenue Delivered</span>
                    <span className="text-2xl font-extrabold text-slate-900">৳{grossRevenue}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-full">
                    <ShoppingBag size={26} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold block">Total Received Orders</span>
                    <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-yellow-50 text-yellow-600 p-4 rounded-full">
                    <RefreshCcw size={26} className="animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold block">Active Courier Runs</span>
                    <span className="text-2xl font-extrabold text-slate-900">{activeDeliveriesCount}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="bg-brand-primary/5 text-brand-primary p-4 rounded-full">
                    <Bike size={26} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold block">Riders Dispatch Active</span>
                    <span className="text-2xl font-extrabold text-slate-900">{activeRidersCount}</span>
                  </div>
                </div>
              </div>

              {/* Live Riders list & Map combined tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900">Courier Location Register</h3>
                    <span className="text-xs bg-slate-100 py-1 px-2.5 rounded-full font-bold">{riders.length} Dispatched</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px]">
                    {riders.map(r => (
                      <div key={r.id} className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900">{r.name}</div>
                          <div className="text-gray-500 mt-0.5">Phone: {r.phone}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[9px] ${
                          r.status === 'delivering' ? 'bg-yellow-100 text-yellow-700' :
                          r.status === 'active' ? 'bg-green-100 text-green-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-12">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">Dhaka Live Delivery Dispatch Map</h3>
                      <p className="text-xs text-gray-500 mt-1">Real-time coordinates monitor. Custom Leaflet tiles initialized beautifully near Dhaka city center.</p>
                    </div>
                    <div className="h-[400px] rounded-2xl overflow-hidden relative border border-gray-200">
                      <FoodMap 
                        interactive={false}
                        pathHistory={orders.find(o => ['accepted', 'picked_up'].includes(o.status))?.locationHistory || []}
                        riderLocation={orders.find(o => ['accepted', 'picked_up'].includes(o.status))?.locationHistory.slice(-1)[0] || null}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- MODULE 2: WORKSPACE ORDERS --- */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Orders Checklist list */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 flex flex-col gap-4">
                <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3 flex justify-between items-center">
                  <span>Current Incoming Orders</span>
                  <span className="text-xs bg-brand-primary text-white py-1 px-3 rounded-full">{orders.length} TOTAL</span>
                </h3>

                <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">Waiting for checkout submissions...</p>
                  ) : (
                    orders.map(o => (
                      <div 
                        key={o.id} 
                        onClick={() => setSelectedOrder(o)}
                        className={`p-4 bg-slate-50 border rounded-xl hover:shadow-sm cursor-pointer transition flex flex-col gap-2 ${selectedOrder?.id === o.id ? 'border-brand-primary bg-pink-50/10' : 'border-gray-250'}`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-gray-500">{o.id.toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full uppercase font-bold text-[9px] ${
                            o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-gray-800">{o.customerName}</div>
                          <p className="text-gray-500 truncate mt-0.5">{o.customerAddress}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100 text-[11px] font-bold">
                          <span className="text-gray-500">{o.items.reduce((ac, i) => ac + i.quantity, 0)} Items</span>
                          <span className="text-brand-primary">৳{o.total}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Detailed workspace details & assignment control */}
              <div className="lg:col-span-7">
                {selectedOrder ? (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                      <div>
                        <span className="text-xs font-mono font-extrabold text-gray-500 uppercase">{selectedOrder.id.toUpperCase()}</span>
                        <h3 className="font-extrabold text-xl text-gray-900 mt-1">Pending Delivery details</h3>
                      </div>
                      <span className="bg-pink-100 text-brand-primary text-xs font-bold py-1 px-3.5 rounded-full uppercase">
                        Current: {selectedOrder.status}
                      </span>
                    </div>

                    {/* Order items checklist */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold text-gray-600 block uppercase">Product checkout items list</span>
                      <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                        {selectedOrder.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-xs font-medium">
                            <span className="text-gray-600">{it.quantity}x {it.product.name}</span>
                            <span className="text-gray-900 font-extrabold">৳{it.product.price * it.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold final pr">
                          <span className="text-gray-900">Total charge amount (Inc. VAT)</span>
                          <span className="text-brand-primary">৳{selectedOrder.total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Customer Profile Contact</span>
                        <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                        <p className="text-gray-600 mt-0.5">{selectedOrder.customerPhone}</p>
                        <p className="text-gray-500 mt-1 italic">{selectedOrder.notes || 'No added delivery notes.'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Assigned Dispatch Courier</span>
                        {selectedOrder.riderId ? (
                          <>
                            <span className="font-bold text-green-700 flex items-center gap-1.5">
                              <CheckCircle size={15} />
                              <span>{selectedOrder.riderName}</span>
                            </span>
                            <p className="text-gray-500 mt-1">Rider Phone: {selectedOrder.riderPhone}</p>
                          </>
                        ) : (
                          <span className="font-bold text-amber-600 italic">No rider assigned yet. Use search and assignment trigger below.</span>
                        )}
                      </div>
                    </div>

                    {/* Assignment Selector panel */}
                    {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                      <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                        <span className="text-xs font-bold text-slate-800">Assign Courier Operations</span>
                        
                        <div className="flex gap-3">
                          <select 
                            onChange={(e) => handleAssignRiderToOrder(selectedOrder.id, e.target.value)}
                            className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 font-medium flex-1 focus:outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>-- Choose trackable Active rider --</option>
                            {riders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.status.toUpperCase()}) - {r.phone}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-400">Selecting will assign rider and transition state to accepted immediately.</p>
                      </div>
                    )}

                    {/* Manual overrule status transitions */}
                    <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-800">Manual Status Overrule</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {['pending', 'accepted', 'picked_up'].includes(selectedOrder.status) && (
                          <button 
                            onClick={async () => {
                              try {
                                const nextStatus = selectedOrder.status === 'pending' ? 'accepted' : selectedOrder.status === 'accepted' ? 'picked_up' : 'delivered';
                                const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
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
                                  refetchData();
                                }
                              } catch(e) { console.error(e); }
                            }}
                            className="bg-brand-primary text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-brand-secondary transition cursor-pointer"
                          >
                            Advance to {selectedOrder.status === 'pending' ? 'Accepted' : selectedOrder.status === 'accepted' ? 'Picked Up' : 'Delivered'}
                          </button>
                        )}
                        {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <button 
                            onClick={async () => {
                              if (!confirm('Are you sure you want to cancel this order? This release will free any assigned courier riders.')) return;
                              try {
                                const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ status: 'cancelled' })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setSelectedOrder(updated);
                                  refetchData();
                                }
                              } catch(e) { console.error(e); }
                            }}
                            className="bg-red-550 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
                          >
                            Cancel / Void Order
                          </button>
                        )}
                        {selectedOrder.status === 'delivered' && (
                          <span className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                            <CheckCircle size={14} /> Completed & Archived
                          </span>
                        )}
                        {selectedOrder.status === 'cancelled' && (
                          <span className="text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                            <X size={14} /> Order Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500 italic">
                    Select any incoming order from the left checklist to view detail records and assign active Dhaka riders.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- MODULE 3: PRODUCTS CATALOG --- */}
          {activeTab === 'products' && (
            <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border border-gray-200">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">Total Products list</h3>
                  <p className="text-xs text-gray-500 mt-1">Monitor products inventory and update details instantly.</p>
                </div>
                <button 
                  onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                  className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-brand-secondary transition shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="overflow-x-auto text-left text-xs font-semibold text-gray-600">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-150 uppercase tracking-wider text-[10px] text-gray-400">
                      <th className="py-3 px-4">Item details</th>
                      <th className="py-3 px-4">Category Slug</th>
                      <th className="py-3 px-4">Catalog Type</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 text-gray-800">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img src={p.image} className="w-10 h-10 object-cover rounded-lg bg-slate-100 border shrink-0" />
                          <div>
                            <span className="font-bold text-gray-900 block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono italic">{p.id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 px-4 capitalize">
                          {categories.find(c => c.id === p.categoryId)?.name || p.categoryId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.type === 'food' ? 'bg-pink-100 text-brand-primary' : 'bg-blue-100 text-blue-800'}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900">৳{p.price}</td>
                        <td className="py-3.5 px-4">{p.stock} units</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleEditProductClick(p)} className="p-1 text-slate-400 hover:text-brand-primary cursor-pointer"><Edit3 size={15} /></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- MODULE 4: CATEGORIES DESK --- */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 h-fit">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <h3 className="font-bold text-gray-900">{editingCategory ? 'Edit Category Form' : 'Create New Category'}</h3>
                  {editingCategory && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCName('');
                        setCNameBn('');
                        setCSlug('');
                        setCImage('');
                      }}
                      className="text-[10px] bg-gray-150 text-gray-600 px-2 py-1 rounded-md font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4 text-xs font-bold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold block mb-1">Category Name (EN)</label>
                      <input 
                        type="text" 
                        required
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        placeholder="E.g. Traditional Biryani"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Category Name (BN)</label>
                      <input 
                        type="text" 
                        required
                        value={cNameBn}
                        onChange={(e) => setCNameBn(e.target.value)}
                        placeholder="উদা: ঐতিহ্যবাহী বিরিয়ানি"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Category Slug</label>
                    <input 
                      type="text" 
                      required
                      value={cSlug}
                      onChange={(e) => setCSlug(e.target.value)}
                      placeholder="E.g. traditional-biryani"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Type channel</label>
                    <select 
                      value={cType}
                      onChange={(e) => setCType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl font-bold"
                    >
                      <option value="food">🥞 Food Outlets</option>
                      <option value="grocery">🍇 Grocery Pandamart</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Banner Image URL or File Upload</label>
                    <input 
                      type="text"
                      value={cImage}
                      onChange={(e) => setCImage(e.target.value)}
                      placeholder="HTTPS URL or Base64 String"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-2 font-medium"
                    />
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setCImage)}
                      className="block text-xs text-gray-500 file:mr-4 file:bg-pink-100 file:text-brand-primary file:border-none file:px-3 file:py-1.5 file:rounded-xl file:font-semibold cursor-pointer"
                    />
                  </div>

                  <button className="bg-brand-primary text-white py-2.5 rounded-xl font-bold uppercase hover:bg-brand-secondary transition shrink-0 cursor-pointer">
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-200">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Current Active Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <div key={c.id} className="p-4 border rounded-2xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <img src={c.image} className="w-12 h-12 object-cover rounded-xl border shrink-0 bg-slate-50" />
                        <div>
                          <span className="font-extrabold text-gray-900 capitalize block">{c.name} / {c.nameBn || c.name}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{c.type} outlet</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleEditCategoryClick(c)}
                          className="p-1 px-2 rounded-lg bg-gray-50 text-gray-500 hover:text-brand-primary font-bold text-[10px] border border-gray-150 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- MODULE 5: RIDERS WORKSPACE --- */}
          {activeTab === 'riders' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">Courier riders profile workspace</h3>
                  <p className="text-xs text-gray-500 mt-1">Register new delivery riders into system databases.</p>
                </div>
                <button 
                  onClick={() => setIsRiderModalOpen(true)}
                  className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-brand-secondary transition shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Register Rider Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {riders.map((r) => (
                  <div key={r.id} className="p-4 border border-gray-200 rounded-3xl flex flex-col gap-3 text-xs shadow-sm bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{r.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">ID: {r.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        r.status === 'delivering' ? 'bg-yellow-100 text-yellow-700' :
                        r.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="border-t border-gray-150 pt-3 mt-1 flex flex-col gap-1.5 text-gray-500 font-medium">
                      <div>📞 Contact: {r.phone || '01XXXXXXXXX'}</div>
                      <div className="truncate">📍 Coordinates: {r.currentLat ? `${r.currentLat.toFixed(4)}, ${r.currentLng.toFixed(4)}` : 'Disconnected'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- MODULE 6: BANNERS PROMOTION DESK --- */}
          {activeTab === 'banners' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">Promotional Banners Workspace</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure sliders and promotional campaign images appearing on guest homepages.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingBanner(null);
                    setBTitle('');
                    setBTitleBn('');
                    setBSubtitle('');
                    setBSubtitleBn('');
                    setBImage('');
                    setBActive(true);
                    setIsBannerModalOpen(true);
                  }}
                  className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-brand-secondary transition shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Banner Campaign</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((b) => (
                  <div key={b.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col bg-slate-50/20 group">
                    <div className="h-44 relative bg-slate-150">
                      <img src={b.image} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button 
                          onClick={() => handleToggleBannerActive(b.id, b.isActive)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer shadow-sm ${b.isActive ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-700'}`}
                        >
                          {b.isActive ? 'Active Campaign' : 'Paused'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1 flex-1">
                      <h4 className="font-extrabold text-sm text-gray-900">{b.title} / {b.titleBn || b.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{b.subtitle} {b.subtitleBn ? `(${b.subtitleBn})` : ''}</p>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                        <span>ID: {b.id}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditBannerClick(b)}
                            className="text-brand-primary hover:text-brand-secondary font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Edit Campaign</span>
                          </button>
                          <span className="text-gray-200">|</span>
                          <button 
                            onClick={() => handleDeleteBanner(b.id)}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- MODULE 7: DELIVERY CHARGES CONFIGURATION --- */}
          {activeTab === 'delivery' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col gap-6">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Delivery Fee Management</h3>
                <p className="text-xs text-gray-500 mt-1">Establish global freight charges and free delivery threshold targets across Dhaka.</p>
              </div>

              <form onSubmit={handleDeliveryChargesSubmit} className="max-w-xl border border-gray-150 rounded-2xl p-6 bg-slate-50/50 flex flex-col gap-4 text-xs font-bold">
                <div>
                  <label className="block text-gray-650 mb-1.5 label-title">Base Shipping Fee (৳)</label>
                  <input 
                    type="number"
                    required
                    value={deliveryBase}
                    onChange={(e) => setDeliveryBase(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm"
                    placeholder="৳29"
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-1">This charge is appended as flat container logistics fee on standard checkout baskets.</p>
                </div>

                <div>
                  <label className="block text-gray-650 mb-1.5 label-title">Free Delivery Minimum Threshold (৳)</label>
                  <input 
                    type="number"
                    required
                    value={deliveryFreeThreshold}
                    onChange={(e) => setDeliveryFreeThreshold(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm"
                    placeholder="৳500"
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Cart checkout totals greater or equal to this limit automatically waive the base delivery charge.</p>
                </div>

                {deliverySettingsSuccess && (
                  <p className="text-green-600 bg-green-50 border border-green-100 p-3 rounded-xl text-center text-[11px]">{deliverySettingsSuccess}</p>
                )}

                <button 
                  type="submit"
                  disabled={isUpdatingDeliverySettings}
                  className="bg-brand-primary text-white py-3 rounded-xl uppercase font-bold tracking-wider hover:bg-brand-secondary transition shrink-0 cursor-pointer text-center mt-2"
                >
                  {isUpdatingDeliverySettings ? 'Saving Settings...' : 'Apply Billing Changes'}
                </button>
              </form>
            </div>
          )}

          {/* --- MODULE 8: DELIVERY AREAS (ZONES) --- */}
          {activeTab === 'areas' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">Supported Delivery Zones</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure active geofenced logistics operations and service radius boundaries.</p>
                </div>
                <button 
                  onClick={() => setIsAreaModalOpen(true)}
                  className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-brand-secondary transition shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Establish New Zone</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-3xl p-5 bg-slate-50/50 flex flex-col gap-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 capitalize">{a.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">ID: {a.id}</span>
                      </div>
                      <button 
                        onClick={() => handleToggleAreaActive(a.id, a.isActive)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase cursor-pointer ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {a.isActive ? 'Operational' : 'Disabled'}
                      </button>
                    </div>

                    <div className="border-t border-gray-150 pt-3 mt-1 flex flex-col gap-1 text-gray-500 text-xs font-medium">
                      <span>📏 Logistics Radius: {a.radiusKm} KM</span>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                      <button 
                        onClick={() => handleDeleteArea(a.id)}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Zone</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- MODULE 9: SITE SETTINGS & BRANDING --- */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col gap-8">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">WordPress-Style Admin CMS</h3>
                <p className="text-xs text-gray-500 mt-1">Configure live branding, identity metadata, theme variables, and visual section hierarchies.</p>
              </div>

              <form onSubmit={handleSiteSettingsSubmit} className="flex flex-col gap-8 max-w-4xl text-xs font-bold">
                
                {/* Section 1: Website Identity */}
                <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-6 flex flex-col gap-4">
                  <h4 className="text-gray-900 font-extrabold text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
                    <span className="text-base">📝</span> Website Identity Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1">Website Name</label>
                      <input 
                        type="text" required value={brandName} onChange={(e) => setBrandName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Tagline / Slogan</label>
                      <input 
                        type="text" required value={tagline} onChange={(e) => setTagline(e.target.value)}
                        placeholder="E.g. Fastest Food Delivery"
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1">Contact Number</label>
                      <input 
                        type="text" required value={sitePhone} onChange={(e) => setSitePhone(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">WhatsApp number</label>
                      <input 
                        type="text" required value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)}
                        placeholder="+8801700000000"
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Inbound Corporate Email</label>
                      <input 
                        type="email" required value={siteEmail} onChange={(e) => setSiteEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1">Facebook Page Link</label>
                      <input 
                        type="text" value={siteFacebook} onChange={(e) => setSiteFacebook(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Instagram Link</label>
                      <input 
                        type="text" value={siteInstagram} onChange={(e) => setSiteInstagram(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">YouTube Channel Link</label>
                      <input 
                        type="text" value={siteYoutube} onChange={(e) => setSiteYoutube(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1">Estimated Delivery Duration (minutes)</label>
                      <input 
                        type="number" required value={siteEstimate} onChange={(e) => setSiteEstimate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Footer Text / Copyright line</label>
                      <input 
                        type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)}
                        placeholder="© 2026 pandaExpress Ltd."
                        className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl font-medium text-xs shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Contact Physical HQ Address</label>
                    <textarea 
                      value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} rows={2}
                      className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-medium leading-normal shadow-2xs"
                      placeholder="E.g. Debpur Bazar, Chandpur, Bangladesh"
                    />
                  </div>
                </div>

                {/* Section 2: Branding Settings & Device Asset Uploads */}
                <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-6 flex flex-col gap-4">
                  <h4 className="text-gray-900 font-extrabold text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
                    <span className="text-base">🎨</span> Device Asset & Layout Config (Upload Storage)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Header Logo Upload */}
                    <div className="border border-gray-200 bg-white rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-gray-700 font-bold block">Website Header Logo</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm p-2 bg-gray-100 rounded-full">{logoUrl === '🐼' ? '🐼' : <img src={logoUrl} width="35" height="35" className="object-contain" />}</span>
                        <div className="flex-1">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoUrl)}
                            className="text-[10px] text-gray-500 w-full"
                          />
                          <input 
                            type="text" placeholder="Or paste logo image link" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                            className="mt-1.5 w-full px-3 py-1 border border-gray-150 rounded-lg text-[10px] font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Logo Upload */}
                    <div className="border border-gray-200 bg-white rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-gray-700 font-bold block">Website Footer Logo</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm p-2 bg-gray-100 rounded-full">{footerLogoUrl === '🐼' ? '🐼' : <img src={footerLogoUrl} width="35" height="35" className="object-contain" />}</span>
                        <div className="flex-1">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setFooterLogoUrl)}
                            className="text-[10px] text-gray-500 w-full"
                          />
                          <input 
                            type="text" placeholder="Or paste footer logo link" value={footerLogoUrl} onChange={(e) => setFooterLogoUrl(e.target.value)}
                            className="mt-1.5 w-full px-3 py-1 border border-gray-150 rounded-lg text-[10px] font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Favicon URL Upload */}
                    <div className="border border-gray-200 bg-white rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-gray-700 font-bold block">Browser Favicon Icon</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm p-2 bg-gray-100 rounded-full">{faviconUrl === '🐼' ? '🐼' : <img src={faviconUrl} width="35" height="35" className="object-contain" />}</span>
                        <div className="flex-1">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setFaviconUrl)}
                            className="text-[10px] text-gray-500 w-full"
                          />
                          <input 
                            type="text" placeholder="Or paste favicon icon link" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)}
                            className="mt-1.5 w-full px-3 py-1 border border-gray-150 rounded-lg text-[10px] font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile App Icon Upload */}
                    <div className="border border-gray-200 bg-white rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-gray-700 font-bold block">Mobile Web App Launcher Icon</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm p-2 bg-gray-100 rounded-full">{mobileAppIconUrl === '🐼' ? '🐼' : <img src={mobileAppIconUrl} width="35" height="35" className="object-contain" />}</span>
                        <div className="flex-1">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setMobileAppIconUrl)}
                            className="text-[10px] text-gray-500 w-full"
                          />
                          <input 
                            type="text" placeholder="Or paste launcher icon link" value={mobileAppIconUrl} onChange={(e) => setMobileAppIconUrl(e.target.value)}
                            className="mt-1.5 w-full px-3 py-1 border border-gray-150 rounded-lg text-[10px] font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Dimension, Dimensions and positions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-gray-600 mb-1">Logo Render Width (px)</label>
                      <input 
                        type="number" value={logoWidth} onChange={(e) => setLogoWidth(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Logo Render Height (px)</label>
                      <input 
                        type="number" value={logoHeight} onChange={(e) => setLogoHeight(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Header Logo Position Placement</label>
                      <select 
                        value={logoPosition} onChange={(e) => setLogoPosition(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl font-bold"
                      >
                        <option value="left">⬅️ Left Float Position</option>
                        <option value="center">📳 Center Stacked Position</option>
                        <option value="right">➡️ Right Float Position</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Visual Theme Customization */}
                <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-6 flex flex-col gap-4">
                  <h4 className="text-gray-900 font-extrabold text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
                    <span className="text-base">🚀</span> Brand Theme Config (No Code styling change)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Primary Color */}
                    <div className="bg-white border border-gray-150 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">Primary Brand Color</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                        <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full px-2 py-1 border border-gray-150 rounded-lg text-[10px] font-mono font-medium uppercase" />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="bg-white border border-gray-150 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">Secondary Accent Color</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                        <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full px-2 py-1 border border-gray-150 rounded-lg text-[10px] font-mono font-medium uppercase" />
                      </div>
                    </div>

                    {/* Button Color */}
                    <div className="bg-white border border-gray-150 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">CTA Buttons fill</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                        <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-full px-2 py-1 border border-gray-150 rounded-lg text-[10px] font-mono font-medium uppercase" />
                      </div>
                    </div>

                    {/* Header Bg Color */}
                    <div className="bg-white border border-gray-150 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">Header Background</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                        <input type="text" value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} className="w-full px-2 py-1 border border-gray-150 rounded-lg text-[10px] font-mono font-medium uppercase" />
                      </div>
                    </div>

                    {/* Footer Bg Color */}
                    <div className="bg-white border border-gray-150 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">Footer Background</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                        <input type="text" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="w-full px-2 py-1 border border-gray-150 rounded-lg text-[10px] font-mono font-medium uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Homepage Section Builder & Re-order */}
                <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-6 flex flex-col gap-4">
                  <h4 className="text-gray-900 font-extrabold text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
                     <span className="text-base">🧱</span> Dynamic Homepage Builder & Re-Ordering
                  </h4>
                  
                  {/* Toggle switches */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 border border-gray-200 rounded-xl flex justify-between items-center h-12 shadow-2xs">
                      <span className="text-gray-700 font-bold">Hero Slide Banner</span>
                      <input 
                        type="checkbox" checked={enableHeroBanner} onChange={(e) => setEnableHeroBanner(e.target.checked)}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded-xl flex justify-between items-center h-12 shadow-2xs">
                      <span className="text-gray-700 font-bold">Catalog Categories</span>
                      <input 
                        type="checkbox" checked={enableCategories} onChange={(e) => setEnableCategories(e.target.checked)}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded-xl flex justify-between items-center h-12 shadow-2xs">
                      <span className="text-gray-700 font-bold">Promotions Banner</span>
                      <input 
                        type="checkbox" checked={enablePromotionalSections} onChange={(e) => setEnablePromotionalSections(e.target.checked)}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded-xl flex justify-between items-center h-12 shadow-2xs">
                      <span className="text-gray-700 font-bold">Featured Products</span>
                      <input 
                        type="checkbox" checked={enableFeaturedProducts} onChange={(e) => setEnableFeaturedProducts(e.target.checked)}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section Rank Re-Ordering */}
                  <div className="mt-2 bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
                    <span className="text-gray-700 font-bold mb-1 block">Live Flow Sections Sequence Order</span>
                    <div className="flex flex-col gap-2 max-w-md">
                      {homepageSectionsOrder.map((section, idx) => {
                        let displayName = "Undefined";
                        if (section === 'hero') displayName = "🎈 Promotional Hero Slider Banner";
                        else if (section === 'categories') displayName = "🍛 Food & Grocery Category Cards";
                        else if (section === 'promotions') displayName = "🏷️ Double Row Promo Code Coupons";
                        else if (section === 'featured') displayName = "🍨 Recommended Featured Products Feed";

                        return (
                          <div key={section} className="flex justify-between items-center p-3.5 bg-slate-55 border border-gray-150 rounded-xl font-bold bg-slate-50/50">
                            <span className="text-gray-600 block">{idx + 1}. {displayName}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const newOrder = [...homepageSectionsOrder];
                                  const temp = newOrder[idx];
                                  newOrder[idx] = newOrder[idx - 1];
                                  newOrder[idx - 1] = temp;
                                  setHomepageSectionsOrder(newOrder);
                                }}
                                className="p-1 border border-gray-200 hover:bg-slate-100 rounded-lg text-gray-500 font-bold text-xs disabled:opacity-40"
                              >
                                🔼
                              </button>
                              <button 
                                type="button"
                                disabled={idx === homepageSectionsOrder.length - 1}
                                onClick={() => {
                                  const newOrder = [...homepageSectionsOrder];
                                  const temp = newOrder[idx];
                                  newOrder[idx] = newOrder[idx + 1];
                                  newOrder[idx + 1] = temp;
                                  setHomepageSectionsOrder(newOrder);
                                }}
                                className="p-1 border border-gray-200 hover:bg-slate-100 rounded-lg text-gray-500 font-bold text-xs disabled:opacity-40"
                              >
                                🔽
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {siteSettingsSuccess && (
                  <p className="text-emerald-700 bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-center font-bold">{siteSettingsSuccess}</p>
                )}

                <button 
                  type="submit"
                  disabled={isUpdatingSiteSettings}
                  className="bg-brand-primary text-white py-3.5 rounded-xl uppercase font-bold tracking-wider hover:brightness-110 active:scale-99 transition cursor-pointer text-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isUpdatingSiteSettings ? 'Syncing Dynamic WordPress CMS Params...' : 'Save Site Settings Configuration'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-200 bg-brand-primary text-white flex justify-between items-center shrink-0">
                <span className="font-extrabold">{editingProduct ? 'Edit Product Form' : 'Register New Product'}</span>
                <button 
                  onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                  className="hover:bg-white/10 p-1 rounded-full cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 text-xs font-bold leading-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 mb-1 leading-none font-bold">Product Title (English)</label>
                    <input 
                      type="text" required value={pName} onChange={(e) => setPName(e.target.value)}
                      placeholder="Classic Mutton Kacchi" className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 leading-none font-bold">Product Title (Bangla)</label>
                    <input 
                      type="text" required value={pNameBn} onChange={(e) => setPNameBn(e.target.value)}
                      placeholder="ক্লাসিক মাটন কাচ্চি" className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Category Mapper</label>
                  <select 
                    required value={pCategory} onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="" disabled>-- Choose category slug --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Price (৳)</label>
                    <input 
                      type="number" required value={pPrice} onChange={(e) => setPPrice(e.target.value)}
                      placeholder="৳349" className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Initial Units Stock</label>
                    <input 
                      type="number" value={pStock} onChange={(e) => setPStock(e.target.value)}
                      placeholder="50" className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Type Scope</label>
                    <select 
                      value={pType} onChange={(e) => setPType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl font-bold"
                    >
                      <option value="food">🥞 Food Product</option>
                      <option value="grocery">🍇 Grocery item</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Product is Available</label>
                    <div className="flex items-center gap-2 mt-2 h-7">
                      <input 
                        type="checkbox" checked={pAvailable} onChange={(e) => setPAvailable(e.target.checked)}
                        className="w-4 h-4 text-brand-primary"
                      />
                      <span className="text-gray-500 font-bold">In-Stock Status</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 leading-none font-bold">Description (English)</label>
                    <textarea 
                      value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3}
                      placeholder="Rich aromatic basmati layers, premium choice mutton parts"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium leading-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 leading-none font-bold">Description (Bangla)</label>
                    <textarea 
                      value={pDescBn} onChange={(e) => setPDescBn(e.target.value)} rows={3}
                      placeholder="সুগন্ধি বাসমতি চাল ও প্রিমিয়াম খাসির মাংসের ঐতিহ্যবাহী কাচ্চি বিরিয়ানি"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl font-medium leading-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 leading-none font-bold">Product Image Reference</label>
                  <input 
                    type="text" value={pImage} onChange={(e) => setPImage(e.target.value)}
                    placeholder="HTTPS image asset url or base64 file"
                    className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl mb-2 font-medium"
                  />
                  <input 
                    type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setPImage)}
                    className="block text-[11px] text-gray-400 file:mr-4 file:bg-pink-100 file:text-brand-primary file:border-none file:px-3 file:py-1.5 file:rounded-xl file:font-semibold cursor-pointer"
                  />
                </div>

                <button className="bg-brand-primary text-white py-3 rounded-xl uppercase font-bold tracking-wider hover:bg-brand-secondary transition shrink-0 cursor-pointer">
                  {editingProduct ? 'Update Product Details' : 'Register Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD RIDER USER MODAL --- */}
      <AnimatePresence>
        {isRiderModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-150 flex flex-col"
            >
              <div className="p-5 border-b border-gray-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <span className="font-extrabold">Register Rider User Account</span>
                <button onClick={() => setIsRiderModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRiderSubmit} className="p-6 flex flex-col gap-4 text-xs font-bold leading-none">
                <div>
                  <label className="text-gray-400 block mb-1">Rider Full Name</label>
                  <input 
                    type="text" required value={rName} onChange={(e) => setRName(e.target.value)}
                    placeholder="E.g. Shakil Ahmed" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Phone Active Number</label>
                  <input 
                    type="text" required value={rPhone} onChange={(e) => setRPhone(e.target.value)}
                    placeholder="E.g. 01822334455" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">Email Coordinates</label>
                    <input 
                      type="email" required value={rEmail} onChange={(e) => setREmail(e.target.value)}
                      placeholder="shakil@foodpanda.com" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Access Password</label>
                    <input 
                      type="password" required value={rPassword} onChange={(e) => setRPassword(e.target.value)}
                      placeholder="rider123" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Street address/Base hub</label>
                  <input 
                    type="text" required value={rAddress} onChange={(e) => setRAddress(e.target.value)}
                    placeholder="E.g. Banani, Dhaka" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                {riderRegError && (
                  <p className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[11px] text-center">{riderRegError}</p>
                )}

                <button className="bg-slate-900 border border-slate-950 text-white py-3 rounded-xl uppercase font-bold tracking-wider hover:bg-black transition">
                  Create Rider User Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD BANNER MODAL --- */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-150 flex flex-col"
            >
              <div className="p-5 border-b border-gray-200 bg-brand-primary text-white flex justify-between items-center shrink-0">
                <span className="font-extrabold flex items-center gap-1.5 animate-pulse">
                  <Image size={18} />
                  <span>{editingBanner ? 'Update Banner Campaign' : 'Establish Banner Campaign'}</span>
                </span>
                <button onClick={() => { setIsBannerModalOpen(false); setEditingBanner(null); }} className="hover:bg-white/10 p-1 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleBannerSubmit} className="p-6 flex flex-col gap-4 text-xs font-bold leading-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 block mb-1">Title (EN)</label>
                    <input 
                      type="text" required value={bTitle} onChange={(e) => setBTitle(e.target.value)}
                      placeholder="E.g. Flat 50% Off" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Title (BN)</label>
                    <input 
                      type="text" required value={bTitleBn} onChange={(e) => setBTitleBn(e.target.value)}
                      placeholder="উদা: ফ্ল্যাট ৫০% ক্যাশব্যাক" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 block mb-1">Sub/Coupon (EN)</label>
                    <input 
                      type="text" value={bSubtitle} onChange={(e) => setBSubtitle(e.target.value)}
                      placeholder="Use: PANDA50" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Sub/Coupon (BN)</label>
                    <input 
                      type="text" value={bSubtitleBn} onChange={(e) => setBSubtitleBn(e.target.value)}
                      placeholder="উদা: কুপন PANDA50 ব্যবহার করুন" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 block mb-1">Promo Image URL (Landscape ratio)</label>
                  <input 
                    type="text" required value={bImage} onChange={(e) => setBImage(e.target.value)}
                    placeholder="E.g. https://images.unsplash.com/..." className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl mb-2 font-medium"
                  />
                  <input 
                    type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBImage)}
                    className="block text-[11px] text-gray-400 file:mr-4 file:bg-pink-100 file:text-brand-primary file:border-none file:px-3 file:py-1.5 file:rounded-xl file:font-semibold cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" checked={bActive} onChange={(e) => setBActive(e.target.checked)}
                    className="w-4 h-4 text-brand-primary cursor-pointer"
                  />
                  <span className="text-gray-650 font-bold">Launch Campaign Immediately (Active)</span>
                </div>

                <button className="bg-brand-primary border border-brand-primary text-white py-3 rounded-xl uppercase font-bold tracking-wider hover:bg-brand-secondary transition shrink-0 cursor-pointer text-center">
                  {editingBanner ? 'Update Promotion Campaign' : 'Establish Promotion Campaign'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD AREA (ZONE) MODAL --- */}
      <AnimatePresence>
        {isAreaModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-slate-800">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-150 flex flex-col"
            >
              <div className="p-5 border-b border-gray-200 bg-brand-primary text-white flex justify-between items-center shrink-0">
                <span className="font-extrabold flex items-center gap-1.5">
                  <Globe size={18} />
                  <span>Establish Operational Zone</span>
                </span>
                <button onClick={() => setIsAreaModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAreaSubmit} className="p-6 flex flex-col gap-4 text-xs font-bold leading-none">
                <div>
                  <label className="text-gray-500 block mb-1">Zone Area Standard Name</label>
                  <input 
                    type="text" required value={aName} onChange={(e) => setAName(e.target.value)}
                    placeholder="E.g. Banani, Dhaka" className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-gray-500 block mb-1">Service Radial Boundary (KM radius)</label>
                  <input 
                    type="number" required value={aRadius} onChange={(e) => setARadius(e.target.value)}
                    placeholder="E.g. 5" className="w-full px-4 py-2 border border-gray-210 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" checked={aActive} onChange={(e) => setAActive(e.target.checked)}
                    className="w-4 h-4 text-brand-primary cursor-pointer"
                  />
                  <span className="text-gray-600 font-bold">Zone is Active immediately</span>
                </div>

                <button className="bg-brand-primary border border-brand-primary text-white py-3 rounded-xl uppercase font-bold tracking-wider hover:bg-brand-secondary transition shrink-0 cursor-pointer text-center">
                  Create Operational Zone
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}