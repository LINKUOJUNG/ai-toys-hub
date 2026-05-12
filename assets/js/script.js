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
