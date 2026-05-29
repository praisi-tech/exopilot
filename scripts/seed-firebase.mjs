/**
 * scripts/seed-firebase.mjs
 * Firebase Firestore Seeding Script using Firebase Admin SDK.
 * Seeds sample records for buyer inquiries, CRM, shipments, suppliers, negotiation notes, and profiles.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

// 1. Initialize Firebase Admin SDK
const serviceAccountPath = resolve(process.cwd(), "./firebase-service-account.json");
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
} catch (err) {
  console.error("❌ Error reading service account file:", err.message);
  console.error("Please make sure firebase-service-account.json exists in the project root.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const DEMO_UID = "demo_user_001";

// 2. Define Mock Data
const profileData = {
  company_name: "PT Rempah Nusantara Abadi",
  main_commodity: "Nutmeg",
  phone_number: "+628123456789",
  legal_entity_type: "PT",
  role: "admin", // Let's make the demo user an Admin
  disabled: false,
  photo_url: "",
  created_at: admin.firestore.FieldValue.serverTimestamp(),
  updated_at: admin.firestore.FieldValue.serverTimestamp()
};

const inquiries = [
  {
    buyer_name: "Klausen Spice GmbH",
    country: "Germany",
    product: "Nutmeg (ABCD Grade)",
    quantity: "15 MT",
    price: "$8,500/MT",
    status: "Negotiating",
    source: "Alibaba",
    date: "2026-05-18",
    last_contact_date: "2026-05-21",
    follow_up_reminder_date: "2026-05-24",
    negotiation_notes: "Negotiating final payment terms (CAD vs 30% advance). Wants CIF Rotterdam."
  },
  {
    buyer_name: "Singapore Spice Trading Hub",
    country: "Singapore",
    product: "Mace (Whole High Grade)",
    quantity: "2 MT",
    price: "$14,000/MT",
    status: "New Inquiry",
    source: "Direct",
    date: "2026-05-22",
    last_contact_date: "2026-05-22",
    follow_up_reminder_date: "2026-05-25",
    negotiation_notes: "Requested free shipping sample. Prefers CIF terminal delivery."
  },
  {
    buyer_name: "Sultan Spice Co.",
    country: "Turkey",
    product: "Cassia Cinnamon (Split)",
    quantity: "20 MT",
    price: "$4,200/MT",
    status: "Negotiating",
    source: "Facebook",
    date: "2026-05-23",
    last_contact_date: "2026-05-23",
    follow_up_reminder_date: "2026-05-23",
    negotiation_notes: "Negotiating port of loading Belawan vs Tanjung Priok."
  },
  {
    buyer_name: "Dutch Botanical Bulk BV",
    country: "Netherlands",
    product: "Cloves (Lal Pari Grade)",
    quantity: "12 MT",
    price: "$9,100/MT",
    status: "Sample Sent",
    source: "Website",
    date: "2026-05-16",
    last_contact_date: "2026-05-19",
    follow_up_reminder_date: "2026-05-26",
    negotiation_notes: "Sample dispatched via DHL. Awaiting quality approval."
  },
  {
    buyer_name: "Gulf Aromatics LLC",
    country: "UAE",
    product: "Nutmeg (ABCD Grade)",
    quantity: "30 MT",
    price: "$8,200/MT",
    status: "Waiting Payment",
    source: "LinkedIn",
    date: "2026-05-10",
    last_contact_date: "2026-05-20",
    negotiation_notes: "LC opened at Dubai Islamic Bank. Awaiting SWIFT confirmation."
  },
  {
    // Inquiry with an overdue 3-day follow-up reminder
    buyer_name: "Tokyo Organic Imports",
    country: "Japan",
    product: "Cloves (Lal Pari Grade)",
    quantity: "8 MT",
    price: "$9,200/MT",
    status: "Negotiating",
    source: "LinkedIn",
    date: "2026-05-15",
    last_contact_date: "2026-05-15",
    follow_up_reminder_date: "2026-05-18",
    first_email_sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    negotiation_notes: "Email sent 4 days ago. Follow-up is now overdue (badge should show amber/overdue)."
  }
];

const shipments = [
  {
    container_number: "EMCU8902143",
    shipping_line: "Evergreen",
    commodity: "Nutmeg",
    status: "On Vessel",
    etd: "2026-05-10",
    eta: "2026-06-05",
    port_origin: "Tanjung Priok, Jakarta",
    port_destination: "Port of Rotterdam, Netherlands",
    buyer_name: "Klausen Spice GmbH",
    documents: [
      { type: "Bill of Lading", uploaded: true },
      { type: "Commercial Invoice", uploaded: true },
      { type: "Packing List", uploaded: false }
    ]
  },
  {
    container_number: "MSKU4723920",
    shipping_line: "Maersk",
    commodity: "Cloves",
    status: "Customs Clearance",
    etd: "2026-05-21",
    eta: "2026-06-18",
    port_origin: "Tanjung Priok, Jakarta",
    port_destination: "Port of Tokyo, Japan",
    buyer_name: "Tokyo Organic Imports",
    documents: [
      { type: "Bill of Lading", uploaded: false },
      { type: "Commercial Invoice", uploaded: true },
      { type: "Packing List", uploaded: false }
    ]
  },
  {
    container_number: "OOLU5612849",
    shipping_line: "OOCL",
    commodity: "Mace",
    status: "Arrived",
    etd: "2026-04-25",
    eta: "2026-05-22",
    port_origin: "Tanjung Perak, Surabaya",
    port_destination: "Port of Singapore",
    buyer_name: "Singapore Spice Trading Hub",
    documents: [
      { type: "Bill of Lading", uploaded: true },
      { type: "Commercial Invoice", uploaded: true },
      { type: "Packing List", uploaded: true }
    ]
  },
  {
    container_number: "HLXU3291047",
    shipping_line: "Hapag-Lloyd",
    commodity: "Cinnamon",
    status: "Preparing",
    etd: "2026-06-02",
    eta: "2026-07-01",
    port_origin: "Belawan, Medan",
    port_destination: "Port of Istanbul, Turkey",
    buyer_name: "Sultan Spice Co.",
    documents: [
      { type: "Bill of Lading", uploaded: false },
      { type: "Commercial Invoice", uploaded: false },
      { type: "Packing List", uploaded: false }
    ]
  }
];

const suppliers = [
  {
    name: "PT Maluku Spice Mandiri",
    location: "Ambon, Maluku",
    product: "Nutmeg (ABCD Grade)",
    supply_capacity: "50 MT/month",
    last_price: "$7,800/MT",
    quality_grade: "A",
    reliability_score: 5,
    legal_docs: true,
    notes: "Top-tier nutmeg supplier. SGS certified. Consistent quality over 3 years.",
    transaction_history: [
      { date: "2026-05-10", product: "Nutmeg ABCD", quantity: "20 MT", price: "$156,000" },
      { date: "2026-03-15", product: "Nutmeg ABCD", quantity: "15 MT", price: "$117,000" }
    ],
    created_at: "2026-01-15"
  },
  {
    name: "CV Cengkeh Nusantara",
    location: "Minahasa, North Sulawesi",
    product: "Cloves (Lal Pari Grade)",
    supply_capacity: "30 MT/month",
    last_price: "$8,500/MT",
    quality_grade: "A",
    reliability_score: 4,
    legal_docs: true,
    notes: "Reliable clove supplier. Occasional delays during rainy season (Nov-Feb).",
    transaction_history: [
      { date: "2026-05-18", product: "Cloves Lal Pari", quantity: "10 MT", price: "$85,000" }
    ],
    created_at: "2026-02-01"
  },
  {
    name: "Tani Banda Aceh Cooperative",
    location: "Banda Aceh, Aceh",
    product: "Mace (Whole High Grade)",
    supply_capacity: "8 MT/month",
    last_price: "$12,500/MT",
    quality_grade: "B",
    reliability_score: 3,
    legal_docs: false,
    notes: "Small cooperative. Excellent mace quality but limited capacity. Legal docs pending.",
    transaction_history: [
      { date: "2026-04-20", product: "Mace Whole", quantity: "3 MT", price: "$37,500" }
    ],
    created_at: "2026-03-10"
  },
  {
    name: "PT Kayu Manis Kerinci",
    location: "Kerinci, Jambi",
    product: "Cassia Cinnamon (Split)",
    supply_capacity: "40 MT/month",
    last_price: "$3,800/MT",
    quality_grade: "A",
    reliability_score: 5,
    legal_docs: true,
    notes: "Largest cassia supplier in Sumatra. Phytosanitary certified. Very reliable.",
    transaction_history: [
      { date: "2026-05-20", product: "Cassia Split", quantity: "25 MT", price: "$95,000" },
      { date: "2026-04-05", product: "Cassia Split", quantity: "20 MT", price: "$76,000" }
    ],
    created_at: "2026-11-20"
  }
];

const buyerCrms = [
  {
    buyer_name: "Klausen Spice GmbH",
    company: "Klausen Spice GmbH",
    country: "Germany",
    total_volume: "53 MT",
    payment_history: "Excellent",
    trust_level: 5,
    preferences: "CIF + LC",
    preferred_products: ["Nutmeg ABCD", "Mace Whole"],
    communication_notes: "Very professional. Responds within 24h. Always pays on LC, never delays. Prefers CIF Rotterdam.",
    deal_history: [
      { date: "2026-05-18", product: "Nutmeg ABCD", quantity: "15 MT", value: "$127,500" },
      { date: "2026-02-10", product: "Nutmeg ABCD", quantity: "20 MT", value: "$168,000" },
      { date: "2026-11-05", product: "Mace Whole", quantity: "8 MT", value: "$112,000" }
    ]
  },
  {
    buyer_name: "Tokyo Organic Imports",
    company: "Tokyo Organic Imports K.K.",
    country: "Japan",
    total_volume: "24 MT",
    payment_history: "Good",
    trust_level: 4,
    preferences: "FOB + TT",
    preferred_products: ["Cloves Lal Pari", "Nutmeg ABCD"],
    communication_notes: "Formal and polite. Responds within 48h. Occasional payment delay (5-7 days) but always pays.",
    deal_history: [
      { date: "2026-05-20", product: "Cloves Lal Pari", quantity: "8 MT", value: "$73,600" },
      { date: "2026-01-15", product: "Nutmeg ABCD", quantity: "10 MT", value: "$84,000" }
    ]
  },
  {
    buyer_name: "Gulf Aromatics LLC",
    company: "Gulf Aromatics LLC",
    country: "UAE",
    total_volume: "30 MT",
    payment_history: "Average",
    trust_level: 3,
    preferences: "CIF + TT",
    preferred_products: ["Nutmeg ABCD", "Cassia Cinnamon"],
    communication_notes: "Can be slow to respond (3-5 days). Aggressive price negotiation. Has delayed LC confirmation twice.",
    deal_history: [
      { date: "2026-05-10", product: "Nutmeg ABCD", quantity: "30 MT", value: "$246,000" }
    ]
  },
  {
    buyer_name: "Dutch Botanical Bulk BV",
    company: "Dutch Botanical Bulk BV",
    country: "Netherlands",
    total_volume: "12 MT",
    payment_history: "Good",
    trust_level: 4,
    preferences: "FOB + LC",
    preferred_products: ["Cloves Lal Pari", "Mace Whole"],
    communication_notes: "Excellent communication. Very detailed with specifications. Requires EU phytosanitary certifications.",
    deal_history: [
      { date: "2026-05-16", product: "Cloves Lal Pari", quantity: "12 MT", value: "$109,200" }
    ]
  }
];

const negotiationNotes = [
  {
    buyer_name: "Klausen Spice GmbH",
    date: "2026-05-20",
    category: "Preference",
    content: "Always requests CIF Rotterdam. Never accepts FOB — their in-house logistics cannot handle port clearance in Indonesia.",
    tags: ["cif", "rotterdam", "logistics"]
  },
  {
    buyer_name: "Gulf Aromatics LLC",
    date: "2026-05-18",
    category: "Risk",
    content: "Has delayed LC confirmation twice. Always negotiate minimum 30% advance TT before releasing cargo.",
    tags: ["lc-delay", "advance-payment", "high-risk"]
  },
  {
    buyer_name: "Tokyo Organic Imports",
    date: "2026-05-15",
    category: "Payment",
    content: "Payment arrives 5-7 days after BL presentation. Their bank (MUFG Tokyo) processes on Tuesdays and Thursdays only.",
    tags: ["mufg", "payment-delay", "bl"]
  },
  {
    buyer_name: "Dutch Botanical Bulk BV",
    date: "2026-05-14",
    category: "Opportunity",
    content: "Expressed interest in 3-year supply contract for Cloves. Volumes could be 40-50 MT/year.",
    tags: ["long-term-contract", "high-volume", "strategic"]
  },
  {
    buyer_name: "Sultan Spice Co.",
    date: "2026-05-22",
    category: "Risk",
    content: "Company registered address changed recently. Verify updated bank account details before next TT payment. Potential fraud indicator.",
    tags: ["fraud-indicator", "verify", "caution"]
  },
  {
    buyer_name: "Klausen Spice GmbH",
    date: "2026-03-05",
    category: "General",
    content: "Key contact: Marcus Weber (Head of Procurement). Always copy Lena Schmidt (Finance) on formal documents.",
    tags: ["contact", "marcus-weber", "key-person"]
  }
];

// 3. Clear existing and seed data function
async function seedDatabase() {
  console.log("⚡ Starting Firebase Firestore seeding...");

  // Write demo profile
  console.log(`👤 Seeding profile for UID: ${DEMO_UID}`);
  await db.collection("profiles").doc(DEMO_UID).set(profileData);

  // Helper function to delete old and write new docs
  const seedCollection = async (colName, dataList) => {
    console.log(`📁 Seeding collection: ${colName}...`);

    // Clear existing for this demo user
    const snapshot = await db.collection(colName).where("user_id", "==", DEMO_UID).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🧹 Cleared ${snapshot.size} old records in ${colName}`);

    // Seed new
    let count = 0;
    for (const item of dataList) {
      const docRef = db.collection(colName).doc();
      await docRef.set({
        id: docRef.id,
        user_id: DEMO_UID,
        ...item,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    }
    console.log(`✓ Seeded ${count} records into ${colName}`);
  };

  await seedCollection("buyer_inquiries", inquiries);
  await seedCollection("shipment_tracker", shipments);
  await seedCollection("suppliers", suppliers);
  await seedCollection("buyer_crm", buyerCrms);
  await seedCollection("negotiation_notes", negotiationNotes);

  console.log("🎉 Seeding completed successfully!");
}

seedDatabase().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
