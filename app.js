(function() {
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('show');
      const menu = document.getElementById('nav-menu');
      if (menu) menu.classList.toggle('show');
    });
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Data persistence via localStorage
  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };

  function seedDemoData() {
    const seeded = storage.get('seeded', false);
    if (seeded) return;
    const products = [
      { id: cryptoRandomId(), name: 'Détergent Vaisselle', category: 'Cuisine', price: 350, description: 'Nettoyage puissant et doux pour les mains.', image: '' },
      { id: cryptoRandomId(), name: 'Lessive Liquide', category: 'Linge', price: 1200, description: 'Efficace dès 30°C, senteur fraîche.', image: '' },
      { id: cryptoRandomId(), name: 'Nettoyant Sol', category: 'Maison', price: 800, description: 'Brillance et hygiène pour tous types de sols.', image: '' }
    ];
    const reviews = [
      { id: cryptoRandomId(), name: 'Nadia', rating: 5, text: 'Produits de très bonne qualité !', productId: '' },
      { id: cryptoRandomId(), name: 'Amine', rating: 4, text: 'Bon rapport qualité/prix.', productId: '' }
    ];
    storage.set('products', products);
    storage.set('reviews', reviews);
    storage.set('seeded', true);
  }

  function cryptoRandomId() {
    if (window.crypto?.getRandomValues) {
      const arr = new Uint32Array(4); window.crypto.getRandomValues(arr); return Array.from(arr, n => n.toString(16)).join('');
    }
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function getProducts() { return storage.get('products', []); }
  function getReviews() { return storage.get('reviews', []); }
  function saveProducts(products) { storage.set('products', products); }
  function saveReviews(reviews) { storage.set('reviews', reviews); }

  function renderFeatured() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    const products = getProducts().slice(0, 3);
    container.innerHTML = products.map(p => productCardHTML(p)).join('');
  }

  function renderProductsPage() {
    const list = document.getElementById('products-list');
    if (!list) return;
    const search = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');
    const allProducts = getProducts();
    const categories = Array.from(new Set(allProducts.map(p => p.category))).sort();
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
    function apply() {
      const q = (search?.value || '').toLowerCase();
      const cat = categoryFilter?.value || '';
      const filtered = allProducts.filter(p =>
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
        (!cat || p.category === cat)
      );
      list.innerHTML = filtered.map(p => productCardHTML(p)).join('');
    }
    search?.addEventListener('input', apply);
    categoryFilter?.addEventListener('change', apply);
    apply();
  }

  function productCardHTML(p) {
    const price = new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(p.price || 0);
    const img = p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" />` : '<div style="height:160px;background:#eef;display:flex;align-items:center;justify-content:center;color:#555;">Image</div>';
    return `
      <article class="product">
        ${img}
        <div class="content">
          <div class="badge">${escapeHtml(p.category)}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="price">${price}</div>
          <p>${escapeHtml(p.description)}</p>
        </div>
      </article>
    `;
  }

  function renderReviewsPage() {
    const list = document.getElementById('reviews-list');
    const form = document.getElementById('reviewForm');
    const productSelect = document.getElementById('reviewProduct');
    if (!list || !form || !productSelect) return;
    const products = getProducts();
    productSelect.innerHTML = '<option value="">Général (entreprise)</option>' + products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

    function draw() {
      const reviews = getReviews().slice().reverse();
      list.innerHTML = reviews.map(r => reviewHTML(r, products)).join('');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reviewerName').value.trim();
      const rating = Number(document.getElementById('reviewRating').value);
      const text = document.getElementById('reviewText').value.trim();
      const productId = productSelect.value;
      if (!name || !text || !rating) return;
      const reviews = getReviews();
      reviews.push({ id: cryptoRandomId(), name, rating, text, productId });
      saveReviews(reviews);
      form.reset();
      draw();
    });
    draw();
  }

  function reviewHTML(r, products) {
    const stars = '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(r.rating);
    const product = products.find(p => p.id === r.productId);
    const label = product ? `Avis sur: ${escapeHtml(product.name)}` : 'Avis sur l\'entreprise';
    return `
      <article class="review">
        <div class="stars" aria-label="${r.rating} sur 5">${stars}</div>
        <div><strong>${escapeHtml(r.name)}</strong> — <small>${label}</small></div>
        <p>${escapeHtml(r.text)}</p>
      </article>
    `;
  }

  function renderContactPage() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('contactStatus');
    if (!form || !status) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = 'Merci pour votre message, nous vous répondrons bientôt.';
      form.reset();
    });
  }

  function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  seedDemoData();
  renderFeatured();
  renderProductsPage();
  renderReviewsPage();
  renderContactPage();
})();

