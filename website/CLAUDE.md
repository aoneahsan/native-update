# Website Project CLAUDE.md

## Project Info
- **Name:** Native Update Marketing Website & Dashboard
- **Type:** React + Vite + TypeScript SPA
- **Purpose:** Marketing site and user dashboard for Native Update plugin
- **URL:** https://nativeupdate.dev

## Dev Server Port
- **Port:** 5942
- **Preview Port:** 5943
- **Global Registry:** ~/.dev-ports.json (key: native-update-website)

## Tech Stack
- React 19 + TypeScript
- Vite 7 with Tailwind CSS v4
- Firebase Auth + Firestore
- Google Drive API integration
- Framer Motion for animations
- RadixUI components

## Key Directories
- `src/pages/` - Page components (auth, dashboard, marketing)
- `src/components/` - Reusable UI components
- `src/services/` - API services (auth, google-drive)
- `src/context/` - React contexts (AuthContext)
- `functions/` - Firebase Functions backend
- `public/` - Static assets (SVG icons, manifest, etc.)

## Commands
```bash
pnpm dev      # Start dev server on port 5942
pnpm build    # Production build
pnpm preview  # Preview build on port 5943
pnpm lint     # Run ESLint
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- Firebase config (VITE_FIREBASE_*)
- Google OAuth (VITE_GOOGLE_CLIENT_ID)

## 📄 Info Pages (CRITICAL - Keep Updated)

**All info pages MUST be updated when features change!**

### Required Pages
| Route | Page | Purpose | Last Updated |
|-------|------|---------|--------------|
| `/privacy` | PrivacyPage.tsx | GDPR/CCPA Privacy Policy | 2025-12-27 |
| `/terms` | TermsPage.tsx | Terms of Service | 2025-12-27 |
| `/security` | SecurityPage.tsx | Data Security info | 2025-12-27 |
| `/cookies` | CookiePolicyPage.tsx | Cookie Policy | 2025-12-27 |
| `/data-deletion` | DataDeletionPage.tsx | Account/Data Deletion | 2025-12-27 |
| `/about` | AboutPage.tsx | About the project | 2025-12-27 |
| `/contact` | ContactPage.tsx | Contact information | 2025-12-27 |

### Maintenance Triggers
Update these pages when:
1. **Privacy Policy**: New data collection, third-party integrations, cookie changes
2. **Terms of Service**: Service changes, new features, pricing changes
3. **Security Page**: New security measures, auth changes, encryption updates
4. **Cookie Policy**: New cookies added, tracking changes
5. **Data Deletion**: Process changes, timeline changes
6. **About Page**: Feature updates, milestone achievements
7. **Contact Page**: Contact info changes

### SEO Files
| File | Purpose | Update When |
|------|---------|-------------|
| `index.html` | Meta tags, structured data | Description changes |
| `public/manifest.json` | PWA manifest | Name/description changes |
| `public/favicon.svg` | Site icon | Branding changes |
| `public/og-image.svg` | Social share image | Branding changes |
| `public/apple-touch-icon.svg` | iOS icon | Branding changes |

### App Store Compliance
These pages are REQUIRED for app store submissions:
- ✅ Privacy Policy (Google Play, Apple App Store)
- ✅ Data Deletion page (Google Play requirement)
- ✅ Contact page with valid contact info
- ✅ Terms of Service

### Developer Contact (in all pages)
- **Name:** Ahsan Mahmood
- **Email:** aoneahsan@gmail.com
- **Phone/WhatsApp:** +923046619706
- **Website:** aoneahsan.com
- **LinkedIn:** linkedin.com/in/aoneahsan
- **Address:** https://zaions.com/address

## SVG Assets Rule
- ✅ All icons, logos, graphics use SVG format
- ✅ Optimized with minimal paths
- ❌ No PNG/JPG for icons or logos
