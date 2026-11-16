// Client-side config that respects per-client requirements
// Environment-driven branding and behavior per client deployment
// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/EnvironmentPlugin.js
export interface ClientConfig {
  // Branding
  brand: {
    name: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    tagline: string;
  };
  // Contact & support
  contact: {
    email: string;
    phone?: string;
    address?: string;
    supportUrl?: string;
    liveChat?: boolean;
  };
  // Admin configuration
  adminEmails: string[];
  // Feature flags
  features: {
    allowReviews?: boolean;
    enableWishlist?: boolean;
    enableGuestCart?: boolean;
    premiumTheme?: boolean;
    multiCurrency?: boolean;
    enableCompare?: boolean;
  };
  // SEO & meta
  seo: {
    siteName: string;
    defaultTitle: string;
    homeKeywords?: string[];
    description: string;
  };
  // Social / marketing
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  // Legal / compliance
  legal?: {
    privacyUrl?: string;
    termsUrl?: string;
    cookiePolicyUrl?: string;
  };
  // Payment
  payment?: {
    enableRazorpay?: boolean;
    enableStripe?: boolean;
    enablePayPal?: boolean;
    codEnabled?: boolean;
    upiEnabled?: boolean;
  };
  // Warehouse / fulfillment
  warehouse?: {
    enableStorePickup?: boolean;
    pickupLocations?: Array<{ id: string; name: string; address: string }>;
  };
  // Analytics
  analytics?: {
    gaId?: string;
    fbPixelId?: string;
    gtmId?: string;
  };
}

// Load configuration from environment variables + optional config file
// For security, sensitive keys (like Firebase) remain in server-only env vars.
const getEnvStringArray = (key: string): string[] => {
  const value = process.env[key];
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
};

const getEnvString = (key: string, fallback = '') => process.env[key] || fallback;

export const clientConfig: ClientConfig = {
  brand: {
    name: getEnvString('NEXT_PUBLIC_CLIENT_BRAND_NAME', 'FSC'),
    logoUrl: getEnvString('NEXT_PUBLIC_CLIENT_LOGO_URL', ''),
    primaryColor: getEnvString('NEXT_PUBLIC_CLIENT_PRIMARY_COLOR', '#dc2626'),
    secondaryColor: getEnvString('NEXT_PUBLIC_CLIENT_SECONDARY_COLOR', '#374151'),
    accentColor: getEnvString('NEXT_PUBLIC_CLIENT_ACCENT_COLOR', '#f59e0b'),
    fontFamily: getEnvString('NEXT_PUBLIC_CLIENT_FONT_FAMILY', 'Inter'),
    tagline: getEnvString('NEXT_PUBLIC_CLIENT_TAGLINE', 'Premium Quality'),
  },
  contact: {
    email: getEnvString('NEXT_PUBLIC_CLIENT_CONTACT_EMAIL', 'support@example.com'),
    phone: getEnvString('NEXT_PUBLIC_CLIENT_CONTACT_PHONE', ''),
    address: getEnvString('NEXT_PUBLIC_CLIENT_CONTACT_ADDRESS', ''),
    supportUrl: getEnvString('NEXT_PUBLIC_CLIENT_SUPPORT_URL', ''),
    liveChat: process.env.NEXT_PUBLIC_CLIENT_LIVE_CHAT === 'true',
  },
  adminEmails: getEnvStringArray('NEXT_PUBLIC_CLIENT_ADMIN_EMAILS'),
  features: {
    allowReviews: process.env.NEXT_PUBLIC_CLIENT_FEATURE_REVIEWS !== 'false',
    enableWishlist: process.env.NEXT_PUBLIC_CLIENT_FEATURE_WISHLIST !== 'false',
    enableGuestCart: process.env.NEXT_PUBLIC_CLIENT_FEATURE_GUEST_CART === 'true',
    premiumTheme: process.env.NEXT_PUBLIC_CLIENT_FEATURE_PREMIUM_THEME === 'true',
    multiCurrency: process.env.NEXT_PUBLIC_CLIENT_FEATURE_MULTI_CURRENCY === 'true',
    enableCompare: process.env.NEXT_PUBLIC_CLIENT_FEATURE_COMPARE === 'true',
  },
  seo: {
    siteName: getEnvString('NEXT_PUBLIC_CLIENT_SITE_NAME', 'E-Commerce Store'),
    defaultTitle: getEnvString('NEXT_PUBLIC_CLIENT_DEFAULT_TITLE', 'Shop Premium Products'),
    homeKeywords: getEnvString('NEXT_PUBLIC_CLIENT_HOME_KEYWORDS', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    description: getEnvString('NEXT_PUBLIC_CLIENT_DESCRIPTION', 'Your premium online store'),
  },
  social: {
    facebook: getEnvString('NEXT_PUBLIC_CLIENT_SOCIAL_FACEBOOK', ''),
    instagram: getEnvString('NEXT_PUBLIC_CLIENT_SOCIAL_INSTAGRAM', ''),
    twitter: getEnvString('NEXT_PUBLIC_CLIENT_SOCIAL_TWITTER', ''),
    tiktok: getEnvString('NEXT_PUBLIC_CLIENT_SOCIAL_TIKTOK', ''),
    youtube: getEnvString('NEXT_PUBLIC_CLIENT_SOCIAL_YOUTUBE', ''),
  },
  legal: {
    privacyUrl: getEnvString('NEXT_PUBLIC_CLIENT_PRIVACY_URL', '/privacy'),
    termsUrl: getEnvString('NEXT_PUBLIC_CLIENT_TERMS_URL', '/terms'),
    cookiePolicyUrl: getEnvString('NEXT_PUBLIC_CLIENT_COOKIE_POLICY_URL', '/cookies'),
  },
  payment: {
    enableRazorpay: process.env.NEXT_PUBLIC_CLIENT_PAYMENT_RAZORPAY === 'true',
    enableStripe: process.env.NEXT_PUBLIC_CLIENT_PAYMENT_STRIPE === 'true',
    enablePayPal: process.env.NEXT_PUBLIC_CLIENT_PAYMENT_PAYPAL === 'true',
    codEnabled: process.env.NEXT_PUBLIC_CLIENT_PAYMENT_COD === 'true',
    upiEnabled: process.env.NEXT_PUBLIC_CLIENT_PAYMENT_UPI === 'true',
  },
  warehouse: {
    enableStorePickup: process.env.NEXT_PUBLIC_CLIENT_WAREHOUSE_STORE_PICKUP === 'true',
    pickupLocations: [], // populated from server or static file if needed
  },
  analytics: {
    gaId: getEnvString('NEXT_PUBLIC_CLIENT_ANALYTICS_GA', ''),
    fbPixelId: getEnvString('NEXT_PUBLIC_CLIENT_ANALYTICS_FB_PIXEL', ''),
    gtmId: getEnvString('NEXT_PUBLIC_CLIENT_ANALYTICS_GTM', ''),
  },
};