// Exopilot API Client — connects Next.js frontend to Go backend with automatic offline fallback

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ============================================================
// MOCK DATABASE & OFFLINE FALLBACK
// ============================================================

interface PricePoint { date: string; price: number; }

const DEFAULT_DB: {
  inquiries: any[];
  shipments: any[];
  buyerCRM: any[];
  commodityPrices: { commodity: string; currentPrice: number; currency: string; unit: string; change24h: number; change7d: number; historicalData: PricePoint[] }[];
  negotiationNotes: any[];
  suppliers: any[];
} = {
  inquiries: [
    { id: "inq_1", buyerName: "Klausen Spice GmbH", country: "Germany", product: "Nutmeg (ABCD Grade)", quantity: "15 MT", price: "$8,500/MT", status: "Negotiating", source: "Alibaba", date: "2026-05-18", lastContactDate: "2026-05-21", followUpReminderDate: "2026-05-24", negotiationNotes: "Negotiating final payment terms (CAD vs 30% advance). Wants CIF Rotterdam." },
    { id: "inq_2", buyerName: "Tokyo Organic Imports", country: "Japan", product: "Cloves (Lal Pari Grade)", quantity: "8 MT", price: "$9,200/MT", status: "Closed Deal", source: "LinkedIn", date: "2026-05-20", lastContactDate: "2026-05-20", negotiationNotes: "Contract signed! LC opened. Container booking confirmed with Maersk." },
    { id: "inq_3", buyerName: "Singapore Spice Trading Hub", country: "Singapore", product: "Mace (Whole High Grade)", quantity: "2 MT", price: "$14,000/MT", status: "New Inquiry", source: "Direct", date: "2026-05-22", lastContactDate: "2026-05-22", followUpReminderDate: "2026-05-25", negotiationNotes: "Requested free shipping sample. Prefers CIF terminal delivery." },
    { id: "inq_4", buyerName: "Sultan Spice Co.", country: "Turkey", product: "Cassia Cinnamon (Split)", quantity: "20 MT", price: "$4,200/MT", status: "Negotiating", source: "Facebook", date: "2026-05-23", lastContactDate: "2026-05-23", followUpReminderDate: "2026-05-23", negotiationNotes: "Negotiating port of loading Belawan vs Tanjung Priok." },
    { id: "inq_5", buyerName: "Dutch Botanical Bulk BV", country: "Netherlands", product: "Cloves (Lal Pari Grade)", quantity: "12 MT", price: "$9,100/MT", status: "Sample Sent", source: "Website", date: "2026-05-16", lastContactDate: "2026-05-19", followUpReminderDate: "2026-05-26", negotiationNotes: "Sample dispatched via DHL. Awaiting quality approval." },
    { id: "inq_6", buyerName: "Gulf Aromatics LLC", country: "UAE", product: "Nutmeg (ABCD Grade)", quantity: "30 MT", price: "$8,200/MT", status: "Waiting Payment", source: "LinkedIn", date: "2026-05-10", lastContactDate: "2026-05-20", negotiationNotes: "LC opened at Dubai Islamic Bank. Awaiting SWIFT confirmation." }
  ],
  shipments: [
    { id: "ship_1", containerNumber: "EMCU8902143", shippingLine: "Evergreen", commodity: "Nutmeg", status: "On Vessel", etd: "2026-05-10", eta: "2026-06-05", portOrigin: "Tanjung Priok, Jakarta", portDestination: "Port of Rotterdam, Netherlands", buyerName: "Klausen Spice GmbH", documents: [{ type: "Bill of Lading", uploaded: true }, { type: "Commercial Invoice", uploaded: true }, { type: "Packing List", uploaded: false }] },
    { id: "ship_2", containerNumber: "MSKU4723920", shippingLine: "Maersk", commodity: "Cloves", status: "Customs Clearance", etd: "2026-05-21", eta: "2026-06-18", portOrigin: "Tanjung Priok, Jakarta", portDestination: "Port of Tokyo, Japan", buyerName: "Tokyo Organic Imports", documents: [{ type: "Bill of Lading", uploaded: false }, { type: "Commercial Invoice", uploaded: true }, { type: "Packing List", uploaded: false }] },
    { id: "ship_3", containerNumber: "OOLU5612849", shippingLine: "OOCL", commodity: "Mace", status: "Arrived", etd: "2026-04-25", eta: "2026-05-22", portOrigin: "Tanjung Perak, Surabaya", portDestination: "Port of Singapore", buyerName: "Singapore Spice Trading Hub", documents: [{ type: "Bill of Lading", uploaded: true }, { type: "Commercial Invoice", uploaded: true }, { type: "Packing List", uploaded: true }] },
    { id: "ship_4", containerNumber: "HLXU3291047", shippingLine: "Hapag-Lloyd", commodity: "Cinnamon", status: "Preparing", etd: "2026-06-02", eta: "2026-07-01", portOrigin: "Belawan, Medan", portDestination: "Port of Istanbul, Turkey", buyerName: "Sultan Spice Co.", documents: [{ type: "Bill of Lading", uploaded: false }, { type: "Commercial Invoice", uploaded: false }, { type: "Packing List", uploaded: false }] }
  ],
  buyerCRM: [
    { id: "crm_1", buyerName: "Klausen Spice GmbH", company: "Klausen Spice GmbH", country: "Germany", totalVolume: "53 MT", paymentHistory: "Excellent", trustLevel: 5, preferences: "CIF + LC", preferredProducts: ["Nutmeg ABCD", "Mace Whole"], communicationNotes: "Very professional. Responds within 24h. Always pays on LC, never delays. Prefers CIF Rotterdam.", dealHistory: [{ date: "2026-05-18", product: "Nutmeg ABCD", quantity: "15 MT", incoterms: "CIF", value: "$127,500" }, { date: "2026-02-10", product: "Nutmeg ABCD", quantity: "20 MT", incoterms: "FOB", value: "$168,000" }, { date: "2026-11-05", product: "Mace Whole", quantity: "8 MT", incoterms: "CIF", value: "$112,000" }] },
    { id: "crm_2", buyerName: "Tokyo Organic Imports", company: "Tokyo Organic Imports K.K.", country: "Japan", totalVolume: "24 MT", paymentHistory: "Good", trustLevel: 4, preferences: "FOB + TT", preferredProducts: ["Cloves Lal Pari", "Nutmeg ABCD"], communicationNotes: "Formal and polite. Responds within 48h. Occasional payment delay (5-7 days) but always pays.", dealHistory: [{ date: "2026-05-20", product: "Cloves Lal Pari", quantity: "8 MT", incoterms: "FOB", value: "$73,600" }, { date: "2026-01-15", product: "Nutmeg ABCD", quantity: "10 MT", incoterms: "FOB", value: "$84,000" }] },
    { id: "crm_3", buyerName: "Gulf Aromatics LLC", company: "Gulf Aromatics LLC", country: "UAE", totalVolume: "30 MT", paymentHistory: "Average", trustLevel: 3, preferences: "CIF + TT", preferredProducts: ["Nutmeg ABCD", "Cassia Cinnamon"], communicationNotes: "Can be slow to respond (3-5 days). Aggressive price negotiation. Has delayed LC confirmation twice.", dealHistory: [{ date: "2026-05-10", product: "Nutmeg ABCD", quantity: "30 MT", incoterms: "CIF", value: "$246,000" }] },
    { id: "crm_4", buyerName: "Dutch Botanical Bulk BV", company: "Dutch Botanical Bulk BV", country: "Netherlands", totalVolume: "12 MT", paymentHistory: "Good", trustLevel: 4, preferences: "FOB + LC", preferredProducts: ["Cloves Lal Pari", "Mace Whole"], communicationNotes: "Excellent communication. Very detailed with specifications. Requires EU phytosanitary certifications.", dealHistory: [{ date: "2026-05-16", product: "Cloves Lal Pari", quantity: "12 MT", incoterms: "FOB", value: "$109,200" }] }
  ],
  commodityPrices: [
    { commodity: "Nutmeg", currentPrice: 8500, currency: "USD", unit: "MT", change24h: 1.2, change7d: -2.4, historicalData: [] },
    { commodity: "Cloves", currentPrice: 9200, currency: "USD", unit: "MT", change24h: -0.8, change7d: 3.1, historicalData: [] },
    { commodity: "Coconut", currentPrice: 1200, currency: "USD", unit: "MT", change24h: 0.3, change7d: 1.5, historicalData: [] },
    { commodity: "Coffee", currentPrice: 6800, currency: "USD", unit: "MT", change24h: 2.1, change7d: 4.7, historicalData: [] },
    { commodity: "Cocoa", currentPrice: 9400, currency: "USD", unit: "MT", change24h: -1.5, change7d: -5.2, historicalData: [] },
    { commodity: "Mace", currentPrice: 14000, currency: "USD", unit: "MT", change24h: 0.7, change7d: 2.3, historicalData: [] },
    { commodity: "Cinnamon", currentPrice: 4200, currency: "USD", unit: "MT", change24h: -0.4, change7d: 1.1, historicalData: [] }
  ],
  negotiationNotes: [
    { id: "note_1", buyerName: "Klausen Spice GmbH", date: "2026-05-20", category: "Preference", content: "Always requests CIF Rotterdam. Never accepts FOB — their in-house logistics cannot handle port clearance in Indonesia.", tags: ["cif", "rotterdam", "logistics"] },
    { id: "note_2", buyerName: "Gulf Aromatics LLC", date: "2026-05-18", category: "Risk", content: "Has delayed LC confirmation twice. Always negotiate minimum 30% advance TT before releasing cargo.", tags: ["lc-delay", "advance-payment", "high-risk"] },
    { id: "note_3", buyerName: "Tokyo Organic Imports", date: "2026-05-15", category: "Payment", content: "Payment arrives 5-7 days after BL presentation. Their bank (MUFG Tokyo) processes on Tuesdays and Thursdays only.", tags: ["mufg", "payment-delay", "bl"] }
  ],
  suppliers: [
    { id: "sup_1", name: "PT Maluku Spice Mandiri", location: "Ambon, Maluku", product: "Nutmeg (ABCD Grade)", supplyCapacity: "50 MT/month", lastPrice: "$7,800/MT", qualityGrade: "A", reliabilityScore: 5, legalDocs: true, notes: "Top-tier nutmeg supplier. SGS certified. Consistent quality over 3 years.", transactionHistory: [{ date: "2026-05-10", product: "Nutmeg ABCD", quantity: "20 MT", price: "$156,000" }], createdAt: "2026-01-15" },
    { id: "sup_2", name: "CV Cengkeh Nusantara", location: "Minahasa, North Sulawesi", product: "Cloves (Lal Pari Grade)", supplyCapacity: "30 MT/month", lastPrice: "$8,500/MT", qualityGrade: "A", reliabilityScore: 4, legalDocs: true, notes: "Reliable clove supplier. Occasional delays during rainy season (Nov-Feb).", transactionHistory: [{ date: "2026-05-18", product: "Cloves Lal Pari", quantity: "10 MT", price: "$85,000" }], createdAt: "2026-02-01" }
  ]
};

const isClient = typeof window !== "undefined";

function generatePriceHistory(basePrice: number, volatility: number) {
  const data = [];
  let price = basePrice * (0.92 + Math.random() * 0.1);
  const base = new Date(2026, 4, 24);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base.getTime());
    d.setDate(base.getDate() - i);
    const change = (Math.random() - 0.5) * volatility;
    price = price * (1 + change);
    data.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(price)
    });
  }
  return data;
}

function getLocalDb() {
  if (!isClient) return DEFAULT_DB;
  const stored = localStorage.getItem("exo_local_db");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) { }
  }
  // Initialize with DEFAULT_DB and generated price histories
  const initialDb = { ...DEFAULT_DB };
  initialDb.commodityPrices = DEFAULT_DB.commodityPrices.map(c => ({
    ...c,
    historicalData: generatePriceHistory(c.currentPrice, c.commodity === "Cocoa" ? 0.04 : 0.025)
  }));
  localStorage.setItem("exo_local_db", JSON.stringify(initialDb));
  return initialDb;
}

function saveLocalDb(db: any) {
  if (isClient) {
    localStorage.setItem("exo_local_db", JSON.stringify(db));
  }
}

function getSummary(db: any) {
  const today = new Date().toISOString().slice(0, 10);
  const activeShipments = db.shipments.filter((s: any) => s.status !== "Arrived" && s.status !== "Completed").length;
  let closedDeals = 0;
  let followUpsDue = 0;
  db.inquiries.forEach((inq: any) => {
    if (inq.status === "Closed Deal") closedDeals++;
    if (inq.followUpReminderDate && inq.followUpReminderDate <= today && inq.status !== "Closed Deal" && inq.status !== "Lost") {
      followUpsDue++;
    }
  });

  return {
    totalInquiries: db.inquiries.length,
    activeShipments,
    closedDeals,
    pipelineValue: "$2,847,500",
    sourcingSuppliers: db.suppliers.length,
    monthlyIncreaseRate: "+18.2%",
    followUpsDueToday: followUpsDue,
    activeCommodities: db.commodityPrices.length
  };
}

async function handleLocalRequest(path: string, options?: RequestInit): Promise<any> {
  // Simulate minor network delay
  await new Promise(r => setTimeout(r, 150));

  const db = getLocalDb();
  const method = options?.method || "GET";
  const body = options?.body ? JSON.parse(options.body as string) : {};

  // GET /api/dashboard
  if (path === "/api/dashboard" && method === "GET") {
    return {
      summary: getSummary(db),
      inquiries: db.inquiries,
      shipments: db.shipments,
      buyerCRM: db.buyerCRM,
      commodityPrices: db.commodityPrices,
      negotiationNotes: db.negotiationNotes,
      suppliers: db.suppliers
    };
  }

  // GET /api/inquiry
  if (path === "/api/inquiry" && method === "GET") {
    return { inquiries: db.inquiries };
  }

  // POST /api/inquiry
  if (path === "/api/inquiry" && method === "POST") {
    const newInq = {
      id: `inq_${Date.now()}`,
      buyerName: body.buyerName || "New Buyer",
      country: body.country || "USA",
      product: body.product || "Nutmeg (ABCD Grade)",
      quantity: body.quantity || "10 MT",
      price: body.price || "$8,000/MT",
      status: "New Inquiry",
      source: body.source || "Direct",
      date: new Date().toISOString().slice(0, 10),
      lastContactDate: new Date().toISOString().slice(0, 10),
      followUpReminderDate: body.followUpReminderDate || "",
      negotiationNotes: body.negotiationNotes || ""
    };
    db.inquiries.unshift(newInq);
    saveLocalDb(db);
    return { message: "Inquiry added", inquiry: newInq, inquiries: db.inquiries };
  }

  // PUT /api/inquiry/:id
  if (path.startsWith("/api/inquiry/") && method === "PUT") {
    const id = path.split("/").pop();
    const idx = db.inquiries.findIndex((i: any) => i.id === id);
    if (idx !== -1) {
      db.inquiries[idx] = { ...db.inquiries[idx], ...body };
      saveLocalDb(db);
      return { inquiry: db.inquiries[idx], inquiries: db.inquiries };
    }
    throw new Error("Inquiry not found");
  }

  // DELETE /api/inquiry/:id
  if (path.startsWith("/api/inquiry/") && method === "DELETE") {
    const id = path.split("/").pop();
    db.inquiries = db.inquiries.filter((i: any) => i.id !== id);
    saveLocalDb(db);
    return { message: "Deleted", inquiries: db.inquiries };
  }

  // POST /api/shipment
  if (path === "/api/shipment" && method === "POST") {
    const newShip = {
      id: `ship_${Date.now()}`,
      containerNumber: body.containerNumber || `EMCU${Math.floor(Math.random() * 9000000) + 1000000}`,
      shippingLine: body.shippingLine || "Maersk",
      commodity: body.commodity || "Nutmeg",
      status: "Preparing",
      etd: body.etd || new Date().toISOString().slice(0, 10),
      eta: body.eta || new Date().toISOString().slice(0, 10),
      portOrigin: body.portOrigin || "Tanjung Priok, Jakarta",
      portDestination: body.portDestination || "Port of Rotterdam, Netherlands",
      buyerName: body.buyerName || "",
      documents: [
        { type: "Bill of Lading", uploaded: false },
        { type: "Commercial Invoice", uploaded: false },
        { type: "Packing List", uploaded: false }
      ]
    };
    db.shipments.unshift(newShip);
    saveLocalDb(db);
    return { shipment: newShip, shipments: db.shipments };
  }

  // PUT /api/shipment/:id/document
  if (path.startsWith("/api/shipment/") && path.endsWith("/document") && method === "PUT") {
    const parts = path.split("/");
    const id = parts[parts.indexOf("shipment") + 1];
    const idx = db.shipments.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      const docType = body.docType;
      db.shipments[idx].documents = db.shipments[idx].documents.map((d: any) => {
        if (d.type === docType) {
          return { ...d, uploaded: !d.uploaded };
        }
        return d;
      });
      saveLocalDb(db);
      return { shipment: db.shipments[idx], shipments: db.shipments };
    }
    throw new Error("Shipment not found");
  }

  // POST /api/supplier
  if (path === "/api/supplier" && method === "POST") {
    const newSup = {
      id: `sup_${Date.now()}`,
      name: body.name || "New Supplier",
      location: body.location || "Ambon, Maluku",
      product: body.product || "Nutmeg",
      supplyCapacity: body.supplyCapacity || "10 MT/month",
      lastPrice: body.lastPrice || "$8,000/MT",
      qualityGrade: body.qualityGrade || "A",
      reliabilityScore: body.reliabilityScore || 5,
      legalDocs: body.legalDocs || false,
      notes: body.notes || "",
      transactionHistory: [],
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.suppliers.unshift(newSup);
    saveLocalDb(db);
    return { supplier: newSup, suppliers: db.suppliers };
  }

  // PUT /api/supplier/:id
  if (path.startsWith("/api/supplier/") && method === "PUT") {
    const id = path.split("/").pop();
    const idx = db.suppliers.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      db.suppliers[idx] = { ...db.suppliers[idx], ...body };
      saveLocalDb(db);
      return { supplier: db.suppliers[idx], suppliers: db.suppliers };
    }
    throw new Error("Supplier not found");
  }

  // DELETE /api/supplier/:id
  if (path.startsWith("/api/supplier/") && method === "DELETE") {
    const id = path.split("/").pop();
    db.suppliers = db.suppliers.filter((s: any) => s.id !== id);
    saveLocalDb(db);
    return { message: "Deleted", suppliers: db.suppliers };
  }

  // POST /api/negotiation-note
  if (path === "/api/negotiation-note" && method === "POST") {
    const newNote = {
      id: `note_${Date.now()}`,
      buyerName: body.buyerName || "Klausen Spice GmbH",
      date: new Date().toISOString().slice(0, 10),
      category: body.category || "General",
      content: body.content || "",
      tags: body.tags || []
    };
    db.negotiationNotes.unshift(newNote);
    saveLocalDb(db);
    return { note: newNote, notes: db.negotiationNotes };
  }

  // DELETE /api/negotiation-note/:id
  if (path.startsWith("/api/negotiation-note/") && method === "DELETE") {
    const id = path.split("/").pop();
    db.negotiationNotes = db.negotiationNotes.filter((n: any) => n.id !== id);
    saveLocalDb(db);
    return { message: "Deleted", notes: db.negotiationNotes };
  }

  // PUT /api/buyer-crm/:id
  if (path.startsWith("/api/buyer-crm/") && method === "PUT") {
    const id = path.split("/").pop();
    const idx = db.buyerCRM.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      db.buyerCRM[idx] = { ...db.buyerCRM[idx], ...body };
      saveLocalDb(db);
      return { buyer: db.buyerCRM[idx], buyerCRM: db.buyerCRM };
    }
    throw new Error("Buyer CRM not found");
  }

  // POST /api/generate-document
  if (path === "/api/generate-document" && method === "POST") {
    const docType = body.docType || "Quotation";
    const country = body.destinationCountry || "Netherlands";
    const price = body.price || "[ _____________________ ]";
    const notes = body.negotiationNotes || "";
    const sellerName = body.businessName || "PT Rempah Nusantara Abadi";
    const dateStr = new Date().toISOString().slice(0, 10);
    const serialRef = `EX-2026-${Math.floor(Math.random() * 9000) + 1000}`;

    let doc = "";
    const docLower = docType.toLowerCase();
    if (docLower.includes("invoice")) {
      doc = `# COMMERCIAL INVOICE\n**Invoice No: ${serialRef}** | Date: **${dateStr}**\n\n**SELLER:** ${sellerName}, Jakarta, Indonesia\n**BUYER:** ${body.buyerName || "[ _____________________ ]"}, ${country}\n\n| Commodity | Volume | Unit Price | Total |\n|---|---|---|---|\n| **${body.commodity || "[ _____________________ ]"}** | ${body.quantity || "[ _____________________ ]"} | ${price} | [ _____________________ ] |\n\n### BANK DETAILS\n- Bank Name: [ _____________________ ]\n- Account No: [ _____________________ ]\n- Swift/BIC: [ _____________________ ]\n\n### SPECIAL NOTES\n${notes || "Standard export provisions applied."}\n\n---\n*Authorized by Indonesian Agricultural Export Board Liaison*`;
    } else if (docLower.includes("contract")) {
      doc = `# INTERNATIONAL TRADE CONTRACT\n**ID: RNA-EX-${country.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90000) + 10000}** | Date: **${dateStr}**\n\n**SELLER:** ${sellerName}, Jakarta, Indonesia\n**BUYER:** ${body.buyerName || "[ _____________________ ]"}, ${country}\n\n### ARTICLE 1: SUBJECT OF AGREEMENT\nSeller agrees to supply **${body.commodity || "[ _____________________ ]"}** in accordance with the specifications below.\n\n### ARTICLE 2: QUANTITY & DELIVERY\n- Net Volume: **${body.quantity || "[ _____________________ ]"}** (±3% tolerance)\n- Port of Loading: Tanjung Priok, Jakarta, Indonesia\n- Port of Discharge: [ _____________________ ]\n- Incoterms: [ FOB / CIF ] — *edit as applicable*\n\n### ARTICLE 3: PRICE\n**${price}** per MT FOB Indonesian ports\n\n### ARTICLE 4: PAYMENT TERMS\n- Payment Method: [ Irrevocable LC / T/T ]\n- Advance: [ _____________________ ]%\n- Balance: against B/L copy\n\n### ARTICLE 5: QUALITY\n- SGS/Sucofindo certificate required\n- Moisture: <12%\n- Phytosanitary certified\n\n**Special Notes:** ${notes || "Standard provisions apply."}\n\n---\n*Signature Seller:* [ _____________________ ] *| Signature Buyer:* [ _____________________ ]`;
    } else {
      doc = `# FORMAL EXPORT QUOTATION\n**${sellerName}** | Date: ${dateStr} | Ref: ${serialRef}\n\n**To:** ${body.buyerName || "[ _____________________ ]"} | **Destination:** ${country}\n\n| Commodity | Volume | Price (FOB) | Origin | Loading Port |\n|---|---|---|---|---|\n| **${body.commodity || "[ _____________________ ]"}** | ${body.quantity || "[ _____________________ ]"} | ${price} | Indonesia | Tanjung Priok |\n\n### TRADE TERMS\n1. **Origin:** Indonesia\n2. **Packing:** [ _____________________ ]\n3. **Payment:** [ 30% T/T advance + 70% against B/L / LC ]\n4. **Lead Time:** [ _____________________ ] days post-phytosanitary approval\n5. **Quality:** Moisture <12%, SGS/Sucofindo certified\n\n### SPECIAL DEMANDS ADDRESSED\n${notes || "No custom demands specified."}\n\n---\n*Quotation valid for:* [ _____________________ ] days`;
    }

    return {
      document: doc,
      note: "Offline Mode (Render backend unavailable)"
    };
  }

  throw new Error(`Unsupported offline path: ${path}`);
}

// ============================================================
// CORE API FETCH CALL
// ============================================================

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Dynamic import to avoid Firebase init during SSR/build
  try {
    const { auth } = await import("@/firebase.config");
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (_) {
    // Firebase not available — proceed without auth header
  }

  try {
    const url = `${API_BASE}${path}`;
    console.log("🔄 Fetching:", url);

    const res = await fetch(url, {
      headers,
      ...options,
    });

    if (!res.ok) {
      console.warn(`⚠️ API error ${res.status}. Falling back to local localStorage database for route: ${path}`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("api-offline-fallback"));
      }
      return handleLocalRequest(path, options) as Promise<T>;
    }
    return res.json();
  } catch (error) {
    console.warn(`⚠️ Fetch/network error. Falling back to local localStorage database for route: ${path}`, error);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("api-offline-fallback"));
    }
    return handleLocalRequest(path, options) as Promise<T>;
  }
}

// Dashboard
export const fetchDashboard = () => apiFetch<any>("/api/dashboard");

// Inquiries
export const createInquiry = (body: Record<string, string>) =>
  apiFetch<any>("/api/inquiry", { method: "POST", body: JSON.stringify(body) });

export const updateInquiry = (id: string, body: Record<string, string>) =>
  apiFetch<any>(`/api/inquiry/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteInquiry = (id: string) =>
  apiFetch<any>(`/api/inquiry/${id}`, { method: "DELETE" });

// Shipments
export const createShipment = (body: Record<string, string>) =>
  apiFetch<any>("/api/shipment", { method: "POST", body: JSON.stringify(body) });

export const toggleShipmentDocument = (shipmentId: string, docType: string) =>
  apiFetch<any>(`/api/shipment/${shipmentId}/document`, {
    method: "PUT", body: JSON.stringify({ docType }),
  });

// Suppliers
export const createSupplier = (body: Record<string, unknown>) =>
  apiFetch<any>("/api/supplier", { method: "POST", body: JSON.stringify(body) });

export const updateSupplier = (id: string, body: Record<string, unknown>) =>
  apiFetch<any>(`/api/supplier/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteSupplier = (id: string) =>
  apiFetch<any>(`/api/supplier/${id}`, { method: "DELETE" });

// Negotiation Notes
export const createNote = (body: Record<string, unknown>) =>
  apiFetch<any>("/api/negotiation-note", { method: "POST", body: JSON.stringify(body) });

export const deleteNote = (id: string) =>
  apiFetch<any>(`/api/negotiation-note/${id}`, { method: "DELETE" });

// Buyer CRM
export const updateBuyerCRM = (id: string, body: Record<string, unknown>) =>
  apiFetch<any>(`/api/buyer-crm/${id}`, { method: "PUT", body: JSON.stringify(body) });

// AI Doc Generator
export const generateDocument = (body: Record<string, string>) =>
  apiFetch<any>("/api/generate-document", { method: "POST", body: JSON.stringify(body) });

