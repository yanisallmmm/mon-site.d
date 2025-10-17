(function() {
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };
  function getProducts() { return storage.get('products', []); }
  function saveProducts(v) { storage.set('products', v); }
  function getReviews() { return storage.get('reviews', []); }
  function saveReviews(v) { storage.set('reviews', v); }

  function cryptoRandomId() {
    if (window.crypto?.getRandomValues) {
      const arr = new Uint32Array(4); window.crypto.getRandomValues(arr); return Array.from(arr, n => n.toString(16)).join('');
    }
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function initProductsAdmin() {
    const form = document.getElementById('productForm');
    const resetBtn = document.getElementById('productReset');
    const tableContainer = document.getElementById('productsTable');
    if (!form || !tableContainer) return;

    function fillForm(p) {
      document.getElementById('productId').value = p?.id || '';
      document.getElementById('productName').value = p?.name || '';
      document.getElementById('productCategory').value = p?.category || '';
      document.getElementById('productPrice').value = p?.price ?? '';
      document.getElementById('productDescription').value = p?.description || '';
      document.getElementById('productImage').value = p?.image || '';
    }

    function draw() {
      const products = getProducts();
      const rows = products.map(p => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(p.price || 0)}</td>
          <td class="actions">
            <button data-id="${p.id}" class="btn btn-primary edit">Modifier</button>
            <button data-id="${p.id}" class="btn delete">Supprimer</button>
          </td>
        </tr>
      `).join('');
      tableContainer.innerHTML = `
        <table>
          <thead><tr><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan=4>Aucun produit</td></tr>'}</tbody>
        </table>
      `;
      tableContainer.querySelectorAll('.edit').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const p = getProducts().find(x => x.id === id);
        if (p) fillForm(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
      tableContainer.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const products = getProducts().filter(x => x.id !== id);
        saveProducts(products);
        draw();
      }));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('productId').value || cryptoRandomId();
      const next = {
        id,
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        price: Number(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value.trim(),
        image: document.getElementById('productImage').value.trim()
      };
      const products = getProducts();
      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) products[idx] = next; else products.push(next);
      saveProducts(products);
      fillForm(null);
      draw();
    });

    resetBtn?.addEventListener('click', () => fillForm(null));
    draw();
  }

  function initReviewsAdmin() {
    const tableContainer = document.getElementById('reviewsTable');
    if (!tableContainer) return;
    function draw() {
      const reviews = getReviews().slice().reverse();
      const rows = reviews.map(r => `
        <tr>
          <td>${escapeHtml(r.name)}</td>
          <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
          <td>${escapeHtml(r.text)}</td>
          <td class="actions"><button data-id="${r.id}" class="btn delete">Supprimer</button></td>
        </tr>
      `).join('');
      tableContainer.innerHTML = `
        <table>
          <thead><tr><th>Nom</th><th>Note</th><th>Avis</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan=4>Aucun avis</td></tr>'}</tbody>
        </table>
      `;
      tableContainer.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const next = getReviews().filter(x => x.id !== id);
        saveReviews(next);
        draw();
      }));
    }
    draw();
  }

  function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

  initProductsAdmin();
  initReviewsAdmin();
})();

