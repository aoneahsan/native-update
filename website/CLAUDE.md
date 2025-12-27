# Website Project CLAUDE.md

## Project Info
- **Name:** Native Update Marketing Website & Dashboard
- **Type:** React + Vite + TypeScript SPA
- **Purpose:** Marketing site and user dashboard for Native Update plugin

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

## Key Directories
- `src/pages/` - Page components (auth, dashboard, marketing)
- `src/components/` - Reusable UI components
- `src/services/` - API services (auth, google-drive)
- `src/context/` - React contexts (AuthContext)
- `functions/` - Firebase Functions backend

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
