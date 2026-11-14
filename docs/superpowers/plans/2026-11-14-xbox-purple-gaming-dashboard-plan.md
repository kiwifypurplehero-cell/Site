# Xbox Purple Gaming Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-ready Xbox-style gaming dashboard with purple theme as static HTML/CSS/JS — 6 pages, fully responsive, accessible, zero dependencies.

**Architecture:** Single-page hash-routed app with modular ES6 components. Design tokens in CSS custom properties. Component-based CSS (BEM). Mock data imported as ES Module. All files static — deploy anywhere.

**Tech Stack:** HTML5, CSS3 (Custom Properties, Grid, Flexbox, Container Queries), ES Modules (vanilla JS), IntersectionObserver for lazy loading, localStorage for persistence.

**Spec:** `docs/superpowers/specs/2026-11-13-xbox-purple-gaming-dashboard-design.md`

---

## Global Constraints

- **No build step** — all files served directly
- **No external runtime deps** — only Google Fonts (preconnected) for Orbitron + Inter
- **Browser target** — Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- **File budgets** — CSS < 30KB gz, JS < 25KB gz, HTML < 15KB gz
- **Accessibility** — WCAG AA minimum, gamepad + keyboard navigation
- **Responsive** — 320px → 3840px+, including TV/10-foot UI
- **Performance** — Critical CSS inlined, defer non-critical, preload hero images

---

## Review Focus

| Input / Condition | Expected Behavior | Owner Task |
|-------------------|-------------------|------------|
| **JS disabled** | Core layout + navigation works (HTML-only fallback); hero shows first slide static; grids render | Task 2 (HTML shell) |
| **Mobile 320px** | No horizontal scroll; sidebar becomes drawer; hero stacks; game tiles 1-col; touch targets 44px | Task 4 (Responsive CSS) |
| **TV 1920px (10-foot)** | UI scale 1.5x; focus ring 4px; navigation via D-pad; text readable at 3m | Task 4 + Task 10 (Gamepad) |
| **Reduced motion** | Carousel auto-rotate off; transitions instant; no parallax | Task 5 (Themes/Accessibility CSS) |
| **High contrast mode** | Borders 2px; shadows removed; purple→white text; focus ring 3px white | Task 5 |
| **Keyboard only** | Tab order logical; skip link; arrow keys in grids; Escape closes modals | Task 10 (A11y utils) |
| **Deep link `#game/foo`** | Loads game detail directly; back button returns to referrer | Task 3 (Router) |
| **Slow 3G** | Hero preloaded; skeleton loaders; images lazy; SW caches shell | Task 12 (PWA/SW) |

---

## Task Breakdown

### Task 1: Project Scaffold & Design Tokens

**Files:**
- Create: `css/tokens.css`
- Create: `css/reset.css`
- Create: `css/themes.css`
- Create: `data/games.json`
- Create: `manifest.json`

**Interfaces:**
- Produces: All design tokens (`--color-*`, `--space-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--z-*`, `--transition-*`, breakpoints) for every subsequent task.

```text
- [ ] Step 1: Write tokens.css with full spec token set (colors, spacing, type, radius, shadows, z-index, transitions, breakpoints)
- [ ] Step 2: Write reset.css (modern normalize: box-sizing, root font-size, scrollbar, selection, focus-visible baseline)
- [ ] Step 3: Write themes.css (light theme override, prefers-reduced-motion, prefers-contrast, forced-colors)
- [ ] Step 4: Create data/games.json with 18 games + user profile (per spec structure)
- [ ] Step 5: Create manifest.json (PWA: name, icons, theme_color=#581c87, display=standalone)
- [ ] Step 6: Verify tokens load — open index.html (empty) in browser, check computed custom properties in DevTools
- [ ] Step 7: Commit
```

```bash
git add css/tokens.css css/reset.css css/themes.css data/games.json manifest.json
git commit -m "feat: scaffold design tokens, reset, themes, mock data, PWA manifest"
```

---

### Task 2: HTML Shell & Router Entry Point

**Files:**
- Create: `index.html`
- Create: `404.html`
- Create: `js/router.js`
- Create: `js/app.js`
- Create: `js/utils/dom.js`

**Interfaces:**
- Consumes: `tokens.css`, `reset.css` (via `<link>`)
- Produces: Global `router` object with `navigate(hash)`, `onRoute(callback)`, `getParams()`; `#app` mount point; `app.init()` boot function

```text
- [ ] Step 1: Write index.html — doctype, lang=pt-BR, meta viewport, preconnect fonts, critical CSS inlined (tokens + reset + layout shell), deferred CSS link, deferred JS module (app.js), <header>, <aside id="sidebar">, <main id="app">, <footer>, skip link
- [ ] Step 2: Write 404.html — minimal shell, friendly message, link to #home
- [ ] Step 3: Write js/utils/dom.js — export $, $$, createEl, delegate, onReady, qs, qsa
- [ ] Step 4: Write js/router.js — hashchange + popstate listener, route table (spec routes), param parsing (:id), navigate(), getCurrentRoute(), route guards (auth placeholder)
- [ ] Step 5: Write js/app.js — import router, data, components; init: load data → render header/sidebar → router.onRoute(renderPage) → handle initial hash
- [ ] Step 6: Test — serve with `npx serve .` or `python -m http.server`, verify hash routing works (#home, #library, #store, #profile, #settings, #game/test)
- [ ] Step 7: Commit
```

```bash
git add index.html 404.html js/router.js js/app.js js/utils/dom.js
git commit -m "feat: HTML shell, hash router, app bootstrap"
```

---

### Task 3: Layout CSS (Shell, Grid, Sidebar, Header)

**Files:**
- Create: `css/layout.css`

**Interfaces:**
- Consumes: All tokens from Task 1
- Produces: Layout classes: `.app-shell`, `.header`, `.sidebar`, `.main`, `.page`, `.container`, `.grid`, `.sidebar--collapsed`, `.sidebar--mobile-open`, responsive breakpoint utilities

```text
- [ ] Step 1: Write .app-shell — CSS Grid: header fixed top, sidebar left, main content area, min-height 100vh
- [ ] Step 2: Write .header — height var(--header-height), flex: logo, spacer, search-btn, notifications, avatar; sticky; backdrop-filter blur
- [ ] Step 3: Write .sidebar — width var(--sidebar-width), collapsible to var(--sidebar-collapsed), mobile drawer (fixed, transform, overlay), nav list with icons+labels
- [ ] Step 4: Write .main — padding responsive (space-4 → space-8), max-width var(--max-content-width), margin auto
- [ ] Step 5: Write .container — width 100%, max-width, padding responsive
- [ ] Step 6: Write .grid — display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) — responsive columns per spec
- [ ] Step 7: Write responsive breakpoints using @media (xs→tv) adjusting sidebar, grid cols, header height, font scales
- [ ] Step 8: Test — open index.html, verify layout at 320, 768, 1024, 1440, 1920 (DevTools device toolbar)
- [ ] Step 9: Commit
```

```bash
git add css/layout.css
git commit -m "feat: layout CSS — shell, header, sidebar, responsive grid"
```

---

### Task 4: Component CSS (All UI Components)

**Files:**
- Create: `css/components.css`

**Interfaces:**
- Consumes: Tokens (Task 1), Layout (Task 3)
- Produces: BEM-styled component classes for: Button, GameTile, HeroCarousel, Modal, Dropdown, Tabs, Slider, Toggle, Avatar, Badge, ProgressRing, Skeleton, Tooltip, SearchModal, Toast

```text
- [ ] Step 1: Button — .btn (base), .btn--primary, .btn--secondary, .btn--ghost, .btn--icon, .btn--danger, .btn--lg/.sm, :hover/:active/:focus-visible/:disabled states
- [ ] Step 2: GameTile — .game-tile (aspect-ratio 16/10), .game-tile__cover, .game-tile__title, .game-tile__meta, .game-tile__badges, .game-tile__progress; variants: --compact, --store, --library, --wishlist; hover lift + glow
- [ ] Step 3: HeroCarousel — .hero, .hero__slide, .hero__content, .hero__actions, .hero__indicators, .hero__btn (prev/next); slide transition; pause on hover
- [ ] Step 4: Modal — .modal (portal), .modal__backdrop, .modal__panel, .modal__close; focus trap; animate in/out; sizes (sm, md, lg, full)
- [ ] Step 5: Dropdown — .dropdown, .dropdown__trigger, .dropdown__menu, .dropdown__item, .dropdown__divider; keyboard nav (arrows, Enter, Escape)
- [ ] Step 6: Tabs — .tabs, .tabs__list, .tabs__trigger, .tabs__panel; aria-selected, keyboard arrows, indicator bar
- [ ] Step 7: Slider — .slider, .slider__track, .slider__thumb, .slider__fill; vertical/horizontal; step, min, max; tooltip on drag
- [ ] Step 8: Toggle — .toggle, .toggle__track, .toggle__thumb; checked state; label support
- [ ] Step 9: Avatar — .avatar (sizes: sm=32, md=48, lg=72, xl=120), .avatar__image, .avatar__fallback, .avatar--editable (+ pencil overlay)
- [ ] Step 10: Badge — .badge, .badge--genre, .badge--platform, .badge--sale, .badge--new, .badge--owned; sizes
- [ ] Step 11: ProgressRing — .progress-ring (SVG), .progress-ring__bg, .progress-ring__progress; stroke-dasharray; size variants
- [ ] Step 12: Skeleton — .skeleton, .skeleton--text, .skeleton--card, .skeleton--avatar; shimmer animation (respects reduced-motion)
- [ ] Step 13: Tooltip — .tooltip, .tooltip__arrow; positions (top, bottom, left, right); delay show/hide
- [ ] Step 14: SearchModal — .search-modal (full-screen), .search-modal__input, .search-modal__results, .search-modal__item
- [ ] Step 15: Toast — .toast, .toast--success, .toast--error, .toast--info; stack; auto-dismiss; aria-live
- [ ] Step 16: Test — create temporary test.html importing components.css, render each component, verify states
- [ ] Step 17: Commit
```

```bash
git add css/components.css
git commit -m "feat: complete component CSS library (BEM, all variants, states)"
```

---

### Task 5: Utility CSS & Print Styles

**Files:**
- Create: `css/utilities.css`
- Create: `css/print.css`

**Interfaces:**
- Produces: Helper classes (.sr-only, .visually-hidden, .text-*, .flex-*, .gap-*, .container, .aspect-ratio, .scrollbar-hide, .animate-in, .truncate), print stylesheet

```text
- [ ] Step 1: Write utilities.css — spacing, typography, display, flex/grid helpers, truncate, aspect-ratio, scrollbar-hide, visually-hidden, focus-ring, skip-link
- [ ] Step 2: Write print.css — hide header/sidebar/modals, show all content, high contrast, page breaks
- [ ] Step 3: Test — @media print preview in DevTools
- [ ] Step 4: Commit
```

```bash
git add css/utilities.css css/print.css
git commit -m "feat: utility classes + print stylesheet"
```

---

### Task 6: Core JS Utilities

**Files:**
- Create: `js/utils/storage.js`
- Create: `js/utils/format.js`
- Create: `js/utils/a11y.js`
- Create: `js/data.js`

**Interfaces:**
- Produces: `storage.get/set/remove(key)`, `format.time(ms)`, `format.bytes(bytes)`, `format.date(iso)`, `format.number(n)`, `a11y.trapFocus(el)`, `a11y.announce(msg)`, `a11y.keyMap` (gamepad→keyboard), `data.games`, `data.user`, `data.getGame(id)`, `data.filterGames(opts)`

```text
- [ ] Step 1: Write storage.js — localStorage wrapper with JSON, namespace prefix, TTL support, migration helper
- [ ] Step 2: Write format.js — time (47h → "47h", 120m → "2h"), bytes (50GB → "50 GB"), date (ISO → "8 Dec 2021"), number (48230 → "48,230")
- [ ] Step 3: Write a11y.js — focusTrap (tab cycle), announce (aria-live region), keyMap (gamepad buttons → key codes), reducedMotion check
- [ ] Step 4: Write data.js — import games.json (ESM), export games array, user object, helper fns (getGame, filterGames, sortGames, getLibraryGames, getWishlistGames, getInstalledGames)
- [ ] Step 5: Test — node --experimental-vm-modules -e "import './js/data.js'" (or browser console)
- [ ] Step 6: Commit
```

```bash
git add js/utils/storage.js js/utils/format.js js/utils/a11y.js js/data.js
git commit -m "feat: core JS utilities (storage, format, a11y, data layer)"
```

---

### Task 7: Shared Components (Header, Sidebar, GameTile, Button, Modal)

**Files:**
- Create: `js/components/header.js`
- Create: `js/components/sidebar.js`
- Create: `js/components/game-tile.js`
- Create: `js/components/button.js`
- Create: `js/components/modal.js`

**Interfaces:**
- Each exports `init()`, `render(props)`, `destroy()`; Header/Sidebar mount to existing DOM; GameTile/Button/Modal create elements

```text
- [ ] Step 1: header.js — render logo, search trigger, notifications, avatar dropdown; bind events; expose updateNotifications(count)
- [ ] Step 2: sidebar.js — render nav items (from config), handle collapse/expand, mobile drawer toggle, active route highlighting; keyboard/gamepad nav
- [ ] Step 3: game-tile.js — render tile from game object (all variants); handle click → navigate; hover/focus states; lazy-load cover image
- [ ] Step 4: button.js — create button element with variant, size, loading state, icon slot; accessible (aria-pressed, disabled)
- [ ] Step 5: modal.js — create portal, focus trap, render content, handle Escape/backdrop click, animate; static methods: alert(), confirm(), prompt(), close()
- [ ] Step 6: Test — import each in browser console, call render(), verify DOM output
- [ ] Step 7: Commit
```

```bash
git add js/components/header.js js/components/sidebar.js js/components/game-tile.js js/components/button.js js/components/modal.js
git commit -m "feat: shared components (header, sidebar, game-tile, button, modal)"
```

---

### Task 8: Advanced Components (Carousel, Dropdown, Tabs, Slider, Toggle, Avatar, Badge, ProgressRing, Skeleton, Tooltip, SearchModal, Toast)

**Files:**
- Create: `js/components/hero-carousel.js`
- Create: `js/components/dropdown.js`
- Create: `js/components/tabs.js`
- Create: `js/components/slider.js`
- Create: `js/components/toggle.js`
- Create: `js/components/avatar.js`
- Create: `js/components/badge.js`
- Create: `js/components/progress-ring.js`
- Create: `js/components/skeleton.js`
- Create: `js/components/tooltip.js`
- Create: `js/components/search-modal.js`
- Create: `js/components/toast.js`

**Interfaces:**
- Same pattern: `init()`, `render(props)`, `destroy()`; Carousel: `next()`, `prev()`, `goTo(i)`, `pause()`, `play()`; SearchModal: `open()`, `close()`, `setResults([])`

```text
- [ ] Step 1: hero-carousel.js — auto-rotate (5s), pause on hover/focus, indicators click, keyboard arrows, touch swipe, IntersectionObserver for lazy slides
- [ ] Step 2: dropdown.js — trigger click → menu, arrow keys, type-ahead filter, click outside close, position flip (popper-style)
- [ ] Step 3: tabs.js — keyboard arrows, home/end, aria-controls, animated indicator
- [ ] Step 4: slider.js — drag thumb, click track, keyboard arrows, tooltip value, vertical/horizontal
- [ ] Step 5: toggle.js — click/space/enter, animate thumb, sync with input[type=checkbox]
- [ ] Step 6: avatar.js — image load fallback to initials, editable → file input, crop preview (canvas)
- [ ] Step 7: badge.js — render from type + text, removable variant
- [ ] Step 8: progress-ring.js — SVG circle, animate stroke-dashoffset, size prop, label inside
- [ ] Step 9: skeleton.js — render placeholder matching component shape (tile, card, avatar, text lines)
- [ ] Step 10: tooltip.js — delay show (200ms), hide (100ms), position flip, follow cursor option
- [ ] Step 11: search-modal.js — Cmd/Ctrl+K open, full-screen, debounced search (data.games), keyboard nav results, Enter → navigate
- [ ] Step 12: toast.js — container (fixed), stack, types, auto-dismiss (4s), progress bar, pause on hover
- [ ] Step 13: Test each component in isolation
- [ ] Step 14: Commit
```

```bash
git add js/components/hero-carousel.js js/components/dropdown.js js/components/tabs.js js/components/slider.js js/components/toggle.js js/components/avatar.js js/components/badge.js js/components/progress-ring.js js/components/skeleton.js js/components/tooltip.js js/components/search-modal.js js/components/toast.js
git commit -m "feat: advanced components (carousel, dropdown, tabs, slider, toggle, avatar, badge, progress-ring, skeleton, tooltip, search, toast)"
```

---

### Task 9: Page Modules (Home, Library, Store, Game Detail, Profile, Settings)

**Files:**
- Create: `js/pages/home.js`
- Create: `js/pages/library.js`
- Create: `js/pages/store.js`
- Create: `js/pages/game-detail.js`
- Create: `js/pages/profile.js`
- Create: `js/pages/settings.js`

**Interfaces:**
- Each exports `render(params)`, `cleanup()`, `init()`; receives route params; mounts into `#app`; uses shared components + data.js

```text
- [ ] Step 1: home.js — HeroCarousel (featured games), QuickResumeRow (last 5 played), ContinuePlayingGrid (library, 4 cols), RecommendedGrid (store, filtered)
- [ ] Step 2: library.js — FilterBar (chips: All/Installed/Wishlist), SortDropdown, ViewToggle (Grid/List persisted), GameGrid (all user games), empty state
- [ ] Step 3: store.js — CategoryTabs (Featured/TopSellers/New/Deals/Genres), HeroBanner (promo), HorizontalScrollRows (TopSellers, NewReleases, OnSale), GenreChips filter
- [ ] Step 4: game-detail.js — Hero (cover, meta, actions), About, MediaCarousel (screenshots + video), Details (specs, achievements), RelatedRow, Reviews (mock)
- [ ] Step 5: profile.js — ProfileHeader (avatar, gamerscore, tier, bio), Tabs (Achievements/Stats/Friends/Activity), each tab renders component; AchievementGrid (ProgressRing), StatsCharts (canvas or simple bars), FriendsList, ActivityFeed
- [ ] Step 6: settings.js — Two-col: CategorySidebar + ContentPanel; categories: General/Display/Audio/Network/Privacy/Account/Accessibility; each panel uses Toggle, Slider, Dropdown, Button; persist to localStorage
- [ ] Step 7: Integrate — app.js imports all pages, router.onRoute calls page.render(params)
- [ ] Step 8: Test — navigate each route, verify render, interactions, deep links
- [ ] Step 9: Commit
```

```bash
git add js/pages/home.js js/pages/library.js js/pages/store.js js/pages/game-detail.js js/pages/profile.js js/pages/settings.js
git commit -m "feat: all 6 page modules with full feature implementations"
```

---

### Task 10: Gamepad Navigation & Keyboard Accessibility

**Files:**
- Modify: `js/utils/a11y.js` (extend)
- Create: `js/utils/gamepad.js`
- Modify: `js/app.js` (integrate)

**Interfaces:**
- Produces: `gamepad.init()`, `gamepad.onButton(callback)`, `gamepad.getState()`; maps D-pad→arrows, A→Enter, B→Escape, Start→Home, triggers focus movement in grids/carousels

```text
- [ ] Step 1: Write gamepad.js — Gamepad API polling (rAF), deadzone handling, button press detection (edge), axis → direction, emit custom events (gamepad-up, down, left, right, a, b, start)
- [ ] Step 2: Extend a11y.js — focusGrid(container, selector), focusCarousel(carousel), trapFocusRestored; integrate gamepad events → focus movement
- [ ] Step 3: Update app.js — call gamepad.init() on load, add global keydown handler for gamepad events
- [ ] Step 4: Test — connect gamepad (or simulate via DevTools), navigate all pages, verify focus visible, no trapped states
- [ ] Step 5: Commit
```

```bash
git add js/utils/gamepad.js js/utils/a11y.js js/app.js
git commit -m "feat: gamepad navigation + enhanced keyboard accessibility"
```

---

### Task 11: Image Assets & Placeholders

**Files:**
- Create: `img/placeholders/` (SVG placeholders for covers, heroes, avatars)
- Create: `img/icons/` (UI icons: Chevron, Search, Bell, User, Settings, Controller, Trophy, Heart, Share, Play, Plus, Minus, Check, X, Menu, Close, ArrowLeft, ArrowRight, Filter, Sort, Grid, List, Sun, Moon, Contrast, Accessibility)
- Create: `img/games/` (folder structure per game ID — placeholder SVGs)

**Interfaces:**
- Consumed by: GameTile, HeroCarousel, GameDetail, Avatar components via data.json URLs

```text
- [ ] Step 1: Create placeholder SVGs — cover (16:10, purple gradient + game icon), hero (16:9, dark purple + title), avatar (circle, initials), screenshot (16:9)
- [ ] Step 2: Create UI icons — 24×24 SVG, stroke=currentColor, viewBox 0 0 24 24
- [ ] Step 3: Generate game folder structure — mkdir -p img/games/{halo-infinite,forza-horizon-5,starfield,...}/ and place cover.svg, hero.svg, screenshot-1.svg
- [ ] Step 4: Update data/games.json — point to placeholder paths
- [ ] Step 5: Test — all images load, no 404s, lazy-loading works
- [ ] Step 6: Commit
```

```bash
git add img/
git commit -m "feat: image placeholders + UI icons + game asset structure"
```

---

### Task 12: PWA — Service Worker + Offline Support

**Files:**
- Create: `sw.js`
- Modify: `index.html` (register SW)
- Modify: `manifest.json` (verify icons)

**Interfaces:**
- SW: cache-first for static assets (HTML, CSS, JS, images, fonts), stale-while-revalidate for data.json, offline fallback (index.html)

```text
- [ ] Step 1: Write sw.js — install: cache shell (index.html, css/*, js/*, manifest.json, fonts); activate: clean old caches; fetch: cache-first for static, network-first for data, offline → index.html
- [ ] Step 2: Add SW registration in app.js (after load)
- [ ] Step 3: Generate PWA icons — 192×192, 512×512 from logo (purple gradient + "X" glyph), maskable
- [ ] Step 4: Test — Lighthouse PWA audit, offline mode in DevTools, "Add to Home Screen" prompt
- [ ] Step 5: Commit
```

```bash
git add sw.js index.html manifest.json
git commit -m "feat: PWA service worker + offline support + installable"
```

---

### Task 13: Performance Polish & Critical CSS Inlining

**Files:**
- Modify: `index.html` (inline critical CSS)
- Modify: `css/tokens.css`, `css/reset.css`, `css/layout.css` (identify critical)
- Create: `css/critical.css` (extracted)

**Interfaces:**
- Produces: Inlined critical CSS (< 14KB), deferred non-critical CSS via `<link rel="preload" as="style" onload="this.rel='stylesheet'">`

```text
- [ ] Step 1: Identify critical CSS — tokens (colors, spacing, type), reset, layout shell (header, sidebar, main, grid), hero carousel above-fold
- [ ] Step 2: Create critical.css (minified), inline in index.html <style>
- [ ] Step 3: Defer full CSS — preload + onload swap, noscript fallback
- [ ] Step 4: Add preload for hero images (first 2 slides), font files
- [ ] Step 5: Add resource hints — dns-prefetch, preconnect for fonts
- [ ] Step 6: Test — Lighthouse performance, verify LCP < 2.5s, CLS < 0.1, no render-blocking
- [ ] Step 7: Commit
```

```bash
git add index.html css/critical.css
git commit -m "perf: inline critical CSS, defer non-critical, preload hero assets"
```

---

### Task 14: Final QA, Cross-Device Testing & Documentation

**Files:**
- Create: `README.md`
- Verify: All tasks integrated

```text
- [ ] Step 1: Cross-device test — Chrome DevTools device toolbar: 320, 375, 414, 768, 820, 1024, 1280, 1440, 1920, 2560, 3840; verify no horizontal scroll, touch targets, text readable
- [ ] Step 2: Accessibility audit — axe-core (npm), Lighthouse Accessibility, manual keyboard/gamepad nav, screen reader (NVDA/VoiceOver) spot check
- [ ] Step 3: Browser test — Chrome, Firefox, Safari, Edge (latest); verify no console errors
- [ ] Step 4: Performance — Lighthouse: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 90, SEO ≥ 90, PWA ✅
- [ ] Step 5: Write README.md — project overview, file structure, dev server commands, deploy notes, customization guide
- [ ] Step 6: Final commit + tag
```

```bash
git add README.md
git commit -m "docs: README + final QA verification"
git tag -a v1.0.0 -m "Xbox Purple Gaming Dashboard v1.0.0"
```

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-xbox-purple-gaming-dashboard-plan.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native, because** the tasks are highly sequential (each depends on previous tokens/components), the codebase is greenfield with no legacy constraints, and a single context can hold the full design system — independent reviews would add cost without catching integration issues that only appear at the end.

**Does the plan capture what you want, and which approach should we use?**