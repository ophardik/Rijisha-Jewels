// Central enum values used across pages and components.
// Keep in sync with server/src/enums.js.

export const CATEGORY = {
  EARRINGS: 'earrings',
  NECKLACES: 'necklaces',
  BRACELETS: 'bracelets',
  ANTIQUE: 'antique',
};

export const CATEGORY_LABEL = {
  [CATEGORY.EARRINGS]: 'Earrings',
  [CATEGORY.NECKLACES]: 'Necklaces',
  [CATEGORY.BRACELETS]: 'Bracelets',
  [CATEGORY.ANTIQUE]: 'Antique Jewellery',
};

// Pseudo-category meaning "no category filter"
export const CATEGORY_ALL = 'all';

// Home-page media slot for the hero video (the four categories are the card slots)
export const HERO_SLOT = 'hero';

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

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PLACED]: 'Order Placed',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const PAYMENT_METHOD = {
  COD: 'COD',
  UPI: 'UPI',
};

export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
};

export const PRODUCT_TAG = {
  BESTSELLER: 'Bestseller',
  NEW: 'New',
  FESTIVE: 'Festive',
  SALE: 'Sale',
};
