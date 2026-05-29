// Firebase Firestore utilities and types
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  QueryConstraint
} from "firebase/firestore";
import { db } from "@/firebase.config";
import { sanitizeTextField } from "./security";

// Guard: db is null during SSR/build — these functions are only called from client-side
function getDb() {
  if (!db) throw new Error("Firebase Firestore is not initialized — call from client side only");
  return db;
}

// ============================================================
// TYPES
// ============================================================

export interface Profile {
  id: string; // Firebase UID
  company_name: string;
  main_commodity: string;
  phone_number?: string;
  legal_entity_type: string;
  photo_url?: string;
  google_form_url?: string; // User's own Google Form URL for buyer reviews
  role?: "user" | "admin";
  disabled?: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BuyerInquiry {
  id: string;
  user_id: string;
  buyer_name: string;
  country: string;
  product: string;
  quantity: string;
  status: "New" | "Negotiating" | "Closed";
  price_offer?: string;
  notes?: string;
  negotiation_notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ShipmentTracker {
  id: string;
  user_id: string;
  container_number: string;
  shipping_line: string;
  commodity: string;
  status: "Customs" | "On Vessel" | "Arrived";
  etd: Timestamp;
  eta: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  location: string;
  supply_capacity: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================
// PROFILES
// ============================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const docRef = doc(getDb(), "profiles", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Profile) : null;
}

export async function createProfile(userId: string, data: Omit<Profile, "id" | "created_at" | "updated_at">) {
  const docRef = doc(getDb(), "profiles", userId);
  await setDoc(docRef, {
    company_name: sanitizeTextField(data.company_name, 150),
    main_commodity: sanitizeTextField(data.main_commodity, 100),
    phone_number: data.phone_number ? sanitizeTextField(data.phone_number, 30) : "",
    legal_entity_type: sanitizeTextField(data.legal_entity_type, 50),
    photo_url: data.photo_url ? sanitizeTextField(data.photo_url, 200000) : "",
    role: data.role || "user",
    disabled: data.disabled || false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
}

export async function updateProfile(userId: string, data: Partial<Profile>) {
  const docRef = doc(getDb(), "profiles", userId);
  const sanitized: Partial<Profile> = {};
  if (data.company_name !== undefined) sanitized.company_name = sanitizeTextField(data.company_name, 150);
  if (data.main_commodity !== undefined) sanitized.main_commodity = sanitizeTextField(data.main_commodity, 100);
  if (data.phone_number !== undefined) sanitized.phone_number = sanitizeTextField(data.phone_number, 30);
  if (data.legal_entity_type !== undefined) sanitized.legal_entity_type = sanitizeTextField(data.legal_entity_type, 50);
  if (data.photo_url !== undefined) sanitized.photo_url = sanitizeTextField(data.photo_url, 200000);
  if (data.google_form_url !== undefined) sanitized.google_form_url = sanitizeTextField(data.google_form_url, 500);
  if (data.role !== undefined) sanitized.role = data.role;
  if (data.disabled !== undefined) sanitized.disabled = data.disabled;

  await updateDoc(docRef, {
    ...sanitized,
    updated_at: Timestamp.now(),
  });
}

// ============================================================
// BUYER INQUIRIES
// ============================================================

export async function getBuyerInquiries(userId: string): Promise<BuyerInquiry[]> {
  const q = query(
    collection(getDb(), "buyer_inquiries"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as BuyerInquiry));
}

export async function createBuyerInquiry(userId: string, data: Omit<BuyerInquiry, "id" | "user_id" | "created_at" | "updated_at">) {
  const docRef = doc(collection(getDb(), "buyer_inquiries"));
  await setDoc(docRef, {
    user_id: userId,
    buyer_name: sanitizeTextField(data.buyer_name, 150),
    country: sanitizeTextField(data.country, 100),
    product: sanitizeTextField(data.product, 150),
    quantity: sanitizeTextField(data.quantity, 50),
    status: data.status,
    price_offer: data.price_offer ? sanitizeTextField(data.price_offer, 50) : "",
    notes: data.notes ? sanitizeTextField(data.notes, 1000) : "",
    negotiation_notes: data.negotiation_notes ? sanitizeTextField(data.negotiation_notes, 1000) : "",
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateBuyerInquiry(inquiryId: string, data: Partial<BuyerInquiry>) {
  const docRef = doc(getDb(), "buyer_inquiries", inquiryId);
  const sanitized: any = {};
  if (data.buyer_name !== undefined) sanitized.buyer_name = sanitizeTextField(data.buyer_name, 150);
  if (data.country !== undefined) sanitized.country = sanitizeTextField(data.country, 100);
  if (data.product !== undefined) sanitized.product = sanitizeTextField(data.product, 150);
  if (data.quantity !== undefined) sanitized.quantity = sanitizeTextField(data.quantity, 50);
  if (data.status !== undefined) sanitized.status = data.status;
  if (data.price_offer !== undefined) sanitized.price_offer = sanitizeTextField(data.price_offer, 50);
  if (data.notes !== undefined) sanitized.notes = sanitizeTextField(data.notes, 1000);
  if (data.negotiation_notes !== undefined) sanitized.negotiation_notes = sanitizeTextField(data.negotiation_notes, 1000);

  await updateDoc(docRef, {
    ...sanitized,
    updated_at: Timestamp.now(),
  });
}

export async function deleteBuyerInquiry(inquiryId: string) {
  const docRef = doc(getDb(), "buyer_inquiries", inquiryId);
  await deleteDoc(docRef);
}

// ============================================================
// SHIPMENT TRACKER
// ============================================================

export async function getShipments(userId: string): Promise<ShipmentTracker[]> {
  const q = query(
    collection(getDb(), "shipment_tracker"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShipmentTracker));
}

export async function createShipment(userId: string, data: Omit<ShipmentTracker, "id" | "user_id" | "created_at" | "updated_at">) {
  const docRef = doc(collection(getDb(), "shipment_tracker"));
  await setDoc(docRef, {
    user_id: userId,
    container_number: sanitizeTextField(data.container_number, 50),
    shipping_line: sanitizeTextField(data.shipping_line, 100),
    commodity: sanitizeTextField(data.commodity, 100),
    status: data.status,
    etd: data.etd,
    eta: data.eta,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateShipment(shipmentId: string, data: Partial<ShipmentTracker>) {
  const docRef = doc(getDb(), "shipment_tracker", shipmentId);
  const sanitized: any = {};
  if (data.container_number !== undefined) sanitized.container_number = sanitizeTextField(data.container_number, 50);
  if (data.shipping_line !== undefined) sanitized.shipping_line = sanitizeTextField(data.shipping_line, 100);
  if (data.commodity !== undefined) sanitized.commodity = sanitizeTextField(data.commodity, 100);
  if (data.status !== undefined) sanitized.status = data.status;
  if (data.etd !== undefined) sanitized.etd = data.etd;
  if (data.eta !== undefined) sanitized.eta = data.eta;

  await updateDoc(docRef, {
    ...sanitized,
    updated_at: Timestamp.now(),
  });
}

// ============================================================
// SUPPLIERS
// ============================================================

export async function getSuppliers(userId: string): Promise<Supplier[]> {
  const q = query(
    collection(getDb(), "suppliers"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
}

export async function createSupplier(userId: string, data: Omit<Supplier, "id" | "user_id" | "created_at" | "updated_at">) {
  const docRef = doc(collection(getDb(), "suppliers"));
  await setDoc(docRef, {
    user_id: userId,
    name: sanitizeTextField(data.name, 150),
    location: sanitizeTextField(data.location, 200),
    supply_capacity: sanitizeTextField(data.supply_capacity, 100),
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSupplier(supplierId: string, data: Partial<Supplier>) {
  const docRef = doc(getDb(), "suppliers", supplierId);
  const sanitized: any = {};
  if (data.name !== undefined) sanitized.name = sanitizeTextField(data.name, 150);
  if (data.location !== undefined) sanitized.location = sanitizeTextField(data.location, 200);
  if (data.supply_capacity !== undefined) sanitized.supply_capacity = sanitizeTextField(data.supply_capacity, 100);

  await updateDoc(docRef, {
    ...sanitized,
    updated_at: Timestamp.now(),
  });
}

export async function deleteSupplier(supplierId: string) {
  const docRef = doc(getDb(), "suppliers", supplierId);
  await deleteDoc(docRef);
}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

export async function getAllProfiles(): Promise<Profile[]> {
  const q = query(collection(getDb(), "profiles"), orderBy("company_name", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
}

export async function updateUserRole(uid: string, role: "user" | "admin") {
  const docRef = doc(getDb(), "profiles", uid);
  await updateDoc(docRef, {
    role,
    updated_at: Timestamp.now(),
  });
}

export async function updateUserDisabled(uid: string, disabled: boolean) {
  const docRef = doc(getDb(), "profiles", uid);
  await updateDoc(docRef, {
    disabled,
    updated_at: Timestamp.now(),
  });
}

export async function getAdminStats(): Promise<{ totalUsers: number; totalInquiries: number; totalShipments: number }> {
  const [profilesSnap, inquiriesSnap, shipmentsSnap] = await Promise.all([
    getDocs(collection(getDb(), "profiles")),
    getDocs(collection(getDb(), "buyer_inquiries")),
    getDocs(collection(getDb(), "shipment_tracker")),
  ]);
  return {
    totalUsers: profilesSnap.size,
    totalInquiries: inquiriesSnap.size,
    totalShipments: shipmentsSnap.size,
  };
}
