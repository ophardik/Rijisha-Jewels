// External destinations used across the site — update handles/numbers here.
export const ETSY_URL = 'https://rijishaajewels.etsy.com';
export const INSTAGRAM_URL = 'https://www.instagram.com/rijishaajewels';
export const FACEBOOK_URL = 'https://www.facebook.com/rijishaajewels';

// WhatsApp number in international format, digits only (matches the footer).
export const WHATSAPP_NUMBER = '919876543210';
export const whatsappUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
