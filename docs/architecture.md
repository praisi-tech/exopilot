# Exopilot Monorepo System Architecture Specification

## 1. Directory Structure
Exopilot is structured as a highly scalable production-grade TypeScript and Go monorepo:
```
exopilot/
├── apps/
│   ├── web/          # Next.js App Router (Port 3000)
│   └── api/          # Go API Monolith (Port 8080)
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── docs/             # PRD & Architecture specs
└── scripts/          # Dev concurrent runners
```

## 2. Shared Types Package (`packages/shared-types`)
- Orchestrates static TypeScript types for core models: Inquiries, Shipments, Suppliers, Commodities, Notes, and Dashboard Summaries.
- Built using strict `tsc` compiler configurations compilation into `dist/` declarations, allowing zero-overhead import mappings via `npm workspaces` standard symlinking.

## 3. Go API Monolith (`apps/api`)
- Written in pure, highly-concurrent standard library Go.
- Implements thread-safe thread locks (`sync.RWMutex`) around memory datastores.
- Serves CRUD, AI trade document compiling, and aggregate dashboard endpoints.
- Fully supports Cross-Origin Resource Sharing (CORS) preflight triggers for monorepo separation.
- Firebase Admin SDK (`firebase.go`) provides Firestore persistence when credentials are available; falls back to in-memory data for local dev.

## 4. Next.js Frontend (`apps/web`)
- Powered by React 19 and Next.js 16 App Router using modern client state rendering.
- Consumes Go API monolith via simple proxy client (`api.ts`).
- Uses custom pure CSS utility configurations (`globals.css`) matching modern Outfit/Jakarta sans typographical harmony and glassmorphic micro-animations.
- Features custom inline high-fidelity stationary sheet parsing and scalable vector inline sparkline graphs.

## 5. Database Layer & Firebase
- Firebase Firestore serves as the primary database with document-based collections.
- Firebase Auth handles authentication and provides UID-based multi-tenant data isolation.
- Collections: `profiles`, `buyer_inquiries`, `shipment_tracker`, `suppliers`.
- Each document is scoped to a `user_id` field matching the Firebase Auth UID.
