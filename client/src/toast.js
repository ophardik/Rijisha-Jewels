export function toast(message) {
  window.dispatchEvent(new CustomEvent('rijisha:toast', { detail: message }));
}
