<div align="center">

<br />

<img src="https://img.shields.io/badge/Exopilot-OS%20for%20Export%20SMEs-6366f1?style=for-the-badge&labelColor=0f172a" alt="Exopilot" />

<br /><br />

**Exopilot** is a digital operating system for international export SMEs — a unified intelligence platform designed for Indonesian spice and agricultural commodity exporters to manage the entire trade lifecycle from initial buyer inquiry to shipping container log tracking, raw material supply networks, target price negotiation logs, and high-fidelity AI-powered trade documentation.

<br />

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![Go](https://img.shields.io/badge/Go_1.22-00ADD8?style=flat-square&logo=go&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75C2?style=flat-square&logo=google-gemini&logoColor=white)

</div>

---

## ✨ System Features

| Module | Technical Capabilities |
|---|---|
| 📊 **Dashboard Hub** | Real-time KPI snapshot monitoring total inquiries, active shipments, sourcing suppliers, monthly pipeline increments, sparkline market trends, and critical follow-up calendar alerts. |
| 🤖 **AI Export Doc Studio** | Direct client-side integration with Google Gemini generative models to draft legal-standard trade papers (Quotations, Commercial Invoices, Contracts) with custom prompt support, a print-ready vector preview, and a custom jsPDF download engine. |
| 🚢 **Ocean Freight Tracker** | Marine shipping logistics registry tracking container serials, shipping lines, estimated departures (ETD), estimated arrivals (ETA), loading/discharge ports, and document checklists (BL, COO, Invoice, Packing List). |
| 👥 **Buyer CRM** | Profiling of international buying entities, documenting transaction history, preferred commodities, payment history indexes, trust scores (1-5), and reviews populated directly via Google Form integration. |
| 🏭 **Sourcing Network** | Local supply chain register cataloging farmers, cooperatives, and spice collectors with grade metrics (A, B, or C), capacity figures, price logs, and transaction history. |
| 📈 **Spice Market Prices** | Visual index presenting benchmark commodity prices (cloves, nutmeg, cinnamon, mace, cocoa, coffee) plotted on dynamic inline SVG sparkline graphs. |
| 📝 **Negotiation tactics Feed** | Journaling of commercial interactions linked to buyers, categorized by tags (risk indicators, counter-offers, Letter of Credit warnings) and chronological logs. |
| 🧮 **Payload Volume Calculator** | Instant volumetric CBM and weight optimization tool verifying physical payload dimensions inside standard 20ft, 40ft, and 40ft HQ shipping containers. |
| 💱 **FOB Export Simulator** | Financial calculator simulating Recommended Free On Board (FOB) selling prices based on raw material costs, local transport fees, exchange rates, and profit margin factors. |
| 🌐 **Localization & RTL System** | Multi-lingual architecture supporting English, Indonesian, Hindi, Chinese, and Arabic. When Arabic is loaded, the layout switches to Native Right-to-Left (RTL) flow. |

---

## 🏗️ System Architecture & Data Flow

Exopilot is structured as a type-safe monorepo separating modular services for performance and security:

```
                                  ┌───────────────────────┐
                                  │   Next.js 16 Client   │ (Port 3000)
                                  └───────────┬───────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │   Go Monolith REST API  │ (Port 8080)           │ Google Firebase Auth    │
        └────────────┬────────────┘                       └─────────────────────────┘
                     │                                                 ▲
         ┌───────────┴───────────┐                                     │
         ▼                       ▼                                     │
┌─────────────────┐     ┌─────────────────┐                            │
│ Google GenAI API│     │ Cloud Firestore │ ◄──────────────────────────┘
│  (Gemini SDK)   │     │  (Data Store)   │ (Tenant UID Validation)
└─────────────────┘     └─────────────────┘
```

---

## 📂 Workspace Structure

```
exopilot/
├── apps/
│   ├── web/              # Next.js 16 SPA (React 19, TypeScript, PostCSS + Tailwind v4)
│   └── api/              # Go REST API Monolith (Standard library net/http server)
├── packages/
│   └── shared-types/     # Shared TypeScript contracts and interfaces
├── scripts/
│   ├── dev.js            # Cross-platform development server orchestrator
│   ├── dev.bat           # Windows runtime shortcut
│   └── dev.sh            # Unix shell execution shortcut
└── storage.rules         # Security guidelines for Firebase suite
```

---

## 🚀 Installation & Local Execution

### Prerequisites

*   Node.js (Version $\geq 18$)
*   Go Compiler (Version $\geq 1.20$)
*   NPM (Version $\geq 9$)

### 1. Clone & Core Dependencies
```bash
git clone https://github.com/praisi-tech/exopilot.git
cd exopilot
npm install
```

### 2. Configure Environment Properties

#### Web Frontend configuration (`apps/web/.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Go API configuration (`apps/api/.env`):
```env
PORT=8080
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_CREDENTIALS_PATH=../../firebase-service-account.json
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Running Development Servers
To spin up both the Go REST monolith and the Next.js frontend concurrently using the workspace orchestrator:

```bash
# General Workspace runner
node scripts/dev.js

# Alternative Platform Shortcuts
# Windows:
scripts\dev.bat

# Linux / macOS:
bash scripts/dev.sh
```

| Service | Access Endpoint |
|---|---|
| **Web Frontend** | http://localhost:3000 |
| **Go REST Backend** | http://localhost:8080 |

---

## 🔌 Go REST Backend API Endpoints

All core API endpoints are served securely and contain fallback mechanisms for offline execution:

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Compiles aggregated metrics, supplier network lists, and buyer inquiries. |
| `POST` | `/api/inquiry` | Inserts a new buyer inquiry into the active export pipeline. |
| `PUT` | `/api/inquiry/:id` | Modifies status parameters and logs follow-up reminders. |
| `DELETE` | `/api/inquiry/:id` | Purges selected inquiries from the active database. |
| `POST` | `/api/shipment` | Registers container tracking data and defaults the document checklist. |
| `PUT` | `/api/shipment/:id/document` | Toggles status parameters inside the shipment document verification seals. |
| `POST` | `/api/supplier` | Enrolls a local farmer, cooperative, or collector node. |
| `PUT` | `/api/supplier/:id` | Adjusts supply capacity values and reliability ratings. |
| `DELETE` | `/api/supplier/:id` | Removes sourcing channels from the supplier index. |
| `POST` | `/api/negotiation-note` | Records price counter-offers and communication details. |
| `DELETE` | `/api/negotiation-note/:id` | Deletes negotiation records. |
| `POST` | `/api/generate-document` | Backend cascade fallback executing Gemini REST operations for trade documentation. |
| `GET` | `/health` | Server status checks returning standard performance stats. |

---

## 🔒 Security Operations & OWASP Defenses

The system implements multiple overlapping security controls to safeguard sensitive international trade records:
*   **Data Multi-Tenant Isolation:** Access validations ensure all database interactions check parent document owners using a secure `user_id` parameter linked to verified Firebase Auth UIDs.
*   **XSS Mitigation Filters:** Inputs are sanitized to prevent script injection in dynamic views by stripping dangerous tag structures and escaping key characters.
*   **NoSQL Injection Safeguard:** Regex filters strip dangerous database query syntax, sanitizing input vectors before database requests.
*   **Session Brute-Force Rate Limiting:** Brute-force protections track failed authorization actions locally and disable login controls temporarily if consecutive limits are breached.
*   **CSRF Token Protection:** Client-side interactions create cryptographic tokens to verify session-origin validations.

---

## 📄 License

Private Intellectual Property — © 2026 [Praisi Tech](https://github.com/praisi-tech). All rights reserved.
