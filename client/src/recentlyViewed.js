// Recently viewed products, kept in localStorage (like the cart).
const KEY = 'rijisha_recently_viewed';
const MAX = 8;

export function addRecentlyViewed(product) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || [];
    const next = [product, ...list.filter((p) => p._id !== product._id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — feature just stays empty
  }
}

export function getRecentlyViewed(excludeId) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || [];
    return list.filter((p) => p._id !== excludeId);
  } catch {
    return [];
  }
}
