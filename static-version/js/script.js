// ============================================================
// RIJISHA JEWELLERS — interactions
// ============================================================

// ---------- Sticky header shadow ----------
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

// ---------- Mobile menu ----------
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// ---------- Product filtering ----------
const tabs = document.querySelectorAll('.tab');
const products = document.querySelectorAll('.product');

function applyFilter(filter) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.filter === filter));
  products.forEach(p => {
    const show = filter === 'all' || p.dataset.cat === filter;
    p.classList.toggle('hidden', !show);
  });
}

tabs.forEach(tab =>
  tab.addEventListener('click', () => applyFilter(tab.dataset.filter))
);

// Nav / category links that pre-select a filter (e.g. "Earrings")
document.querySelectorAll('[data-filter-link]').forEach(link =>
  link.addEventListener('click', () => applyFilter(link.dataset.filterLink))
);

// ---------- Wishlist ----------
const wishCount = document.getElementById('wishCount');
let wished = 0;

document.querySelectorAll('.wish').forEach(btn =>
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    wished += btn.classList.contains('active') ? 1 : -1;
    wishCount.textContent = wished;
    const name = btn.closest('.product').querySelector('h3').textContent;
    showToast(btn.classList.contains('active')
      ? `♥ ${name} added to wishlist`
      : `${name} removed from wishlist`);
  })
);

// ---------- Add to bag ----------
const bagCount = document.getElementById('bagCount');
let bag = 0;

document.querySelectorAll('.quick-add').forEach(btn =>
  btn.addEventListener('click', () => {
    bag++;
    bagCount.textContent = bag;
    showToast(`✓ ${btn.dataset.name} added to your bag`);
  })
);

// ---------- Newsletter ----------
document.getElementById('newsForm').addEventListener('submit', e => {
  e.preventDefault();
  showToast('✓ Welcome to the Rijisha Circle!');
  e.target.reset();
});

// ---------- Toast ----------
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---------- Reveal on scroll ----------
const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
