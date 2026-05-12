/* ===========================================
   AI Toys Hub - 共用 JS
   =========================================== */

(function() {
  'use strict';

  /* -------- 行動版選單開關 -------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      menuToggle.textContent = mainNav.classList.contains('open') ? '✕' : '☰';
    });
  }

  /* -------- 商品列表分類篩選 -------- */
  const filterChips = document.querySelectorAll('.filter-bar .filter-chip[data-filter]');
  const productGrid = document.getElementById('productGrid');
  if (filterChips.length && productGrid) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filter = chip.getAttribute('data-filter');
        // 切換 active 樣式
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        // 篩選卡片
        const cards = productGrid.querySelectorAll('.product-card');
        cards.forEach(card => {
          const cat = card.getAttribute('data-cat');
          if (filter === 'all' || cat === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* -------- 一般 filter-chip 切換 active (含價格、排序等) -------- */
  document.querySelectorAll('.filter-bar').forEach(bar => {
    const chips = bar.querySelectorAll('.filter-chip:not([data-filter])');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  });

  /* -------- 商品詳情頁:縮圖切換 -------- */
  const thumbs = document.querySelectorAll('.detail-thumbs > div');
  const mainImg = document.querySelector('.detail-main-img');
  if (thumbs.length && mainImg) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImg.innerHTML = thumb.innerHTML;
      });
    });
  }

  /* -------- Link Preview API:聯盟商品圖片自動抓取 -------- */
  const previewCache = new Map();
  const previewEndpoint = '/api/link-preview?url=';

  // ── Static image manifest (avoids API call for known products) ───────────
  let imageManifest = null;
  let manifestLoading = null;

  function getManifest() {
    if (imageManifest) return Promise.resolve(imageManifest);
    if (manifestLoading) return manifestLoading;
    manifestLoading = fetch('/assets/data/image-manifest.json', { cache: 'default' })
      .then(r => r.ok ? r.json() : {})
      .then(data => { imageManifest = data; return data; })
      .catch(() => { imageManifest = {}; return {}; });
    return manifestLoading;
  }

  function shopeeManifestKey(url) {
    const m = (url || '').match(/shopee\.tw\/product\/(\d+)\/(\d+)/);
    return m ? `${m[1]}_${m[2]}` : null;
  }
  // ─────────────────────────────────────────────────────────────────────────

  function isUsablePreviewUrl(url) {
    return /^https?:\/\//i.test(url || '') && !/^https?:\/\/[^/]+\/?.*#$/i.test(url || '') && url !== window.location.href;
  }

  function getCardPreviewUrl(card) {
    const explicit = card.getAttribute('data-preview-url') || card.querySelector('[data-preview-url]')?.getAttribute('data-preview-url');
    if (isUsablePreviewUrl(explicit)) return explicit;
    const sponsored = [...card.querySelectorAll('a[rel*="sponsored"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => isUsablePreviewUrl(href));
    return sponsored || '';
  }

  function ensurePreviewImage(thumb) {
    let img = thumb.querySelector('img.preview-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'preview-img';
      img.alt = thumb.getAttribute('aria-label') || '商品圖片';
      img.loading = 'lazy';
      img.decoding = 'async';
      thumb.appendChild(img);
    }
    return img;
  }

  function applyPreviewToCard(card, preview) {
    if (!preview) return;
    const thumb = card.querySelector('.product-thumb, .detail-main-img, .link-preview-thumb');
    if (thumb && preview.image) {
      const img = ensurePreviewImage(thumb);
      img.onload = () => thumb.classList.add('preview-loaded');
      img.onerror = () => thumb.classList.add('preview-failed');
      img.src = preview.image;
    }

    const title = card.querySelector('[data-preview-field="title"]');
    if (title && preview.title) title.textContent = preview.title;
    const desc = card.querySelector('[data-preview-field="description"]');
    if (desc && preview.description) desc.textContent = preview.description;
    const links = card.querySelectorAll('[data-preview-field="link"]');
    if (links.length && preview.url) links.forEach(link => { link.href = preview.url; });
  }

  function loadPreview(card) {
    const url = getCardPreviewUrl(card);
    if (!url || card.dataset.previewLoaded) return;
    card.dataset.previewLoaded = '1';
    card.classList.add('preview-loading');

    const done = data => {
      applyPreviewToCard(card, data);
      card.classList.remove('preview-loading');
      card.classList.toggle('preview-empty', !data?.image);
    };

    if (previewCache.has(url)) {
      done(previewCache.get(url));
      return;
    }

    // Check static manifest first (zero API cost for Shopee products)
    const manifestKey = shopeeManifestKey(url);
    if (manifestKey) {
      getManifest().then(manifest => {
        const entry = manifest[manifestKey];
        if (entry && entry.image) {
          const data = { image: entry.image, title: entry.title || '', description: '', url };
          previewCache.set(url, data);
          done(data);
        } else {
          // Not in manifest → skip API call for Shopee (always blocked)
          previewCache.set(url, null);
          done(null);
        }
      });
      return;
    }

    fetch(previewEndpoint + encodeURIComponent(url), { signal: AbortSignal.timeout(9000) })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('preview failed')))
      .then(data => {
        previewCache.set(url, data);
        done(data);
      })
      .catch(() => {
        previewCache.set(url, null);
        done(null);
      });
  }

  const previewCards = [...document.querySelectorAll('.product-card, .link-preview-card')]
    .filter(card => getCardPreviewUrl(card));
  if ('IntersectionObserver' in window) {
    const previewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        previewObserver.unobserve(entry.target);
        loadPreview(entry.target);
      });
    }, { rootMargin: '220px' });
    previewCards.forEach(card => previewObserver.observe(card));
  } else {
    previewCards.forEach(loadPreview);
  }

  const previewForm = document.getElementById('linkPreviewForm');
  if (previewForm) {
    previewForm.addEventListener('submit', event => {
      event.preventDefault();
      const input = previewForm.querySelector('input[name="url"]');
      const card = document.getElementById('linkPreviewResult');
      const url = input?.value.trim();
      if (!card || !isUsablePreviewUrl(url)) return;
      card.setAttribute('data-preview-url', url);
      card.dataset.previewLoaded = '';
      card.classList.remove('preview-empty');
      card.querySelectorAll('[data-preview-field="link"]').forEach(link => { link.href = url; });
      loadPreview(card);
    });
  }

  /* -------- 根據 URL 參數高亮分類 (簡單路由) -------- */
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat && productGrid) {
    const chip = document.querySelector(`.filter-chip[data-filter="${cat}"]`);
    if (chip) chip.click();
  }

  /* -------- 搜尋框 Enter 跳轉 -------- */
  document.querySelectorAll('.search-box input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          window.location.href = 'products.html?q=' + encodeURIComponent(q);
        }
      }
    });
  });

  /* -------- 平滑捲動到錨點 -------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target && target.id) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* -------- 滾動時 Header 陰影 -------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 10) {
        header.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastY = y;
    }, { passive: true });
  }

  /* -------- AdSense 自動載入 (有 publisher ID 時) -------- */
  // 在實際部署時,當頁面包含 <ins class="adsbygoogle"> 時,自動推送
  document.querySelectorAll('ins.adsbygoogle').forEach(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log('AdSense 尚未設定');
    }
  });

  /* -------- 聯盟連結點擊追蹤 (可串 GA4 事件) -------- */
  document.querySelectorAll('a[rel*="sponsored"]').forEach(link => {
    link.addEventListener('click', () => {
      const url = link.href;
      const platform = url.includes('shopee') ? 'shopee'
                     : url.includes('momo')   ? 'momo'
                     : url.includes('pchome') ? 'pchome'
                     : 'other';
      // 串接 GA4 事件 (有設定 gtag 時才會生效)
      if (typeof gtag === 'function') {
        gtag('event', 'affiliate_click', {
          platform: platform,
          link_url: url,
          page_path: window.location.pathname
        });
      }
      console.log('[Affiliate Click]', platform, url);
    });
  });

})();
