(function() {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const loginPanel = $('#loginPanel');
  const managerPanel = $('#managerPanel');
  const loginForm = $('#loginForm');
  const productForm = $('#productForm');
  const statusEl = $('#formStatus');
  const listEl = $('#productList');
  const logoutBtn = $('#logoutBtn');
  const previewBtn = $('#previewBtn');
  const reloadBtn = $('#reloadBtn');
  const previewCard = $('#adminPreviewCard');

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message || '';
    statusEl.classList.toggle('error', isError);
  }

  function categoryLabel(cat = 'robot') {
    return ({ robot: '智能機器人', pet: 'AI 智能寵物', steam: 'STEAM 編程', plush: '語音玩偶', drone: '智能飛行', learn: 'AI 學習機' })[cat] || 'AI 玩具';
  }

  function platformFromUrl(value = '') {
    try {
      const host = new URL(value).hostname;
      if (host.includes('shopee')) return 'Shopee';
      if (host.includes('momo')) return 'Momo';
      if (host.includes('pchome')) return 'PChome';
      return host.replace(/^www\./, '');
    } catch { return 'Affiliate'; }
  }

  async function api(path, options = {}) {
    const resp = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return data;
  }

  async function checkSession() {
    try {
      const data = await api('/api/admin-auth');
      showManager(!!data.ok);
    } catch { showManager(false); }
  }

  function showManager(ok) {
    loginPanel.hidden = ok;
    managerPanel.hidden = !ok;
    logoutBtn.hidden = !ok;
    if (ok) loadProducts();
  }

  function productFromForm(extra = {}) {
    const data = { ...formData(productForm), ...extra };
    const title = data.title || extra.title || '商品標題';
    return {
      ...data,
      title,
      description: data.description || extra.description || '商品描述會顯示在這裡。',
      image: data.image || extra.image || '',
      affiliateUrl: data.affiliateUrl || data.url || extra.url || '#',
      url: data.url || extra.url || '#',
      platform: extra.platform || platformFromUrl(data.affiliateUrl || data.url),
    };
  }

  function renderPreview(item) {
    const thumb = previewCard.querySelector('.product-thumb');
    const bodyTitle = previewCard.querySelector('.product-title a');
    const desc = previewCard.querySelector('.product-desc');
    const cat = previewCard.querySelector('.product-cat');
    const rating = previewCard.querySelector('.product-rating');
    const priceRow = previewCard.querySelector('.product-price-row');
    const button = previewCard.querySelector('.product-buttons a');
    const title = item.title || '商品標題';
    const url = item.affiliateUrl || item.url || '#';

    thumb.href = url;
    thumb.innerHTML = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">`
      : '<span>🤖</span>';
    bodyTitle.href = url;
    bodyTitle.textContent = title;
    desc.textContent = item.description || '商品描述會顯示在這裡。';
    cat.textContent = categoryLabel(item.category);
    rating.textContent = `★ ${item.platform || platformFromUrl(url)}`;
    button.href = url;
    priceRow.innerHTML = `${item.price ? `<span class="product-price">${escapeHtml(item.price)}</span>` : ''}${item.oldPrice ? `<span class="product-price-old">${escapeHtml(item.oldPrice)}</span>` : ''}`;
  }

  async function previewFromUrl() {
    const data = formData(productForm);
    if (!data.url) throw new Error('請先貼上商品頁網址');
    setStatus('正在抓取商品圖片與標題…');
    const preview = await api(`/api/link-preview?url=${encodeURIComponent(data.url)}`, { headers: {} });
    if (preview.title && !productForm.elements.title.value) productForm.elements.title.value = preview.title;
    if (preview.description && !productForm.elements.description.value) productForm.elements.description.value = preview.description;
    if (preview.image && !productForm.elements.image.value) productForm.elements.image.value = preview.image;
    renderPreview(productFromForm(preview));
    setStatus(preview.image ? '已抓到商品圖片，可儲存。' : '沒有抓到平台圖片；可手動貼商品圖 URL 後儲存。', !preview.image);
  }

  async function loadProducts() {
    listEl.innerHTML = '<p class="admin-note">載入中…</p>';
    try {
      const data = await api('/api/admin-products');
      const items = data.items || [];
      if (!items.length) {
        listEl.innerHTML = '<p class="admin-note">目前沒有後台新增商品。</p>';
        return;
      }
      listEl.innerHTML = items.map(item => `
        <article class="admin-list-item" data-id="${escapeHtml(item.id)}">
          <img src="${escapeHtml(item.image || 'assets/images/logo.svg')}" alt="" loading="lazy">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.categoryLabel || categoryLabel(item.category))} · ${escapeHtml(item.platform || '')}</span>
          </div>
          <button class="btn-mini" data-action="edit">編輯</button>
          <button class="btn-mini danger" data-action="delete">刪除</button>
        </article>`).join('');
      listEl.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.closest('.admin-list-item').dataset.id;
        const item = items.find(v => v.id === id);
        if (!item) return;
        ['id','url','affiliateUrl','category','badge','price','oldPrice','image','title','description'].forEach(k => {
          if (productForm.elements[k]) productForm.elements[k].value = item[k] || '';
        });
        renderPreview(item);
        window.scrollTo({ top: productForm.offsetTop - 90, behavior: 'smooth' });
      }));
      listEl.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async () => {
        const id = btn.closest('.admin-list-item').dataset.id;
        if (!confirm('確定要刪除這張商品卡片？')) return;
        await api('/api/admin-products', { method: 'DELETE', body: JSON.stringify({ id }) });
        await loadProducts();
      }));
    } catch (error) {
      listEl.innerHTML = `<p class="admin-status error">${escapeHtml(error.message)}</p>`;
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api('/api/admin-auth', { method: 'POST', body: JSON.stringify(formData(loginForm)) });
      showManager(true);
    } catch (error) {
      alert(error.message);
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await api('/api/admin-auth', { method: 'DELETE' }).catch(() => {});
    showManager(false);
  });

  previewBtn.addEventListener('click', () => previewFromUrl().catch(error => setStatus(error.message, true)));
  reloadBtn.addEventListener('click', loadProducts);
  productForm.addEventListener('input', () => renderPreview(productFromForm()));
  productForm.addEventListener('reset', () => setTimeout(() => renderPreview(productFromForm()), 0));
  productForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      setStatus('正在儲存到 GitHub，Vercel 會自動重新部署…');
      const data = formData(productForm);
      const method = data.id ? 'PUT' : 'POST';
      const result = await api('/api/admin-products', { method, body: JSON.stringify(data) });
      if (result.product) renderPreview(result.product);
      productForm.reset();
      setStatus('已儲存。等待 Vercel 自動部署後，商品頁會顯示新卡片。');
      await loadProducts();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  checkSession();
})();
