// type: 'info' (default) | 'success' | 'error' | 'wish'
export function toast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('rijisha:toast', { detail: { message, type } }));
}
