export type UserRole = 'customer' | 'admin' | 'rider';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string; // Bangla translation
  slug: string;
  type: 'food' | 'grocery';
  image: string;
}

export interface Product {
  id: string;
  name: string;
  nameBn?: string; // Bangla translation
  description: string;
  descriptionBn?: string; // Bangla translation
  price: number;
  image: string; // URL or base64
  categoryId: string;
  stock: number;
  isAvailable: boolean;
  type: 'food' | 'grocery';
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  riderId: string | null; // ID of the rider assigned
  riderName: string | null;
  riderPhone: string | null;
  createdAt: string;
  locationHistory: LatLng[]; // track rider location
  notes?: string;
}

export interface RiderStatus {
  id: string; // Maps to User.id
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'delivering';
  currentLat: number;
  currentLng: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  titleBn?: string;
  subtitle?: string;
  subtitleBn?: string;
  image: string;
  linkUrl?: string;
  isActive: boolean;
}

export interface DeliveryChargeSettings {
  baseCharge: number;
  freeDeliveryThreshold: number;
}

export interface DeliveryArea {
  id: string;
  name: string;
  radiusKm: number;
  deliveryCharge: number;
  minOrderAmount: number;
  isActive: boolean;
}

export interface SiteSettings {
  // Identity
  brandName: string;
  tagline: string;
  phone: string;
  whatsAppNumber: string;
  email: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  footerText: string;
  deliveryEstimateMins: number;
  contactAddress: string;

  // Branding Images
  logoUrl?: string;
  footerLogoUrl?: string;
  faviconUrl?: string;
  mobileAppIconUrl?: string;
  logoWidth?: string;
  logoHeight?: string;
  logoPosition?: 'left' | 'center' | 'right';

  // Themes
  primaryColor?: string;
  secondaryColor?: string;
  buttonColor?: string;
  headerBgColor?: string;
  footerBgColor?: string;

  // Homepage builder
  enableHeroBanner?: boolean;
  enableCategories?: boolean;
  enableFeaturedProducts?: boolean;
  enablePromotionalSections?: boolean;
  homepageSectionsOrder?: string[];
}

