# 🤖 AI Toys Hub — AI 智能玩具聯盟行銷網站

> 一個參考 **zeczec.com** 卡片式風格,專為 **聯盟行銷** + **Google AdSense** 變現設計的多頁網站。

---

## 📁 檔案結構

```
AI_05骨頭人阿榮/
├── index.html              # 🏠 首頁(Hero、熱門商品、編輯精選、部落格、訂閱)
├── products.html           # 🛍️ 商品列表(含分類篩選、價格篩選、排序)
├── product-detail.html     # 📦 商品詳情(評測、規格、3 平台價格比較、聯盟按鈕)
├── blog.html               # 📖 部落格列表(選購指南、評測、優惠攻略)
├── blog-post.html          # 📝 部落格內頁(完整 SEO 結構 + Schema.org)
├── about.html              # 👋 關於我們(編輯團隊、合作說明、聯絡資訊)
├── privacy.html            # 🔒 隱私權政策 & 聯盟揭露(AdSense 必備)
├── README.md               # 📘 本文件
└── assets/
    ├── css/style.css       # 共用樣式(類 zeczec 卡片式設計)
    └── js/script.js        # 共用 JS(選單、篩選、追蹤)
```

---

## 🚀 快速上線(3 種方式擇一)

### 方法 1:GitHub Pages(免費、最推薦)
1. 在 GitHub 建立新 repo,例如 `ai-toys-hub`
2. 將整個 `AI_05骨頭人阿榮` 資料夾內容上傳
3. 進入 **Settings → Pages**,Source 選 `main` 分支
4. 約 1 分鐘後即可透過 `https://你的帳號.github.io/ai-toys-hub/` 訪問

### 方法 2:Netlify / Vercel(免費 + 自訂網域)
1. 拖曳整個資料夾到 https://app.netlify.com/drop
2. 立即取得 `https://xxx.netlify.app` 網址
3. 可在後台綁定自訂網域(如 `aitoyshub.tw`)

### 方法 3:傳統虛擬主機
1. 透過 FTP 將所有檔案上傳到 `public_html` 或 `www` 資料夾
2. 確保 `index.html` 在根目錄
3. 訪問你的網域即可

---

## 💰 變現設定步驟

### Step 1:申請 Google AdSense
1. 前往 https://www.google.com/adsense 申請
2. 通過審核(需網站有 10+ 篇優質內容、隱私政策、關於頁、聯絡頁)
3. 取得你的 **publisher ID**(格式:`ca-pub-XXXXXXXXXXXXXXXX`)

### Step 2:替換 AdSense 代碼
在所有 HTML 檔案中,搜尋 `ca-pub-XXXXXXXXXXXXXXXX`,替換成你的 publisher ID:

```html
<!-- 找到這段(目前被註解) -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

**取消註解** 並替換 ID,接著在每個 `.ad-slot` 區塊中加入對應的 AdSense 程式碼:

```html
<div class="ad-slot">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="1234567890"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

### Step 3:申請各大聯盟平台

| 平台 | 連結 | 佣金 | 備註 |
|------|------|------|------|
| 🛒 蝦皮分潤計畫 | https://affiliate.shopee.tw | 1-10% | 台灣使用者最多 |
| 💖 momo 富邦媒聯盟 | https://www.momoshop.com.tw | 1-8% | 隔日到貨優勢 |
| 📦 PChome 聯盟 | 須聯絡 PChome 商務窗口 | 1-6% | 24h 速度第一 |
| 🌐 Amazon Associates | https://affiliate-program.amazon.com | 1-10% | 海外讀者必備 |

### Step 4:替換聯盟連結
在所有 HTML 中,搜尋以下 placeholder 連結並替換成你的聯盟追蹤連結:

```html
<a href="https://shopee.tw/" ...>蝦皮選購</a>
<a href="https://www.momoshop.com.tw/" ...>Momo 選購</a>
<a href="https://24h.pchome.com.tw/" ...>PChome 選購</a>
```

替換為(範例):
```html
<a href="https://s.shopee.tw/你的追蹤碼" ...>蝦皮選購</a>
```

> 💡 **小技巧:** 使用 [Bitly](https://bitly.com) 或 [Pretty Links](https://prettylinks.com)(WordPress 外掛)管理,以便日後追蹤點擊率。

---

## 📈 SEO 設定建議

### 1. 替換每頁 `<title>` 與 `<meta name="description">`
每頁都要寫清楚、有差異的標題與描述,不要重複。

### 2. 加入 Google Search Console
- 前往 https://search.google.com/search-console
- 驗證網站擁有權(可用 HTML meta 標籤或 DNS)
- 提交 `sitemap.xml`

### 3. 製作 `sitemap.xml`
在根目錄新增:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://你的網域/</loc></url>
  <url><loc>https://你的網域/products.html</loc></url>
  <url><loc>https://你的網域/blog.html</loc></url>
  <url><loc>https://你的網域/about.html</loc></url>
  <url><loc>https://你的網域/privacy.html</loc></url>
</urlset>
```

### 4. 製作 `robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://你的網域/sitemap.xml
```

### 5. 結構化資料
本網站已內建 Schema.org 標記:
- `product-detail.html` → Product 結構化資料
- `blog-post.html` → Article 結構化資料

可在 [Google 結構化資料測試工具](https://search.google.com/test/rich-results) 驗證。

---

## 🎨 客製化指南

### 換主色(目前是紅色)
在 `assets/css/style.css` 最上方修改 CSS 變數:
```css
:root {
  --primary: #FF424D;       /* 改成你想要的主色 */
  --primary-dark: #E0303B;
  --primary-light: #FFE8EA;
}
```

### 換 Logo
搜尋 `<span class="logo-mark">AI</span>` 改成你的縮寫,或替換成 `<img>`。

### 加入新商品
參考 `products.html` 中任一 `<article class="product-card">` 結構複製即可。

### 加入新文章
參考 `blog-post.html` 結構,記得更新:
- `<title>` 與 `<meta name="description">`
- Schema.org 中的 `headline`、`datePublished`
- 麵包屑路徑

---

## 📱 響應式設計

- 桌機:1200px 以上,商品 4 欄
- 平板:768px–1024px,商品 3 欄
- 手機:480px–768px,商品 2 欄
- 小手機:480px 以下,商品 1 欄

行動版有漢堡選單,點 ☰ 展開。

---

## ✅ AdSense 申請通過小提醒

Google AdSense 審核重點:
1. ✅ 內容原創、有實質價值(不要只有商品列表,要有評測文章)
2. ✅ 至少 10–20 篇優質文章
3. ✅ 隱私權政策 (本網站已有 `privacy.html`)
4. ✅ 關於頁面 (本網站已有 `about.html`)
5. ✅ 聯絡資訊 (本網站 `about.html#contact`)
6. ✅ 網站有自己的網域(子網域、Blogspot、GitHub Pages 通過率較低)
7. ✅ 流量有一定基礎(建議每月 3,000+ UV 後再申請)

---

## 🔧 進階優化建議

1. **替換 Emoji 為真實商品圖片** - 建議用 [Cloudinary](https://cloudinary.com/) 或 [imgix](https://imgix.com/) 做圖片 CDN
2. **加入 LINE 分享按鈕** - 台灣使用者最常用的分享方式
3. **加入評論系統** - 推薦 [Disqus](https://disqus.com/) 或 [Giscus](https://giscus.app/)
4. **PWA 化** - 加入 `manifest.json` 讓使用者可加入手機桌面
5. **Cookie 同意條** - 符合 GDPR / 台灣個資法,使用 [CookieConsent](https://www.cookieconsent.com/)

---

## 📞 有問題?

這份網站是一個起點,建議:
- 內容是王:每週至少寫 1-2 篇優質評測文
- SEO 是長線:6 個月後流量才會顯著
- 聯盟收入 ≥ AdSense:認真做好商品連結,聯盟通常比 AdSense 賺更多

祝你 **AI Toys Hub** 經營順利,早日達標!🚀
