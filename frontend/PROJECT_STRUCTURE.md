# FoodFlow Project Structure Guide

## Complete Project Architecture

```
foodflow/
│
├── app/                                    # Next.js App Router
│   ├── layout.tsx                         # Root layout with theme provider
│   ├── globals.css                        # Global styles & design tokens
│   ├── page.tsx                           # Landing page
│   │
│   ├── signin/                            # Authentication
│   │   └── page.tsx                       # Sign-in page
│   │
│   ├── donor/                             # Donor role routes
│   │   ├── layout.tsx                     # Donor layout (sidebar + navbar)
│   │   ├── page.tsx                       # Dashboard
│   │   ├── profile/                       # User profile
│   │   │   └── page.tsx                   # Profile page
│   │   ├── settings/                      # User settings
│   │   │   └── page.tsx                   # Settings page
│   │   ├── listings/                      # View & manage donations
│   │   │   └── page.tsx                   # Listings page
│   │   ├── [id]/                          # Dynamic listing details
│   │   │   └── page.tsx                   # Listing detail page
│   │   ├── create/                        # Create new donation
│   │   │   └── page.tsx                   # Donation form
│   │   ├── claims/                        # Track claimed donations
│   │   │   └── page.tsx                   # Claims page
│   │   └── history/                       # Donation history
│   │       └── page.tsx                   # History page
│   │
│   ├── ngo/                               # NGO role routes
│   │   ├── layout.tsx                     # NGO layout
│   │   ├── page.tsx                       # Dashboard
│   │   ├── profile/                       # Organization profile
│   │   │   └── page.tsx                   # Profile page
│   │   ├── settings/                      # Operations settings
│   │   │   └── page.tsx                   # Settings page
│   │   ├── listings/                      # Available donations
│   │   │   └── page.tsx                   # Listings page
│   │   ├── routes/                        # Route planning
│   │   │   └── page.tsx                   # Route planning page
│   │   ├── claimed/                       # Claimed items
│   │   │   └── page.tsx                   # Claimed items page
│   │   └── forecasts/                     # Demand forecasting
│   │       └── page.tsx                   # Forecasts page
│   │
│   └── admin/                             # Admin role routes
│       ├── layout.tsx                     # Admin layout
│       ├── page.tsx                       # Dashboard
│       ├── profile/                       # Admin profile
│       │   └── page.tsx                   # Profile page
│       ├── settings/                      # System settings
│       │   └── page.tsx                   # Settings page
│       ├── users/                         # User management
│       │   └── page.tsx                   # Users page
│       ├── listings/                      # Content moderation
│       │   └── page.tsx                   # Listings moderation
│       ├── network/                       # Network analytics
│       │   └── page.tsx                   # Network page
│       ├── analytics/                     # Platform analytics
│       │   └── page.tsx                   # Analytics page
│       └── ml-insights/                   # ML model insights
│           └── page.tsx                   # ML insights page
│
├── components/                            # Reusable components
│   ├── layout/
│   │   ├── sidebar.tsx                    # Navigation sidebar
│   │   ├── top-navbar.tsx                 # Header/navbar
│   │   └── empty-state.tsx                # Empty state UI
│   │
│   ├── dashboard/
│   │   ├── kpi-card.tsx                   # KPI metrics display
│   │   ├── ai-insight-card.tsx            # AI recommendations
│   │   ├── listing-card.tsx               # Food listing card
│   │   └── activity-timeline.tsx          # Event timeline
│   │
│   ├── status/
│   │   └── status-badge.tsx               # Status indicators
│   │
│   ├── theme-provider.tsx                 # Dark mode provider
│   │
│   └── ui/                                # shadcn/ui components
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       ├── textarea.tsx
│       └── ...more components
│
├── lib/
│   └── utils.ts                           # Utility functions (cn classname)
│
├── public/                                # Static assets
│   ├── icon.svg                          # App icon
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── apple-icon.png
│
├── styles/
│   └── (imported in globals.css)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                     # CI/CD pipeline
│
├── .env.example                           # Environment variables template
├── .env.local                             # Local environment (git ignored)
├── .env.production                        # Production environment (git ignored)
│
├── .gitignore                             # Git ignore rules
├── .eslintrc.json                         # ESLint config
├── .prettierrc                            # Prettier config
│
├── tailwind.config.ts                     # Tailwind CSS config
├── next.config.mjs                        # Next.js config
├── tsconfig.json                          # TypeScript config
│
├── package.json                           # Dependencies
├── pnpm-lock.yaml                         # Lock file
│
├── README.md                              # Main documentation
├── PROJECT_STRUCTURE.md                   # This file
├── API.md                                 # API documentation
├── DEPLOYMENT.md                          # Deployment guide
├── CONTRIBUTING.md                        # Contributing guide
└── LICENSE                                # License file
```

## File Descriptions

### App Routes

| File | Purpose | Role | Features |
|------|---------|------|----------|
| `app/page.tsx` | Landing page | All | Feature showcase, role selector, CTA |
| `app/signin/page.tsx` | Authentication | All | Sign-in form, secure authentication |
| `app/donor/page.tsx` | Dashboard | Donor | KPIs, recent donations, AI insights |
| `app/donor/profile/page.tsx` | Profile | Donor | Personal & business info, stats |
| `app/donor/settings/page.tsx` | Settings | Donor | Notifications, delivery, security |
| `app/donor/listings/page.tsx` | Listings | Donor | View & manage donations |
| `app/donor/[id]/page.tsx` | Detail | Donor | Full donation view, claims |
| `app/donor/create/page.tsx` | Form | Donor | Multi-step donation creation |
| `app/donor/claims/page.tsx` | Claims | Donor | Track claimed donations |
| `app/donor/history/page.tsx` | History | Donor | Historical donations |
| `app/ngo/page.tsx` | Dashboard | NGO | Nearby items, capacity, metrics |
| `app/ngo/profile/page.tsx` | Profile | NGO | Organization info, stats |
| `app/ngo/settings/page.tsx` | Settings | NGO | Operations, team, AI optimization |
| `app/ngo/listings/page.tsx` | Listings | NGO | Available donations sorted by distance |
| `app/ngo/routes/page.tsx` | Routes | NGO | AI-optimized delivery routes |
| `app/ngo/claimed/page.tsx` | Claimed | NGO | Tracked pickup items |
| `app/ngo/forecasts/page.tsx` | Forecasts | NGO | Demand predictions |
| `app/admin/page.tsx` | Dashboard | Admin | Network metrics, top performers |
| `app/admin/profile/page.tsx` | Profile | Admin | Admin account & activity |
| `app/admin/settings/page.tsx` | Settings | Admin | System config, flags, alerts |
| `app/admin/users/page.tsx` | Users | Admin | User management table |
| `app/admin/listings/page.tsx` | Listings | Admin | Content moderation |
| `app/admin/network/page.tsx` | Network | Admin | Network health analytics |
| `app/admin/analytics/page.tsx` | Analytics | Admin | Platform-wide metrics |
| `app/admin/ml-insights/page.tsx` | ML | Admin | Model performance & insights |

### Core Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `layout/sidebar.tsx` | Main navigation | Layout wrapper with role-based menu |
| `layout/top-navbar.tsx` | Header bar | Page title, breadcrumbs, theme toggle |
| `layout/empty-state.tsx` | No data state | Display when no items exist |
| `dashboard/kpi-card.tsx` | Metric display | Show KPI with trend indicator |
| `dashboard/ai-insight-card.tsx` | AI recommendations | Display ML predictions & suggestions |
| `dashboard/listing-card.tsx` | Food item preview | Compact listing with actions |
| `dashboard/activity-timeline.tsx` | Event timeline | Sequential event display |
| `status/status-badge.tsx` | Status indicator | Visual status with colors |
| `theme-provider.tsx` | Dark mode | System-level theme management |

### Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js build & runtime config |
| `tailwind.config.ts` | Tailwind CSS design tokens |
| `tsconfig.json` | TypeScript compiler options |
| `.eslintrc.json` | Code linting rules |
| `.prettierrc` | Code formatting rules |
| `package.json` | Dependencies & scripts |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview & setup |
| `PROJECT_STRUCTURE.md` | This file - detailed architecture |
| `API.md` | API endpoints & documentation |
| `DEPLOYMENT.md` | Deployment guides & configs |
| `CONTRIBUTING.md` | Contribution guidelines |

## Design System Implementation

### Color Tokens (in app/globals.css)

```css
:root {
  /* Primary Brand Color */
  --primary: oklch(0.55 0.15 180);              /* Teal */
  --primary-foreground: oklch(0.99 0 0);         /* White text */

  /* Semantic Colors */
  --urgent: oklch(0.65 0.22 80);                 /* Amber - Time-sensitive */
  --destructive: oklch(0.55 0.2 25);             /* Red - Critical */
  --success: oklch(0.65 0.15 140);               /* Green - Positive */
  --logistics: oklch(0.55 0.15 250);             /* Blue - Logistics */

  /* Neutral Colors */
  --background: oklch(0.98 0.001 200);           /* Light background */
  --foreground: oklch(0.15 0.01 200);            /* Dark text */
  --border: oklch(0.9 0.005 200);                /* Subtle borders */
  --muted: oklch(0.88 0.01 200);                 /* Muted backgrounds */
}

.dark {
  --background: oklch(0.12 0.005 200);           /* Dark background */
  --foreground: oklch(0.92 0.005 200);           /* Light text */
  /* ... dark mode adjustments ... */
}
```

### Typography

- **Headings**: Geist Sans (weights: 500, 600, 700)
- **Body Text**: Geist Sans Regular (weight: 400)
- **Code**: Geist Mono (weight: 400)
- **Font Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px

### Spacing Scale

- **Base Unit**: 4px
- **Scale**: 4, 6, 8, 12, 16, 24, 32, 48, 64px
- **Gap Classes**: gap-2, gap-3, gap-4, gap-6, gap-8

### Border Radius

- **sm**: 2px (subtle)
- **md**: 4px (default)
- **lg**: 8px (cards, sections)
- **xl**: 12px (large components)

## Page Structure Pattern

All dashboard pages follow this pattern:

```typescript
'use client'

import { TopNavbar } from '@/components/layout/top-navbar'
import { Card } from '@/components/ui/card'

export default function FeaturePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <TopNavbar
        title="Page Title"
        breadcrumbs={[
          { label: 'Parent' },
          { label: 'Current' }
        ]}
      />

      {/* Main Content */}
      <main className="md:ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cards/Components */}
          </div>

          {/* Data Tables/Lists */}
          <Card>
            {/* Content */}
          </Card>
        </div>
      </main>
    </div>
  )
}
```

## Component Composition

### Sidebar Navigation Structure

```
Sidebar
├── Logo
├── Navigation Sections
│   ├── Main (Dashboard, Listings)
│   ├── Manage (Create, Settings, Profile)
│   ├── Analytics (Reports, History)
│   └── Admin (Users, Moderation, Config)
└── Footer (User menu, Settings)
```

### Data Flow

```
Page Component
├── Layout (Sidebar + Navbar)
├── Main Content Area
│   ├── Header/Breadcrumbs
│   ├── KPI Cards
│   ├── Dashboard Components
│   │   ├── Listing Cards
│   │   ├── Charts
│   │   └── Timelines
│   └── Data Tables
└── Modals/Dialogs (as needed)
```

## Role-Based Features

### Donor Routes & Features
- Dashboard with donation stats
- Create/manage listings
- Track claims & impact
- View donation history
- Profile & settings management
- Notification preferences

### NGO Routes & Features
- Dashboard with supply/demand
- Discover nearby donations
- Claim food items
- Route optimization
- Forecast demand trends
- Team & operations management

### Admin Routes & Features
- Platform-wide analytics
- User account management
- Content moderation
- System configuration
- Network monitoring
- ML model insights

## Responsive Breakpoints

```tailwind
sm: 640px
md: 768px (sidebar appears)
lg: 1024px
xl: 1280px
2xl: 1536px
```

## Performance Optimizations

1. **Code Splitting**: Route-based splitting with Next.js
2. **Image Optimization**: next/image for all images
3. **CSS-in-JS**: Tailwind for zero runtime overhead
4. **Server Components**: Default for better performance
5. **Lazy Loading**: Dynamic imports where needed

## Security Architecture

1. **Client-Side**: React security, XSS protection
2. **Server-Side**: Environment variables, secure headers
3. **API**: JWT tokens, CORS, rate limiting (backend)
4. **Database**: Encrypted connections, RLS (backend)
5. **Assets**: HTTPS, signed URLs, versioning

## Accessibility Features

- Semantic HTML throughout
- ARIA labels and roles
- Keyboard navigation
- Color contrast compliance
- Screen reader optimization
- Focus management
- Skip links on pages

## Scaling Considerations

### Frontend
- Optimize bundle size
- Implement code splitting
- Use service workers for caching
- CDN for assets
- Image optimization

### Backend (When Implemented)
- Database indexing
- Query optimization
- Caching layer (Redis)
- Horizontal scaling
- Load balancing
- Read replicas

## Deployment Architecture

```
Domain → CDN (Cloudflare)
    ↓
Load Balancer (Nginx)
    ↓
App Servers (Multiple)
    ↓
Database (PostgreSQL)
    ↓
Cache Layer (Redis)
```

## Development Workflow

1. **Local Development**
   ```bash
   pnpm dev
   ```

2. **Code Quality**
   ```bash
   pnpm lint
   pnpm format
   ```

3. **Testing** (When implemented)
   ```bash
   pnpm test
   ```

4. **Building**
   ```bash
   pnpm build
   pnpm start
   ```

5. **Deployment**
   - Push to main branch
   - GitHub Actions triggers CI/CD
   - Tests run
   - Build succeeds
   - Deploy to Vercel

---

This comprehensive structure provides a solid foundation for FoodFlow's growth and is ready for backend integration.
