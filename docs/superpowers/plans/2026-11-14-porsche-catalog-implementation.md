# Porsche Car Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality Porsche vehicle catalog with Next.js 14+ App Router (UI) + Pages Router (API), TypeScript, Tailwind CSS, shadcn/ui, and local TypeScript data with ISR.

**Architecture:** Hybrid App/Pages Router - Server Components for catalog UI, Client Components for interactivity (gallery, forms, filters), Pages Router API route for lead capture. Local TypeScript data files with ISR revalidation. shadcn/ui for accessible component primitives with custom Porsche theming.

**Tech Stack:** Next.js 14.2+, React 18, TypeScript 5, Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), React Hook Form + Zod, next/font (Inter), next/image, Framer Motion (gallery), ESLint + Prettier.

**Spec:** docs/superpowers/specs/2026-11-14-porsche-catalog-design.md

## Global Constraints

- Next.js 14.2+ with App Router (UI) + Pages Router (API routes)
- TypeScript strict mode, no `any`
- Tailwind CSS + shadcn/ui components only (no other UI libraries)
- Local TypeScript data files (`src/lib/data/vehicles.ts`) with ISR (`revalidate: 3600`)
- Vercel-ready deployment (static export compatible where possible)
- WCAG 2.1 AA accessibility (semantic HTML, ARIA, contrast, keyboard nav)
- Porsche brand colors: Guards Red (#C8102E), GT Silver (#9DA0A4), Jet Black (#1A1A1A), Carrara White (#F5F5F0), Chalk (#E8E8E8)
- Inter font via `next/font` with `display: swap`
- ESLint (Next.js core-web-vitals) + Prettier
- React Hook Form + Zod for form validation
- Framer Motion only for image gallery animations

## Review Focus

| Input/Condition | Expected Behavior | Test Location |
|-----------------|-------------------|---------------|
| Missing/invalid vehicle slug in `/models/[slug]` | 404 page, not 500 | Task 5 |
| Inquiry form submitted with invalid email | Inline validation error, no submit | Task 9 |
| Inquiry form submitted with valid data | Success toast, data posted to API | Task 9 |
| Filter URL params synced with UI state | Shareable/filterable URLs work | Task 6 |
| Image gallery keyboard navigation | Arrow keys navigate, Escape closes | Task 7 |
| Mobile viewport (< 640px) | All content accessible, no horizontal scroll | Task 3, 4, 5 |
| Slow 3G network | Hero image prioritized, others lazy | Task 2 |
| Screen reader on model detail page | Specs table announced correctly | Task 5 |

---

### Task 1: Project Setup & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`

**Interfaces:**
- Consumes: (none - first task)
- Produces: `cn()` utility, Tailwind config with Porsche theme, Next.js config with image domains, TypeScript path aliases

- [ ] **Step 1: Write failing test for utils**

```typescript
// src/lib/utils.test.ts
import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('base', 'override')).toBe('base override')
  })
  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
  })
  it('merges Tailwind conflicts (tailwind-merge)', () => {
    expect(cn('p-2 p-4')).toBe('p-4')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/utils.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement project config files**

Create all config files with:
- `package.json`: Next.js 14.2, React 18, TypeScript 5, Tailwind 3.4, shadcn/ui deps, React Hook Form, Zod, Framer Motion, next/font, testing lib
- `tsconfig.json`: strict mode, path aliases (@/*), next.js plugin
- `next.config.js`: images.remotePatterns for placeholder images, experimental.turbo
- `tailwind.config.ts`: Porsche colors, Inter font, custom spacing, border radius, shadows, content paths
- `src/lib/utils.ts`: `cn()` using `clsx` + `tailwind-merge`
- `src/app/globals.css`: Tailwind directives, CSS variables for theme, base styles

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/utils.test.ts`
Expected: PASS

- [ ] **Step 5: Install shadcn/ui base components**

Run: `npx shadcn@latest init` (defaults), then `npx shadcn@latest add button card input label textarea select separator sheet dialog toast`
Expected: Components in `src/components/ui/`

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: project setup with Next.js, Tailwind, shadcn/ui, Porsche theme"
```

---

### Task 2: Type Definitions & Vehicle Data

**Files:**
- Create: `src/types/vehicle.ts`
- Create: `src/lib/data/vehicles.ts`
- Create: `src/lib/data/vehicle-utils.ts`
- Create: `src/lib/data/vehicles.test.ts`

**Interfaces:**
- Consumes: Task 1 (utils, config)
- Produces: `Vehicle`, `VehicleSpecs`, `SEOData` types, `vehicles` array, `getVehicleBySlug()`, `getVehiclesByModel()`, `filterVehicles()` functions

- [ ] **Step 1: Write failing tests for data layer**

```typescript
// src/lib/data/vehicles.test.ts
import { vehicles, getVehicleBySlug, filterVehicles } from './vehicles'

describe('Vehicle data', () => {
  it('has at least 12 vehicles across 6 model lines', () => {
    expect(vehicles.length).toBeGreaterThanOrEqual(12)
    const models = new Set(vehicles.map(v => v.model))
    expect(models.size).toBeGreaterThanOrEqual(6)
  })
  it('each vehicle has required fields', () => {
    vehicles.forEach(v => {
      expect(v.id).toBeTruthy()
      expect(v.slug).toMatch(/^[a-z0-9-]+$/)
      expect(v.price).toBeGreaterThan(0)
      expect(v.images.length).toBeGreaterThan(0)
    })
  })
  it('getVehicleBySlug returns correct vehicle', () => {
    const v = getVehicleBySlug(vehicles[0].slug)
    expect(v).toEqual(vehicles[0])
  })
  it('getVehicleBySlug returns undefined for unknown slug', () => {
    expect(getVehicleBySlug('non-existent')).toBeUndefined()
  })
  it('filterVehicles filters by model', () => {
    const result = filterVehicles({ model: '911' })
    expect(result.every(v => v.model === '911')).toBe(true)
  })
  it('filterVehicles filters by price range', () => {
    const result = filterVehicles({ minPrice: 100000, maxPrice: 200000 })
    expect(result.every(v => v.price >= 100000 && v.price <= 200000)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/data/vehicles.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement types and data**

Create `src/types/vehicle.ts` with exact interfaces from spec.
Create `src/lib/data/vehicles.ts` with 15 vehicles:
- 911: Carrera S, Turbo S, GT3 (3)
- Taycan: Turbo, 4S, GTS (3)
- Cayenne: S, Turbo GT, E-Hybrid (3)
- Macan: S, GTS, Turbo (3)
- Panamera: 4S, Turbo S, GTS (3)
- 718: Cayman GTS, Boxster Spyder (2)

Each with: id, slug, model, variant, year, price, images (placeholder URLs), specs, features, availability, description, seo.

Create `src/lib/data/vehicle-utils.ts` with filter/sort helpers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/data/vehicles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types src/lib/data
git commit -m "feat: vehicle types and data layer with 15 Porsche models"
```

---

### Task 3: Layout Components (Header, Footer, Navigation)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/Navigation.tsx`
- Create: `src/components/layout/MobileMenu.tsx`
- Create: `src/components/layout/Layout.tsx`
- Create: `src/components/layout/__tests__/Header.test.tsx`
- Modify: `src/app/layout.tsx` (wrap with Layout)

**Interfaces:**
- Consumes: Task 1 (UI components, utils), Task 2 (vehicle types for nav links)
- Produces: `Header`, `Footer`, `Navigation`, `MobileMenu`, `Layout` components

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/layout/__tests__/Header.test.tsx
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

describe('Header', () => {
  it('renders Porsche logo', () => {
    render(<Header />)
    expect(screen.getByRole('img', { name: /porsche/i })).toBeInTheDocument()
  })
  it('renders navigation links', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /models/i })).toBeInTheDocument()
  })
  it('opens mobile menu on hamburger click', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    expect(screen.getByRole('link', { name: /models/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/__tests__/Header.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement layout components**

- `Header.tsx`: Sticky, Porsche logo (SVG), desktop nav (Models, Configurator, Owners, Find Dealer), CTA button (Contact), hamburger for mobile
- `Navigation.tsx`: Desktop nav links with hover states
- `MobileMenu.tsx`: Sheet/Drawer from shadcn/ui, same links + CTA
- `Footer.tsx`: 4 columns (Models, Company, Support, Legal), newsletter signup, social icons, copyright
- `Layout.tsx`: Server Component wrapper with Header, main, Footer
- Update `src/app/layout.tsx` to use Layout component

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/__tests__/Header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/app/layout.tsx
git commit -m "feat: layout components (Header, Footer, Navigation, MobileMenu)"
```

---

### Task 4: Home/Landing Page (`/`)

**Files:**
- Create: `src/app/(catalog)/page.tsx`
- Create: `src/components/catalog/HeroSection.tsx`
- Create: `src/components/catalog/FeaturedModels.tsx`
- Create: `src/components/catalog/BrandStory.tsx`
- Create: `src/components/catalog/CTASection.tsx`
- Create: `src/components/catalog/__tests__/HeroSection.test.tsx`

**Interfaces:**
- Consumes: Task 1 (layout), Task 2 (vehicles data), Task 3 (Layout wrapper)
- Produces: Home page with Hero, Featured Models (3), Brand Story, CTA

- [ ] **Step 1: Write failing test**

```typescript
// src/components/catalog/__tests__/HeroSection.test.tsx
import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  it('renders headline and subheadline', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/porsche/i)
    expect(screen.getByText(/experience/i)).toBeInTheDocument()
  })
  it('renders CTA button linking to /models', () => {
    render(<HeroSection />)
    const link = screen.getByRole('link', { name: /explore models/i })
    expect(link).toHaveAttribute('href', '/models')
  })
  it('hero image has priority loading', () => {
    render(<HeroSection />)
    const img = screen.getByRole('img', { name: /porsche/i })
    expect(img).toHaveAttribute('priority')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/catalog/__tests__/HeroSection.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement home page components**

- `HeroSection.tsx`: Full-viewport hero with headline "Engineered for Icons", subheadline, CTA to /models, background image (Next.js Image with `priority`, `fill`, `sizes="100vw"`)
- `FeaturedModels.tsx`: Server Component - picks 3 flagship vehicles (911 Turbo S, Taycan Turbo, Cayenne Turbo GT), renders as VehicleCard grid
- `BrandStory.tsx`: Two-column section with Porsche heritage copy + image
- `CTASection.tsx`: Dark background, "Ready to Configure?" heading, button to /models
- `page.tsx`: Server Component composing all sections in Layout

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/catalog/__tests__/HeroSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(catalog\)/page.tsx src/components/catalog
git commit -m "feat: home page with hero, featured models, brand story, CTA"
```

---

### Task 5: Model Listing Page (`/models`) with Filters

**Files:**
- Create: `src/app/(catalog)/models/page.tsx`
- Create: `src/app/(catalog)/models/layout.tsx`
- Create: `src/components/catalog/VehicleCard.tsx`
- Create: `src/components/catalog/VehicleGrid.tsx`
- Create: `src/components/catalog/FilterSidebar.tsx`
- Create: `src/components/catalog/FilterChips.tsx`
- Create: `src/components/catalog/__tests__/VehicleCard.test.tsx`
- Create: `src/components/catalog/__tests__/FilterSidebar.test.tsx`
- Create: `src/hooks/use-filters.ts`

**Interfaces:**
- Consumes: Task 2 (vehicles, filterVehicles), Task 3 (Layout)
- Produces: Filterable, paginated model listing with URL-synced state

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/catalog/__tests__/VehicleCard.test.tsx
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '../VehicleCard'
import { vehicles } from '@/lib/data/vehicles'

describe('VehicleCard', () => {
  it('renders model, variant, price, and image', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByText(vehicles[0].model)).toBeInTheDocument()
    expect(screen.getByText(vehicles[0].variant)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(vehicles[0].price.toLocaleString()))).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
  it('links to model detail page', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', `/models/${vehicles[0].slug}`)
  })
  it('shows availability badge', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByText(/in.stock/i)).toBeInTheDocument()
  })
})

// src/components/catalog/__tests__/FilterSidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterSidebar } from '../FilterSidebar'

describe('FilterSidebar', () => {
  it('renders model filter with all 6 models', () => {
    render(<FilterSidebar />)
    expect(screen.getByRole('combobox', { name: /model/i })).toBeInTheDocument()
  })
  it('renders price range slider', () => {
    render(<FilterSidebar />)
    expect(screen.getByRole('slider', { name: /price/i })).toBeInTheDocument()
  })
  it('updates URL on filter change', () => {
    render(<FilterSidebar />)
    fireEvent.click(screen.getByRole('combobox', { name: /model/i }))
    fireEvent.click(screen.getByText('911'))
    expect(window.location.search).toContain('model=911')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/catalog/__tests__/VehicleCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement model listing page**

- `use-filters.ts`: Custom hook using `useSearchParams` + `useRouter` for URL-synced filter state (model, year, price range, body style, availability)
- `VehicleCard.tsx`: Server Component - image, model, variant, year, price, availability badge, link to detail
- `VehicleGrid.tsx`: Server Component - maps filtered vehicles to VehicleCard grid (responsive: 1/2/3 cols)
- `FilterSidebar.tsx`: Client Component - Select (model), Slider (price), Checkboxes (body style, availability), Clear button
- `FilterChips.tsx`: Client Component - shows active filters as removable chips
- `page.tsx`: Server Component - reads searchParams, calls filterVehicles(), passes to VehicleGrid + FilterSidebar
- `layout.tsx`: Adds sidebar wrapper for catalog pages

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/catalog/__tests__/VehicleCard.test.tsx src/components/catalog/__tests__/FilterSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(catalog\)/models src/components/catalog/VehicleCard.tsx src/components/catalog/VehicleGrid.tsx src/components/catalog/FilterSidebar.tsx src/components/catalog/FilterChips.tsx src/hooks/use-filters.ts
git commit -m "feat: model listing page with URL-synced filters"
```

---

### Task 6: Model Detail Page (`/models/[slug]`)

**Files:**
- Create: `src/app/(catalog)/models/[slug]/page.tsx`
- Create: `src/app/(catalog)/models/[slug]/not-found.tsx`
- Create: `src/components/catalog/VehicleGallery.tsx`
- Create: `src/components/catalog/SpecsTable.tsx`
- Create: `src/components/catalog/FeaturesList.tsx`
- Create: `src/components/catalog/InquiryForm.tsx`
- Create: `src/components/catalog/__tests__/VehicleGallery.test.tsx`
- Create: `src/components/catalog/__tests__/SpecsTable.test.tsx`
- Create: `src/components/catalog/__tests__/InquiryForm.test.tsx`

**Interfaces:**
- Consumes: Task 2 (getVehicleBySlug, Vehicle type), Task 3 (Layout), Task 5 (filter context for "back to results")
- Produces: Full detail page with gallery, specs, features, inquiry form

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/catalog/__tests__/VehicleGallery.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleGallery } from '../VehicleGallery'
import { vehicles } from '@/lib/data/vehicles'

describe('VehicleGallery', () => {
  it('renders main image and thumbnails', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    expect(screen.getByRole('img', { name: /main/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /thumbnail/i })).toHaveLength(vehicles[0].images.length)
  })
  it('navigates with arrow keys', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    const main = screen.getByRole('img', { name: /main/i })
    fireEvent.keyDown(main, { key: 'ArrowRight' })
    // Verify image src changed
  })
  it('opens fullscreen on click', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    fireEvent.click(screen.getByRole('img', { name: /main/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

// src/components/catalog/__tests__/InquiryForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InquiryForm } from '../InquiryForm'

describe('InquiryForm', () => {
  it('shows validation errors for empty submit', async () => {
    render(<InquiryForm vehicleSlug="test" />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
  })
  it('submits valid form and shows success', async () => {
    render(<InquiryForm vehicleSlug="test" />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-1234' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Interested in test drive' } })
    fireEvent.click(screen.getByLabelText(/consent/i))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/catalog/__tests__/VehicleGallery.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement model detail page**

- `page.tsx`: Server Component - `generateStaticParams` from all vehicle slugs, fetches vehicle via `getVehicleBySlug`, returns 404 if not found, composes Gallery, SpecsTable, FeaturesList, InquiryForm
- `not-found.tsx`: Custom 404 with link back to /models
- `VehicleGallery.tsx`: Client Component - Framer Motion carousel, thumbnail strip, keyboard navigation (arrows), fullscreen modal (Dialog), swipe support on mobile
- `SpecsTable.tsx`: Server Component - accessible `<table>` with `<thead>`/`<tbody>`, grouped sections (Performance, Dimensions, Efficiency), proper scope attributes
- `FeaturesList.tsx`: Server Component - grid of feature cards with icons
- `InquiryForm.tsx`: Client Component - React Hook Form + Zod schema (name, email, phone, preferredContact, message, consent), toast on success/error, honeypot field

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/catalog/__tests__/VehicleGallery.test.tsx src/components/catalog/__tests__/SpecsTable.test.tsx src/components/catalog/__tests__/InquiryForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(catalog\)/models/\[slug\] src/components/catalog/VehicleGallery.tsx src/components/catalog/SpecsTable.tsx src/components/catalog/FeaturesList.tsx src/components/catalog/InquiryForm.tsx
git commit -m "feat: model detail page with gallery, specs, features, inquiry form"
```

---

### Task 7: API Route - Lead Capture (`/api/inquiry`)

**Files:**
- Create: `src/app/api/inquiry/route.ts`
- Create: `src/lib/validations/inquiry.ts`
- Create: `src/lib/email.ts` (mock)
- Create: `src/app/api/inquiry/__tests__/route.test.ts`

**Interfaces:**
- Consumes: Task 6 (InquiryForm submission), Task 1 (Zod, utils)
- Produces: POST endpoint accepting inquiry data, validating, storing/emailing, returning success

- [ ] **Step 1: Write failing test**

```typescript
// src/app/api/inquiry/__tests__/route.test.ts
import { POST } from '../route'
import { NextRequest } from 'next/server'

describe('POST /api/inquiry', () => {
  it('rejects invalid email', async () => {
    const req = new NextRequest('http://localhost/api/inquiry', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'invalid', phone: '', message: '', vehicleSlug: '911-carrera-s', consent: true })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.errors).toHaveProperty('email')
  })
  it('accepts valid inquiry', async () => {
    const req = new NextRequest('http://localhost/api/inquiry', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@example.com', phone: '555-1234', message: 'Test drive', vehicleSlug: '911-carrera-s', consent: true })
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
  it('rejects missing consent', async () => {
    const req = new NextRequest('http://localhost/api/inquiry', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@example.com', phone: '', message: '', vehicleSlug: '911-carrera-s', consent: false })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
  it('rate limits by IP (basic)', async () => {
    // Send 6 requests rapidly, 6th should be 429
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/inquiry/__tests__/route.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement API route**

- `inquiry.ts` (validations): Zod schema matching InquiryForm fields
- `email.ts`: Mock email function (console.log in dev, Resend/SendGrid in prod)
- `route.ts`: Pages Router style API route (or App Router route handler) - validates with Zod, checks honeypot, rate limits by IP (in-memory Map), calls email function, returns JSON

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/inquiry/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/inquiry src/lib/validations src/lib/email.ts
git commit -m "feat: inquiry API route with validation, rate limiting, email"
```

---

### Task 8: SEO, Metadata & Performance Polish

**Files:**
- Modify: `src/app/(catalog)/page.tsx` (add metadata)
- Modify: `src/app/(catalog)/models/page.tsx` (add metadata)
- Modify: `src/app/(catalog)/models/[slug]/page.tsx` (add generateMetadata)
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/components/seo/JsonLd.tsx`
- Create: `src/components/seo/__tests__/JsonLd.test.tsx`

**Interfaces:**
- Consumes: Task 2 (Vehicle SEO data), Task 4-6 (pages)
- Produces: Dynamic metadata, Open Graph, Twitter cards, JSON-LD structured data, sitemap, robots.txt

- [ ] **Step 1: Write failing test**

```typescript
// src/components/seo/__tests__/JsonLd.test.tsx
import { render, screen } from '@testing-library/react'
import { JsonLd } from '../JsonLd'
import { vehicles } from '@/lib/data/vehicles'

describe('JsonLd', () => {
  it('renders Product schema for vehicle', () => {
    render(<JsonLd vehicle={vehicles[0]} />)
    const script = screen.getByTestId('json-ld')
    const data = JSON.parse(script.textContent!)
    expect(data['@type']).toBe('Product')
    expect(data.name).toContain(vehicles[0].model)
    expect(data.offers.price).toBe(vehicles[0].price)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/seo/__tests__/JsonLd.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement SEO**

- Each page: `generateMetadata` returning title, description, Open Graph, Twitter, alternates
- Model detail: `generateMetadata` from vehicle.seo + JSON-LD Product schema
- `JsonLd.tsx`: Client Component rendering `<script type="application/ld+json">` with Product schema
- `sitemap.ts`: Dynamic sitemap with all vehicle URLs + /models, lastmod from vehicle data
- `robots.ts`: Allow all, sitemap reference

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/seo/__tests__/JsonLd.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(catalog\) src/app/sitemap.ts src/app/robots.ts src/components/seo
git commit -m "feat: SEO metadata, JSON-LD, sitemap, robots.txt"
```

---

### Task 9: Accessibility Audit & Final Polish

**Files:**
- Modify: Multiple components (add ARIA, fix contrast, focus styles)
- Create: `src/app/globals.css` (add focus-visible, skip link, reduced motion)
- Create: `a11y-test.ts` (axe-core integration test)

**Interfaces:**
- Consumes: All previous tasks
- Produces: WCAG 2.1 AA compliant site

- [ ] **Step 1: Run automated a11y audit**

Run: `npx @axe-core/cli http://localhost:3000` (after `npm run dev`)
Expected: 0 violations

- [ ] **Step 2: Manual keyboard navigation test**

Navigate entire site with Tab/Shift+Tab/Enter/Space/Arrows
Expected: All interactive elements reachable, focus visible, logical order

- [ ] **Step 3: Screen reader test (NVDA/VoiceOver)**

Navigate key pages
Expected: Landmarks announced, images have alt, forms labeled, tables structured

- [ ] **Step 4: Fix any violations**

- Add skip-to-main link in Layout
- Ensure all images have meaningful alt (not filename)
- Form labels associated with inputs
- Color contrast ≥ 4.5:1 (check Guards Red on white)
- Focus indicators visible (not outline-none)
- Reduced motion respected for animations

- [ ] **Step 5: Performance audit**

Run: `npm run build && npx lighthouse http://localhost:3000 --view`
Expected: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: accessibility fixes and performance polish"
```

---

### Task 10: Build Verification & Deployment Prep

**Files:**
- Modify: `next.config.js` (output: 'standalone' for Docker, or static export config)
- Create: `vercel.json` (if needed)
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**
- Consumes: All tasks
- Produces: Production-ready build, deployment config, documentation

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: Compiles without errors, generates static pages for ISR routes

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Lint & format**

Run: `npm run lint && npm run format:check`
Expected: 0 errors

- [ ] **Step 4: Test suite**

Run: `npm test -- --coverage`
Expected: All tests pass, coverage ≥ 80% on lib/components

- [ ] **Step 5: Create deployment files**

- `.env.example`: EMAIL_API_KEY, RESEND_API_KEY, etc.
- `vercel.json`: ISR config, headers
- `README.md`: Setup, dev commands, deploy, project structure

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: production build verified, deployment ready"
```

---

## Execution Recommendation

**Recommendation: Native execution** — The tasks have clear sequential dependencies (each builds on the previous), well-defined interfaces, and the plan is detailed enough for single-session implementation. Subagent-driven would add overhead without benefit since the interfaces are locked in this plan. A single fresh reviewer at the end (superpowers:requesting-code-review) will catch integration issues.

**Estimated effort:** 10 tasks × ~30-45 min each = 5-7 hours total