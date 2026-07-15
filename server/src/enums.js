// Central enum values used across models and routes.
// Keep in sync with client/src/enums.js.

export const CATEGORY = {
  EARRINGS: 'earrings',
  NECKLACES: 'necklaces',
  BRACELETS: 'bracelets',
  ANTIQUE: 'antique',
};
export const CATEGORIES = Object.values(CATEGORY);

// Pseudo-category meaning "no category filter"
export const CATEGORY_ALL = 'all';

// Home-page media slots: the four collection cards (photo) + the hero video
export const HERO_SLOT = 'hero';
export const COLLECTION_SLOTS = [...CATEGORIES, HERO_SLOT];

export const SORT = {
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  RATING: 'rating',
  NEWEST: 'newest',
};

export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};
export const ORDER_STATUSES = Object.values(ORDER_STATUS);

export const PAYMENT_METHOD = {
  COD: 'COD',
  UPI: 'UPI',
};

export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
};
export const MEDIA_TYPES = Object.values(MEDIA_TYPE);

export const PRODUCT_TAG = {
  BESTSELLER: 'Bestseller',
  NEW: 'New',
  FESTIVE: 'Festive',
  SALE: 'Sale',
};
