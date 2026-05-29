// ============================================================
// EXOPILOT — Shared TypeScript Models for Monorepo
// ============================================================

export type InquiryStatus =
  | "New Inquiry"
  | "Negotiating"
  | "Sample Sent"
  | "Waiting Payment"
  | "Closed Deal"
  | "Lost";

export type InquirySource =
  | "Alibaba"
  | "LinkedIn"
  | "Facebook"
  | "Direct"
  | "Website"
  | "Other";

export interface Inquiry {
  id: string;
  buyerName: string;
  country: string;
  product: string;
  quantity: string;
  price: string;
  status: InquiryStatus;
  source: InquirySource;
  date: string;
  lastContactDate: string;
  followUpReminderDate?: string;
  negotiationNotes?: string;
}

export type ShipmentStatus =
  | "Preparing"
  | "Customs Clearance"
  | "On Vessel"
  | "Arrived"
  | "Completed";

export interface ShipmentDocument {
  type: string;
  uploaded: boolean;
}

export interface Shipment {
  id: string;
  containerNumber: string;
  shippingLine: string;
  commodity: string;
  status: ShipmentStatus;
  etd: string;
  eta: string;
  portOrigin: string;
  portDestination: string;
  buyerName?: string;
  documents: ShipmentDocument[];
}

export type QualityGrade = "A" | "B" | "C";

export interface SupplierTransaction {
  date: string;
  quantity: string;
  amount: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  product: string;
  supplyCapacity: string;
  lastPrice: string;
  qualityGrade: QualityGrade;
  reliabilityScore: number;
  legalDocs: boolean;
  notes: string;
  transactionHistory: SupplierTransaction[];
  createdAt: string;
}

export interface BuyerDeal {
  date: string;
  product: string;
  quantity: string;
  value: string;
}

export type PaymentRating = "Excellent" | "Good" | "Average" | "Poor";

export interface BuyerCRM {
  id: string;
  buyerName: string;
  company: string;
  country: string;
  dealHistory: BuyerDeal[];
  totalVolume: string;
  paymentHistory: PaymentRating;
  preferredProducts: string[];
  communicationNotes: string;
  trustLevel: 1 | 2 | 3 | 4 | 5;
  preferences: string;
}

export interface PriceDataPoint {
  date: string;
  price: number;
}

export interface CommodityPrice {
  commodity: string;
  currentPrice: number;
  currency: string;
  unit: string;
  change24h: number;
  change7d: number;
  historicalData: PriceDataPoint[];
}

export type NoteCategory =
  | "Preference"
  | "Risk"
  | "Opportunity"
  | "Payment"
  | "General";

export interface NegotiationNote {
  id: string;
  buyerName: string;
  date: string;
  category: NoteCategory;
  content: string;
  tags: string[];
}

export interface DashboardSummary {
  totalInquiries: number;
  activeShipments: number;
  closedDeals: number;
  pipelineValue: string;
  sourcingSuppliers: number;
  monthlyIncreaseRate: string;
  followUpsDueToday: number;
  activeCommodities: number;
}

export type ActiveSection = "live-app" | "blueprints";

export type AppTab =
  | "dashboard"
  | "inquiries"
  | "buyer-crm"
  | "shipments"
  | "suppliers"
  | "commodities"
  | "doc-generator"
  | "negotiation-notes"
  | "settings";

export type BlueprintTab =
  | "sql-schema"
  | "go-backend"
  | "nextjs-dashboard"
  | "nextjs-api-route";

export interface SessionUser {
  name: string;
  email: string;
  businessName: string;
}

export interface SystemAlert {
  message: string;
  type: "success" | "error" | null;
}
