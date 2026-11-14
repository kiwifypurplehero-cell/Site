# Xbox-Style Purple Gaming Dashboard — Design Specification

> **Spec for:** Complete static-site gaming dashboard (HTML/CSS/JS vanilla) with Xbox-inspired UI, purple theme, fully responsive across all devices.

---

## Intent & Why

Build a **complete, production-ready gaming dashboard** that:
- Runs as static files anywhere (GitHub Pages, Netlify, Vercel, Apache, Nginx, CDN)
- Feels like Xbox Dashboard: hero carousel, game grid tiles, sidebar navigation, quick-resume row
- Uses a **purple theme** (not Xbox green) — distinct brand identity
- Works on **every device**: mobile (320px+), tablet, desktop, ultra-wide, TV/10-foot UI
- Zero build step, zero dependencies — just open `index.html`

---

## Goals

| Goal | Success Criteria |
|------|------------------|
| **Complete page set** | 6 pages: Home, Library, Store, Game Detail, Profile, Settings |
| **Xbox-like UX** | Hero carousel, game grid, sidebar nav, quick resume, search modal |
| **Purple theme** | Cohesive design tokens (purple primary, dark surfaces, accent colors) |
| **Fully responsive** | 320px → 3840px+; touch, mouse, keyboard, gamepad navigation |
| **Accessible** | WCAG AA: contrast, focus states, ARIA, semantic HTML, reduced motion |
| **Performant** | <100KB CSS+JS gzipped, no render-blocking, lazy-loaded images |
| **Maintainable** | Component-based CSS (BEM), modular JS (ESM), design tokens in `:root` |

---

## Non-Goals

- ❌ Backend / API / auth (mock data only)
- ❌ Real game streaming / launch
- ❌ Build tools (Vite, Webpack), frameworks (React, Vue)
- ❌ CMS / dynamic content
- ❌ IE11 support (modern browsers only)

---

## Anti-Goals (What Would Make This Fail)

| Anti-Goal | Why It Matters |
|-----------|----------------|
| Horizontal scroll on mobile | Breaks "works everywhere" promise |
| Missing focus styles | Unusable for keyboard/gamepad |
| Purple on purple (low contrast) | Fails accessibility |
| JS required for basic layout | Fragile, slow, breaks without JS |
| Fixed pixel widths | Breaks on TV/ultra-wide |
| 500KB+ assets | Slow on mobile/3G |

---

## Constraints

| Constraint | Value |
|------------|-------|
| **Tech** | HTML5, CSS3 (custom properties, Grid, Flexbox), ES Modules (JS) |
| **Browser support** | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| **File size budget** | CSS < 30KB gzipped, JS < 25KB gzipped, total < 100KB |
| **No external deps** | No jQuery, no Bootstrap, no icon fonts (inline SVG only) |
| **Images** | Placeholder SVGs or `/img/` with WebP + fallback |
| **Fonts** | System font stack + one Google Font (loaded via `<link rel=preconnect>`) |
| **Navigation** | Hash-based routing (`#home`, `#library`, etc.) or separate HTML files |

---

## Approaches Considered

| Approach | Trade-offs | Decision |
|----------|------------|----------|
| **Single HTML + hash routing** | Simple, works offline, SEO weak | ✅ **Chosen** — fits "runs anywhere" best |
| Separate HTML files per page | Better SEO, more files, duplicated layout | Rejected — maintenance burden |
| React/Vue + Vite | Component DX, needs build, not "runs anywhere" | Rejected — violates constraint |
| Astro/11ty static gen | Great DX, needs build step | Rejected — violates constraint |

---

## Design System (Purple Theme)

### Color Tokens (CSS Custom Properties)

```css
:root {
  /* Purple Primary Scale */
  --color-purple-50:  #faf5ff;
  --color-purple-100: #f3e8ff;
  --color-purple-200: #e9d5ff;
  --color-purple-300: #d8b4fe;
  --color-purple-400: #c084fc;
  --color-purple-500: #a855f7;  /* Primary brand */
  --color-purple-600: #9333ea;  /* Primary hover */
  --color-purple-700: #7e22ce;  /* Primary active */
  --color-purple-800: #6b21a8;
  --color-purple-900: #581c87;
  --color-purple-950: #3b0764;

  /* Surface Scale (Dark Theme) */
  --color-surface-0:   #0a0a0f;  /* Deep background */
  --color-surface-50:  #11111a;
  --color-surface-100: #1a1a2e;
  --color-surface-200: #22223a;
  --color-surface-300: #2d2d4a;
  --color-surface-400: #3a3a5c;

  /* Accent (Xbox-style highlights) */
  --color-accent-gold:  #ffd700;
  --color-accent-cyan:  #00e5ff;
  --color-accent-pink:  #ff2d95;

  /* Semantic */
  --color-text-primary:   #ffffff;
  --color-text-secondary: #b8b8d0;
  --color-text-muted:     #7a7a9a;
  --color-border:         #333355;
  --color-border-focus:   var(--color-purple-400);
  --color-error:          #ff6b6b;
  --color-success:        #4ade80;

  /* Shadows */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 24px rgba(168,85,247,0.3);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Orbitron', var(--font-sans);
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing Scale (4px base) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Border Radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast:  120ms ease-out;
  --transition-base:  200ms ease-out;
  --transition-slow:  350ms ease-out;

  /* Z-Index Scale */
  --z-dropdown:  100;
  --z-modal:     200;
  --z-toast:     300;
  --z-tooltip:   400;

  /* Layout */
  --header-height: 64px;
  --sidebar-width: 280px;
  --sidebar-collapsed: 72px;
  --max-content-width: 1440px;
}
```

### Typography Scale

| Token | Size/Line-height | Usage |
|-------|------------------|-------|
| `--text-xs` | 12px / 1.5 | Labels, caps |
| `--text-sm` | 14px / 1.5 | Body small, meta |
| `--text-base` | 16px / 1.6 | Body |
| `--text-lg` | 18px / 1.5 | Subheadings |
| `--text-xl` | 24px / 1.4 | Section titles |
| `--text-2xl` | 32px / 1.3 | Page titles |
| `--text-3xl` | 48px / 1.2 | Hero titles |
| `--text-4xl` | 64px / 1.1 | Display (TV) |

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `xs` | 320px | Mobile portrait |
| `sm` | 480px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |
| `tv` | 1920px | 10-foot UI (TV) |

---

## Page Specifications

### 1. Home / Dashboard (`#home`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Notifications | Profile Avatar      │
├──────────────┬──────────────────────────────────────────────┤
│ Sidebar      │ Main Content                                 │
│ (collapsible)│                                              │
│ • Home       │ ┌────────────────────────────────────────┐  │
│ • Library    │ │ HERO CAROUSEL (auto-rotate, 5s)        │  │
│ • Store      │ │ [Game Art]  Title + Desc  [Play] [Info]│  │
│ • Profile    │ └────────────────────────────────────────┘  │
│ • Settings   │                                              │
│              │ QUICK RESUME ROW                             │
│              │ [Tile] [Tile] [Tile] [Tile] [Tile] →        │
│              │                                              │
│              │ CONTINUE PLAYING (grid 4-col)               │
│              │ [Game Tile] [Game Tile] [Game Tile] ...     │
│              │                                              │
│              │ RECOMMENDED FOR YOU (grid)                  │
│              │ [Game Tile] [Game Tile] ...                 │
└──────────────┴──────────────────────────────────────────────┘
```

**Components:**
- `HeroCarousel` — 3-5 slides, keyboard/gamepad nav, pause on hover
- `QuickResumeRow` — horizontal scroll, 5 most recent games
- `GameGrid` — responsive columns: 1 (xs) → 2 (sm) → 3 (md) → 4 (lg) → 5 (xl) → 6 (tv)

---

### 2. Library (`#library`)

**Layout:**
```
Header + Sidebar (same)
Main:
  ├─ Filter Bar: [All] [Installed] [Wishlist] [Hidden] | Sort: [Recent] [A-Z] [Playtime] [Size]
  ├─ View Toggle: [Grid] [List]
  └─ Game Grid/List (all owned games)
       Empty State: "No games yet. Visit the Store!"
```

**Features:**
- Client-side filter/sort (JS on mock data)
- Grid ↔ List view toggle (persisted in localStorage)
- Game tiles show: cover, title, platform badges, playtime, last played, install status

---

### 3. Store (`#store`)

**Layout:**
```
Header + Sidebar
Main:
  ├─ Top Bar: [Featured] [Top Sellers] [New Releases] [Deals] [Genres]
  ├─ Hero Banner: Current promotion (large art + CTA)
  ├─ Section: "Top Sellers" (horizontal scroll row)
  ├─ Section: "New Releases" (grid)
  ├─ Section: "On Sale" (grid with strikethrough pricing)
  └─ Section: "Genres" (tag chips → filter)
```

**Game Tile (Store variant):** Cover, title, price (sale + original), rating, tags

---

### 4. Game Detail (`#game/:id`)

**Layout:**
```
Header (no sidebar) — Back button + Game Title + Share
Main:
  ├─ HERO: Full-width art, title, meta (genre, rating, release), [Play] [Wishlist] [Share]
  ├─ ABOUT: Description, developer, publisher, release date, languages
  ├─ MEDIA: Screenshot carousel + Video embed
  ├─ DETAILS: System requirements, file size, players, achievements
  ├─ RELATED: "You May Also Like" (horizontal scroll)
  └─ REVIEWS: User reviews (mock)
```

---

### 5. Profile (`#profile`)

**Layout:**
```
Header + Sidebar (Profile active)
Main:
  ├─ PROFILE HEADER: Avatar (editable), Username, Gamerscore, Tier, Bio
  ├─ TABS: [Achievements] [Stats] [Friends] [Activity]
  │   ├─ Achievements: Grid of achievement cards (unlocked/locked, progress)
  │   ├─ Stats: Charts (playtime by genre, completion rate, total hours)
  │   ├─ Friends: List with status, last seen, [Join] [Invite]
  │   └─ Activity: Feed (earned achievement, started game, screenshot)
  └─ SETTINGS LINK → Settings page
```

---

### 6. Settings (`#settings`)

**Layout:**
```
Header + Sidebar (Settings active)
Main: Two-column (sidebar categories + content)
Categories:
  ├─ General: Language, Region, Theme (Dark/Light/System), Auto-launch
  ├─ Display: Resolution, HDR, FPS cap, Motion blur, UI scale
  ├─ Audio: Master, Game, Chat, Voice chat, Output device
  ├─ Network: Bandwidth limit, NAT type, Port status
  ├─ Privacy: Profile visibility, Activity feed, Data collection
  ├─ Account: Email, Password, 2FA, Linked accounts, Delete account
  └─ Accessibility: High contrast, Reduced motion, Text size, Screen reader hints
```

---

## Shared Components (Reusable)

| Component | File | Variants |
|-----------|------|----------|
| `Header` | `components/header.js` | Standard, Game-detail (back btn) |
| `Sidebar` | `components/sidebar.js` | Expanded, Collapsed, Mobile drawer |
| `GameTile` | `components/game-tile.js` | Default, Compact, Store, Library, Wishlist |
| `HeroCarousel` | `components/hero-carousel.js` | Home, Store, Game-detail |
| `Button` | `components/button.js` | Primary, Secondary, Ghost, Icon, Danger |
| `Modal` | `components/modal.js` | Search, Confirm, Settings sub-panels |
| `Tooltip` | `components/tooltip.js` | Default, Rich (with image) |
| `Dropdown` | `components/dropdown.js` | Filter, Sort, User menu |
| `Tabs` | `components/tabs.js` | Profile tabs, Settings categories |
| `Slider` | `components/slider.js` | Volume, UI scale, Brightness |
| `Toggle` | `components/toggle.js` | Boolean settings |
| `Avatar` | `components/avatar.js` | Sizes: sm, md, lg, xl, editable |
| `Badge` | `components/badge.js` | Genre, Platform, Sale, New, Owned |
| `ProgressRing` | `components/progress-ring.js` | Achievement progress, Completion % |
| `Skeleton` | `components/skeleton.js` | Loading placeholders |

---

## Navigation & Routing

**Hash-based SPA router** (`js/router.js`):

```js
// Routes map
const routes = {
  '':          { page: 'home',      title: 'Home' },
  'home':      { page: 'home',      title: 'Home' },
  'library':   { page: 'library',   title: 'Library' },
  'store':     { page: 'store',     title: 'Store' },
  'game/:id':  { page: 'game-detail', title: 'Game' },
  'profile':   { page: 'profile',   title: 'Profile' },
  'settings':  { page: 'settings',  title: 'Settings' },
  'settings/:category': { page: 'settings', title: 'Settings' }
};
```

- On hash change → load page module → render into `<main id="app">`
- Browser history works (Back/Forward buttons)
- Deep-linkable URLs: `index.html#game/halo-infinite`
- Fallback: 404 page for unknown routes

---

## Mock Data Structure

**File:** `data/games.json` (imported as ES Module)

```json
{
  "games": [
    {
      "id": "halo-infinite",
      "title": "Halo Infinite",
      "slug": "halo-infinite",
      "cover": "img/games/halo-infinite/cover.webp",
      "hero": "img/games/halo-infinite/hero.webp",
      "screenshots": [...],
      "trailer": "https://youtube.com/embed/...",
      "description": "...",
      "shortDescription": "Master Chief returns...",
      "developer": "343 Industries",
      "publisher": "Xbox Game Studios",
      "releaseDate": "2021-12-08",
      "genres": ["FPS", "Action", "Sci-Fi"],
      "platforms": ["Xbox Series X|S", "Xbox One", "PC"],
      "rating": "T",
      "price": 59.99,
      "salePrice": 29.99,
      "onSale": true,
      "fileSize": "50 GB",
      "players": "1-16",
      "achievements": 60,
      "playtime": 47,
      "lastPlayed": "2026-11-10",
      "installed": true,
      "inLibrary": true,
      "wishlisted": false,
      "completion": 67,
      "metacritic": 87
    }
    // ... 15-20 games
  ],
  "user": {
    "id": "player1",
    "username": "Spartan117",
    "gamerscore": 48230,
    "tier": "Diamond",
    "avatar": "img/avatars/spartan.webp",
    "bio": "Finish the fight.",
    "stats": { "totalHours": 2847, "gamesOwned": 142, "completionRate": 73 },
    "friends": [...],
    "activity": [...],
    "achievements": [...]
  }
}
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Contrast** | All text ≥ 4.5:1 (AA), large text ≥ 3:1; purple on dark surface tested |
| **Focus visible** | `:focus-visible` ring: `2px solid var(--color-purple-400)` + offset |
| **Keyboard nav** | Tab order logical; Arrow keys in grids/carousels; Escape closes modals |
| **Gamepad nav** | D-pad/Left stick = arrow keys; A = Enter; B = Escape; Start = Home |
| **ARIA** | `role="region" aria-label`, `aria-expanded`, `aria-selected`, `aria-live` for toasts |
| **Reduced motion** | `@media (prefers-reduced-motion)` disables carousel auto-rotate, transitions |
| **High contrast** | `@media (prefers-contrast: more)` boosts borders, removes shadows |
| **Screen reader** | Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`), alt text, labels |
| **Touch targets** | Min 44×44px (mobile), 48×48px (TV) |

---

## Performance Budget

| Metric | Target |
|--------|--------|
| **HTML** | < 15 KB gzipped |
| **CSS** | < 30 KB gzipped (critical inlined) |
| **JS** | < 25 KB gzipped (deferred) |
| **Images** | WebP + AVIF, responsive `srcset`, lazy-loaded |
| **LCP** | < 2.5s (hero image preloaded) |
| **CLS** | < 0.1 (explicit dimensions, font-display: swap) |
| **TTI** | < 3.5s on 3G |
| **Total page weight** | < 500 KB (first load) |

---

## File Structure (Final)

```
/workspaces/Site/
├── index.html                    # Entry point (shell + router)
├── 404.html                      # Not found page
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker (offline cache)
├── css/
│   ├── tokens.css                # Design tokens (custom properties)
│   ├── reset.css                 # Normalize + base styles
│   ├── layout.css                # Grid/Flex layouts, page shells
│   ├── components.css            # All component styles (BEM)
│   ├── utilities.css             # Helper classes (.sr-only, .visually-hidden)
│   ├── themes.css                # Light theme, high contrast, reduced motion
│   └── print.css                 # Print styles
├── js/
│   ├── app.js                    # Boot: router, data load, global init
│   ├── router.js                 # Hash router + route guards
│   ├── data.js                   # Mock data import + helpers
│   ├── components/
│   │   ├── header.js
│   │   ├── sidebar.js
│   │   ├── game-tile.js
│   │   ├── hero-carousel.js
│   │   ├── button.js
│   │   ├── modal.js
│   │   ├── tooltip.js
│   │   ├── dropdown.js
│   │   ├── tabs.js
│   │   ├── slider.js
│   │   ├── toggle.js
│   │   ├── avatar.js
│   │   ├── badge.js
│   │   ├── progress-ring.js
│   │   └── skeleton.js
│   ├── pages/
│   │   ├── home.js
│   │   ├── library.js
│   │   ├── store.js
│   │   ├── game-detail.js
│   │   ├── profile.js
│   │   └── settings.js
│   └── utils/
│       ├── dom.js                # $, $$, createElement, delegate
│       ├── storage.js            # localStorage helpers
│       ├── format.js             # formatTime, formatBytes, formatDate
│       └── a11y.js               # focusTrap, announce, keyMap
├── data/
│   └── games.json                # Mock game + user data
├── img/
│   ├── games/                    # Game covers, heroes, screenshots
│   ├── avatars/                  # User avatars
│   ├── icons/                    # UI icons (SVG)
│   └── placeholders/             # SVG placeholders
└── docs/
    └── superpowers/
        ├── specs/2026-11-13-xbox-purple-gaming-dashboard-design.md
        └── plans/2026-11-13-xbox-purple-gaming-dashboard-plan.md
```

---

## What's Left to the Builder

- **Exact pixel polish** — spacing, animation timing, hover states
- **Image assets** — create/generate placeholder SVGs for all game art
- **PWA icons** — generate 192/512px icons from logo
- **Service Worker strategy** — cache-first for static, stale-while-revalidate for data
- **Analytics hooks** — `data-track` attributes for future analytics
- **Internationalization** — i18n structure in `data.js` (keys only, pt-BR + en-US)
- **Error boundaries** — graceful degradation if JS fails