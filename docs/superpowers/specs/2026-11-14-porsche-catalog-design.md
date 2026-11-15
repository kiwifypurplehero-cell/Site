# Porsche Car Catalog - Design Document

## Intent & Why
Build a production-quality Porsche vehicle catalog that demonstrates senior frontend engineering: clean architecture, type safety, performance, accessibility, and maintainable code patterns. Serves as both a functional lead-gen tool and a portfolio piece.

## Goals
- **Lead Generation**: Inquiry forms per vehicle, test drive booking, contact capture
- **Brand Showcase**: Premium visual experience with Porsche design language
- **Inventory Sales**: Filterable catalog with detailed specs, pricing, availability
- **Learning/Portfolio**: Demonstrate modern Next.js, TypeScript, Tailwind, shadcn/ui patterns

## Non-Goals
- User accounts/authentication
- Payment processing
- Real-time inventory sync
- Admin CMS interface

## Anti-Goals
- Over-engineered state management (no Redux/Zustand needed)
- Heavy client-side JS (prioritize Server Components)
- Generic templates (must feel distinctly Porsche)

## Constraints
- Next.js 14+ with App Router (UI) + Pages Router (API)
- TypeScript strict mode
- Tailwind CSS + shadcn/ui components
- Local TypeScript data files with ISR revalidation
- Vercel-ready deployment
- WCAG 2.1 AA accessibility

## Approaches Considered

| Approach | Trade-off | Decision |
|----------|-----------|----------|
| **App Router + RSC** vs Pages Router | Modern patterns vs mature API routes | **Hybrid**: App Router for UI, Pages for API/forms |
| **Local TS data** vs Headless CMS vs Mock API | Type-safe/versioned vs real CMS vs backend simulation | **Local TS + ISR** - portfolio-friendly, zero deps |
| **Custom Design System** vs shadcn/ui vs Pure Tailwind | Brand control vs speed vs CSS mastery | **shadcn/ui** - accessible, customizable, production-proven |

## Technical Architecture

### Project Structure
```
/workspaces/Site
├── src/
│   ├── app/                    # App Router (UI)
│   │   ├── (catalog)/         # Route group for catalog pages
│   │   │   ├── page.tsx       # Home/Landing
│   │   │   ├── models/        # Model listing + filters
│   │   │   │   └── [slug]/    # Model detail page
│   │   │   └── layout.tsx     # Catalog layout
│   │   ├── api/               # API routes (Pages Router style)
│   │   │   └── inquiry/       # Lead capture endpoint
│   │   ├── globals.css        # Global styles + Tailwind
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── catalog/           # Catalog-specific components
│   │   ├── layout/            # Header, Footer, Navigation
│   │   └── forms/             # Inquiry, Test Drive forms
│   ├── lib/
│   │   ├── data/              # Vehicle data (TypeScript)
│   │   ├── utils.ts           # cn(), formatters, helpers
│   │   └── validations.ts     # Zod schemas
│   ├── types/                 # TypeScript interfaces
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
├── tailwind.config.ts         # Porsche theme configuration
├── next.config.js
└── package.json
```

### Data Model (TypeScript)
```typescript
// src/lib/data/vehicles.ts
interface Vehicle {
  id: string;
  slug: string;
  model: string;           // "911", "Taycan", "Cayenne", "Macan", "Panamera", "718"
  variant: string;         // "Carrera S", "Turbo", "GTS", etc.
  year: number;
  price: number;           // Base MSRP in USD
  currency: 'USD';
  images: string[];        // Optimized Next.js Image paths
  specs: VehicleSpecs;
  features: string[];      // Key selling points
  availability: 'in-stock' | 'pre-order' | 'sold';
  description: string;     // Marketing copy
  seo: SEOData;
}

interface VehicleSpecs {
  engine: string;
  power: string;           // "473 hp"
  torque: string;          // "420 lb-ft"
  transmission: string;    // "8-speed PDK"
  drivetrain: string;      // "AWD", "RWD"
  acceleration: string;    // "0-60 in 3.5s"
  topSpeed: string;        // "191 mph"
  fuelEconomy: string;     // "18/24 MPG" or "MPGe"
  dimensions: Dimensions;
}

interface Dimensions {
  length: string;
  width: string;
  height: string;
  wheelbase: string;
  weight: string;
}
```

### Pages & Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Server Component | Hero, featured models, brand story, CTA |
| `/models` | Server Component | Filterable grid (model, year, price, body style) |
| `/models/[slug]` | Server Component + Client | Detail page: gallery, specs, features, inquiry form |
| `/api/inquiry` | API Route (Pages) | POST handler for lead capture, validation, email |

### Key Components
- **VehicleCard** - Listing grid item (Server Component)
- **VehicleGallery** - Image carousel with zoom (Client Component)
- **SpecsTable** - Accessible specification table (Server)
- **InquiryForm** - React Hook Form + Zod (Client)
- **FilterSidebar** - URL-synced filters (Client + Server)
- **Header/Navigation** - Sticky, mobile-responsive (Client)
- **Footer** - Links, newsletter, legal (Server)

### Design System (Tailwind Config)
- **Colors**: Porsche palette - Guards Red (#C8102E), GT Silver (#9DA0A4), Jet Black (#1A1A1A), Carrara White (#F5F5F0), Chalk (#E8E8E8)
- **Typography**: Inter (UI) + custom display font for headlines
- **Spacing**: 4px base unit, consistent scale
- **Border Radius**: 4px (cards), 8px (modals), full (buttons)
- **Shadows**: Subtle elevation system
- **Animations**: Framer Motion for gallery, form transitions

### Performance Strategy
- **ISR**: `revalidate: 3600` on model pages, `60` on listing
- **Images**: Next.js Image with `priority` on hero, `fill` on gallery
- **Fonts**: `next/font` with `display: swap`, preload
- **Scripts**: Third-party only on demand (analytics, chat)
- **Bundle**: Analyze with `@next/bundle-analyzer`

### Accessibility
- Semantic HTML5 (`<main>`, `<section>`, `<article>`, `<aside>`)
- ARIA labels on interactive elements
- Focus management in modals/gallery
- Color contrast ratios ≥ 4.5:1
- Keyboard navigation throughout
- Screen reader announcements for filter changes

### Form Handling (Lead Gen)
- **React Hook Form** + **Zod** validation
- **Server Action** or **Pages API Route** for submission
- **Honeypot** + **Rate limiting** (basic)
- **Toast notifications** for success/error
- **Data**: Name, Email, Phone, Model Interest, Message, Consent

## What's Left to Builder
- Exact vehicle dataset (provide 12-15 models across 6 model lines)
- Image assets (use placeholder service or Porsche press kit)
- Email service integration (Resend, SendGrid, or mock)
- Analytics (Vercel Analytics, GA4, or Plausible)
- Deployment target (Vercel recommended)

## Approval
**Approach**: Hybrid App/Pages Router, Local TS data + ISR, shadcn/ui + Porsche theme
**Scope**: 4 pages, ~15 components, API route, design system
**Estimated**: 2-3 sessions for full implementation

---

**Ready to proceed?** Reply "approved" and I'll invoke the implementation plan.