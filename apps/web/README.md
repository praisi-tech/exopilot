# Exopilot Frontend (Next.js Package)

This package contains the premium Next.js frontend application for the Exopilot Export Operating System. It connects the client browser with the Go monolith REST API and interfaces directly with Google Firebase (Auth & Firestore) and Google Gemini AI for international trade management.

---

## 🛠️ Tech Stack & Key Libraries

| Layer / Library | Technology Used |
|---|---|
| **Core Framework** | Next.js 16.2.6 (React 19.2.4, TypeScript) |
| **Styling** | Vanilla CSS + Tailwind CSS v4 design system |
| **Icons** | Lucide React |
| **Authentication** | Firebase Auth Client SDK |
| **Database Sync** | Firebase Firestore Client SDK |
| **Document Compiling** | jsPDF (vector layout mapping) |
| **AI Integration** | Google Generative AI Web SDK (`@google/generative-ai` & `@google/genai`) |

---

## ✨ Primary Modular Components

*   **📊 Dashboard Hub:** Visual summary grids representing pipeline values, active shipments, local supplier networks, and spice price sparklines.
*   **🤖 AI Document Studio:** Compiles custom prompt payloads and interfaces client-side with Gemini models (`gemini-2.0-flash`, `gemini-1.5-flash`, etc.) to generate print-ready trade contracts, invoices, and quotations.
*   **🚢 Ocean Freight Tracker:** Registers container shipments, estimated departures (ETD), estimated arrivals (ETA), origin/destination ports, and tracks export document checklists.
*   **👥 Buyer CRM:** Profiles international clients, maps purchase history, scores trust levels (1-5), and embeds direct customer feedback via Google Forms.
*   **🏭 Sourcing Network:** Logs local spice agricultural networks, tracking raw commodity prices, local supplier grades, and transaction history.
*   **📈 Commodity Price Tracker:** Displays real-time market indices for cloves, nutmeg, coffee, cocoa, cinnamon, and mace using vector SVG sparklines.
*   **📝 Negotiation Tactics Feed:** Journals deal bargaining, tracking counter-offers, payment risks, and logistics demands.
*   **⚙️ Account Settings:** Manages corporate identities, NIB export licenses, and processes profile photo compression to low-footprint Base64 directly via canvas.

---

## 🔒 Security Operations (`src/lib/security.ts`)

The frontend implements robust client-side OWASP Top 10 defense configurations:
*   **XSS Mitigation:** Inputs are parsed via `sanitizeInput()` to strip HTML tag structures and escape dynamic characters.
*   **NoSQL Injection Safeguard:** The `sanitizeSearchQuery()` module strips dangerous query metadata before execution.
*   **Brute-Force Rate Limiter:** Access attempts are tracked via localStorage. Brute-force bounds lock login controls for 15 minutes if authorization fails 5 consecutive times.
*   **CSRF Protection:** Generates cryptographic session CSRF tokens to safeguard all transaction requests.

---

## 📁 Package Directory Architecture

```
apps/web/
├── .env.local                     # Client-side local environment variables
├── postcss.config.mjs             # CSS configuration
├── eslint.config.mjs             # Linting parameters
├── next.config.ts                 # Next.js workspace overrides
├── package.json                   # Web dependencies & workspace scripts
├── tsconfig.json                  # TypeScript compiler settings
│
├── public/                        # Static assets (logos, svg vectors)
└── src/
    ├── firebase.config.ts         # Client Firebase connection initialization
    │
    ├── app/                       # Routing structures
    │   ├── globals.css            # Stylesheets, color tokens, dark mode parameters
    │   ├── layout.tsx             # Root template wrapper
    │   └── page.tsx               # Main application routing and state manager
    │
    ├── components/                # Modular React interfaces
    │   ├── AIDocStudio.tsx        # Document compiler & PDF creator
    │   ├── ContainerCalculator.tsx# Payload CBM calculator
    │   ├── CurrencyConverter.tsx  # FOB export price simulator
    │   └── UserSettings.tsx       # User profile & base64 image compressor
    │
    └── lib/                       # Functional hooks & API wrappers
        ├── AuthContext.tsx        # User authentication & profile hooks
        ├── LanguageContext.tsx    # International translations context
        ├── ThemeContext.tsx       # Light & dark theme provider
        ├── api.ts                 # REST client communicating with the Go backend
        ├── firebase.ts            # Client Firestore operations
        └── security.ts            # OWASP Top 10 security handlers
```

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Ensure `apps/web/.env.local` contains valid API keys before running:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Running the Development Server
From the root workspace directory, use the main dev orchestrator script:
```bash
node scripts/dev.js
```
Or run the web workspace individually:
```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to view the client dashboard.
