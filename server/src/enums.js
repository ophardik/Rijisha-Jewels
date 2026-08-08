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

// "Our Story" photography. Deliberately ONE pair of slots shared by the home
// page and the About page rather than a set each: uploading once updates both,
// so the two tellings of the story can never drift apart.
export const STORY_SLOT = 'story';
export const STORY_DETAIL_SLOT = 'storyDetail';

export const COLLECTION_SLOTS = [...CATEGORIES, HERO_SLOT, STORY_SLOT, STORY_DETAIL_SLOT];

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

// Photo-review reward for repeat Etsy purchases
export const REWARD_STATUS = {
  PENDING: 'pending', // awaiting admin verification of the Etsy order
  APPROVED: 'approved', // verified — a coupon code is assigned
  REJECTED: 'rejected', // order could not be verified
};
export const REWARD_STATUSES = Object.values(REWARD_STATUS);

// Percentage off the next Etsy order for a verified photo review
export const REVIEW_REWARD_PERCENT = 15;
