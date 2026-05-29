package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// ============================================================
// RATE LIMITER - Backend brute-force protection
// ============================================================

type RateLimiterEntry struct {
	attempts      int
	firstAttempt  time.Time
	lockedUntil   time.Time
}

type RateLimiter struct {
	mu       sync.RWMutex
	attempts map[string]*RateLimiterEntry
	// Configuration
	maxAttempts int
	windowSize  time.Duration
	lockoutTime time.Duration
}

func NewRateLimiter(maxAttempts int, windowSize, lockoutTime time.Duration) *RateLimiter {
	rl := &RateLimiter{
		attempts:    make(map[string]*RateLimiterEntry),
		maxAttempts: maxAttempts,
		windowSize:  windowSize,
		lockoutTime: lockoutTime,
	}
	// Clean up old entries every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.cleanup()
		}
	}()
	return rl
}

func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	for key, entry := range rl.attempts {
		if now.Sub(entry.firstAttempt) > rl.windowSize*2 {
			delete(rl.attempts, key)
		}
	}
}

func (rl *RateLimiter) isLocked(key string) bool {
	rl.mu.RLock()
	defer rl.mu.RUnlock()
	if entry, exists := rl.attempts[key]; exists {
		return time.Now().Before(entry.lockedUntil)
	}
	return false
}

func (rl *RateLimiter) recordAttempt(key string) (allowed bool, remaining int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	
	entry, exists := rl.attempts[key]
	if !exists {
		entry = &RateLimiterEntry{
			attempts:     1,
			firstAttempt: now,
		}
		rl.attempts[key] = entry
		return true, rl.maxAttempts - 1
	}
	
	// Check if lockout has expired
	if now.After(entry.lockedUntil) {
		// Check if window has passed
		if now.Sub(entry.firstAttempt) > rl.windowSize {
			entry.attempts = 1
			entry.firstAttempt = now
			entry.lockedUntil = time.Time{}
			rl.attempts[key] = entry
			return true, rl.maxAttempts - 1
		}
	}
	
	// If currently locked, deny
	if now.Before(entry.lockedUntil) {
		return false, 0
	}
	
	// Check if still within window
	if now.Sub(entry.firstAttempt) <= rl.windowSize {
		entry.attempts++
		if entry.attempts >= rl.maxAttempts {
			entry.lockedUntil = now.Add(rl.lockoutTime)
			rl.attempts[key] = entry
			return false, 0
		}
		rl.attempts[key] = entry
		return true, rl.maxAttempts - entry.attempts
	}
	
	// Window expired, reset
	entry.attempts = 1
	entry.firstAttempt = now
	entry.lockedUntil = time.Time{}
	rl.attempts[key] = entry
	return true, rl.maxAttempts - 1
}

// rateLimitMiddleware wraps a handler with rate limiting based on IP or user ID
func (rl *RateLimiter) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use Authorization header if available, otherwise fall back to IP
		key := r.Header.Get("Authorization")
		if key == "" {
			key = r.RemoteAddr
		}
		
		allowed, _ := rl.recordAttempt(key)
		if !allowed {
			w.Header().Set("X-RateLimit-Retry-After", "900") // 15 minutes
			http.Error(w, "Too many requests. Please try again later.", http.StatusTooManyRequests)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

// ============================================================
// DATA MODELS (In-memory Fallback Structures)
// ============================================================

type Inquiry struct {
	ID                   string `json:"id"`
	BuyerName            string `json:"buyerName"`
	Country              string `json:"country"`
	Product              string `json:"product"`
	Quantity             string `json:"quantity"`
	Price                string `json:"price"`
	Status               string `json:"status"`
	Source               string `json:"source"`
	Date                 string `json:"date"`
	LastContactDate      string `json:"lastContactDate"`
	FollowUpReminderDate string `json:"followUpReminderDate,omitempty"`
	NegotiationNotes     string `json:"negotiationNotes,omitempty"`
	FirstEmailSentAt     string `json:"firstEmailSentAt,omitempty"`
}

type ShipmentDocument struct {
	Type     string `json:"type"`
	Uploaded bool   `json:"uploaded"`
}

type Shipment struct {
	ID              string             `json:"id"`
	ContainerNumber string             `json:"containerNumber"`
	ShippingLine    string             `json:"shippingLine"`
	Commodity       string             `json:"commodity"`
	Status          string             `json:"status"`
	ETD             string             `json:"etd"`
	ETA             string             `json:"eta"`
	PortOrigin      string             `json:"portOrigin"`
	PortDestination string             `json:"portDestination"`
	BuyerName       string             `json:"buyerName,omitempty"`
	Documents       []ShipmentDocument `json:"documents"`
}

type BuyerDeal struct {
	Date      string `json:"date"`
	Product   string `json:"product"`
	Quantity  string `json:"quantity"`
	Incoterms string `json:"incoterms"`
	Value     string `json:"value"`
}

type BuyerCRM struct {
	ID                 string      `json:"id"`
	BuyerName          string      `json:"buyerName"`
	Company            string      `json:"company"`
	Country            string      `json:"country"`
	DealHistory        []BuyerDeal `json:"dealHistory"`
	TotalVolume        string      `json:"totalVolume"`
	PaymentHistory     string      `json:"paymentHistory"`
	PreferredProducts  []string    `json:"preferredProducts"`
	CommunicationNotes string      `json:"communicationNotes"`
	TrustLevel         int         `json:"trustLevel"`
	Preferences        string      `json:"preferences"`
}

type PriceDataPoint struct {
	Date  string  `json:"date"`
	Price float64 `json:"price"`
}

type CommodityPrice struct {
	Commodity      string           `json:"commodity"`
	CurrentPrice   float64          `json:"currentPrice"`
	Currency       string           `json:"currency"`
	Unit           string           `json:"unit"`
	Change24h      float64          `json:"change24h"`
	Change7d       float64          `json:"change7d"`
	HistoricalData []PriceDataPoint `json:"historicalData"`
}

type NegotiationNote struct {
	ID        string   `json:"id"`
	BuyerName string   `json:"buyerName"`
	Date      string   `json:"date"`
	Category  string   `json:"category"`
	Content   string   `json:"content"`
	Tags      []string `json:"tags"`
}

type DashboardSummary struct {
	TotalInquiries      int    `json:"totalInquiries"`
	ActiveShipments     int    `json:"activeShipments"`
	ClosedDeals         int    `json:"closedDeals"`
	PipelineValue       string `json:"pipelineValue"`
	SourcingSuppliers   int    `json:"sourcingSuppliers"`
	MonthlyIncreaseRate string `json:"monthlyIncreaseRate"`
	FollowUpsDueToday   int    `json:"followUpsDueToday"`
	ActiveCommodities   int    `json:"activeCommodities"`
}

type SupplierTransaction struct {
	Date     string `json:"date"`
	Product  string `json:"product"`
	Quantity string `json:"quantity"`
	Price    string `json:"price"`
}

type Supplier struct {
	ID                 string                `json:"id"`
	Name               string                `json:"name"`
	Location           string                `json:"location"`
	Product            string                `json:"product"`
	SupplyCapacity     string                `json:"supplyCapacity"`
	LastPrice          string                `json:"lastPrice"`
	QualityGrade       string                `json:"qualityGrade"`
	ReliabilityScore   int                   `json:"reliabilityScore"`
	LegalDocs          bool                  `json:"legalDocs"`
	Notes              string                `json:"notes"`
	TransactionHistory []SupplierTransaction `json:"transactionHistory"`
	CreatedAt          string                `json:"createdAt"`
}

// ============================================================
// SERVER Struct
// ============================================================

type ExopilotServer struct {
	mu               sync.RWMutex
	inquiries        []Inquiry
	shipments        []Shipment
	buyerCRM         []BuyerCRM
	commodityPrices  []CommodityPrice
	negotiationNotes []NegotiationNote
	suppliers        []Supplier
}

func generatePriceHistory(basePrice float64, volatility float64) []PriceDataPoint {
	data := make([]PriceDataPoint, 30)
	price := basePrice * (0.92 + rand.Float64()*0.1)
	base := time.Date(2026, 5, 24, 0, 0, 0, 0, time.UTC)
	for i := 29; i >= 0; i-- {
		d := base.AddDate(0, 0, -i)
		change := (rand.Float64() - 0.5) * volatility
		price = price * (1 + change)
		data[29-i] = PriceDataPoint{
			Date:  d.Format("2006-01-02"),
			Price: math.Round(price),
		}
	}
	return data
}

func NewExopilotServer() *ExopilotServer {
	return &ExopilotServer{
		inquiries: []Inquiry{
			{ID: "inq_1", BuyerName: "Klausen Spice GmbH", Country: "Germany", Product: "Nutmeg (ABCD Grade)", Quantity: "15 MT", Price: "$8,500/MT", Status: "Negotiating", Source: "Alibaba", Date: "2026-05-18", LastContactDate: "2026-05-21", FollowUpReminderDate: "2026-05-24", NegotiationNotes: "Negotiating final payment terms (CAD vs 30% advance). Wants CIF Rotterdam."},
			{ID: "inq_2", BuyerName: "Tokyo Organic Imports", Country: "Japan", Product: "Cloves (Lal Pari Grade)", Quantity: "8 MT", Price: "$9,200/MT", Status: "Closed Deal", Source: "LinkedIn", Date: "2026-05-20", LastContactDate: "2026-05-20", NegotiationNotes: "Contract signed! LC opened. Container booking confirmed with Maersk."},
			{ID: "inq_3", BuyerName: "Singapore Spice Trading Hub", Country: "Singapore", Product: "Mace (Whole High Grade)", Quantity: "2 MT", Price: "$14,000/MT", Status: "New Inquiry", Source: "Direct", Date: "2026-05-22", LastContactDate: "2026-05-22", FollowUpReminderDate: "2026-05-25", NegotiationNotes: "Requested free shipping sample. Prefers CIF terminal delivery."},
			{ID: "inq_4", BuyerName: "Sultan Spice Co.", Country: "Turkey", Product: "Cassia Cinnamon (Split)", Quantity: "20 MT", Price: "$4,200/MT", Status: "Negotiating", Source: "Facebook", Date: "2026-05-23", LastContactDate: "2026-05-23", FollowUpReminderDate: "2026-05-23", NegotiationNotes: "Negotiating port of loading Belawan vs Tanjung Priok."},
			{ID: "inq_5", BuyerName: "Dutch Botanical Bulk BV", Country: "Netherlands", Product: "Cloves (Lal Pari Grade)", Quantity: "12 MT", Price: "$9,100/MT", Status: "Sample Sent", Source: "Website", Date: "2026-05-16", LastContactDate: "2026-05-19", FollowUpReminderDate: "2026-05-26", NegotiationNotes: "Sample dispatched via DHL. Awaiting quality approval."},
			{ID: "inq_6", BuyerName: "Gulf Aromatics LLC", Country: "UAE", Product: "Nutmeg (ABCD Grade)", Quantity: "30 MT", Price: "$8,200/MT", Status: "Waiting Payment", Source: "LinkedIn", Date: "2026-05-10", LastContactDate: "2026-05-20", NegotiationNotes: "LC opened at Dubai Islamic Bank. Awaiting SWIFT confirmation."},
		},
		shipments: []Shipment{
			{ID: "ship_1", ContainerNumber: "EMCU8902143", ShippingLine: "Evergreen", Commodity: "Nutmeg", Status: "On Vessel", ETD: "2026-05-10", ETA: "2026-06-05", PortOrigin: "Tanjung Priok, Jakarta", PortDestination: "Port of Rotterdam, Netherlands", BuyerName: "Klausen Spice GmbH", Documents: []ShipmentDocument{{Type: "Bill of Lading", Uploaded: true}, {Type: "Commercial Invoice", Uploaded: true}, {Type: "Packing List", Uploaded: false}}},
			{ID: "ship_2", ContainerNumber: "MSKU4723920", ShippingLine: "Maersk", Commodity: "Cloves", Status: "Customs Clearance", ETD: "2026-05-21", ETA: "2026-06-18", PortOrigin: "Tanjung Priok, Jakarta", PortDestination: "Port of Tokyo, Japan", BuyerName: "Tokyo Organic Imports", Documents: []ShipmentDocument{{Type: "Bill of Lading", Uploaded: false}, {Type: "Commercial Invoice", Uploaded: true}, {Type: "Packing List", Uploaded: false}}},
			{ID: "ship_3", ContainerNumber: "OOLU5612849", ShippingLine: "OOCL", Commodity: "Mace", Status: "Arrived", ETD: "2026-04-25", ETA: "2026-05-22", PortOrigin: "Tanjung Perak, Surabaya", PortDestination: "Port of Singapore", BuyerName: "Singapore Spice Trading Hub", Documents: []ShipmentDocument{{Type: "Bill of Lading", Uploaded: true}, {Type: "Commercial Invoice", Uploaded: true}, {Type: "Packing List", Uploaded: true}}},
			{ID: "ship_4", ContainerNumber: "HLXU3291047", ShippingLine: "Hapag-Lloyd", Commodity: "Cinnamon", Status: "Preparing", ETD: "2026-06-02", ETA: "2026-07-01", PortOrigin: "Belawan, Medan", PortDestination: "Port of Istanbul, Turkey", BuyerName: "Sultan Spice Co.", Documents: []ShipmentDocument{{Type: "Bill of Lading", Uploaded: false}, {Type: "Commercial Invoice", Uploaded: false}, {Type: "Packing List", Uploaded: false}}},
		},
		buyerCRM: []BuyerCRM{
			{ID: "crm_1", BuyerName: "Klausen Spice GmbH", Company: "Klausen Spice GmbH", Country: "Germany", TotalVolume: "53 MT", PaymentHistory: "Excellent", TrustLevel: 5, Preferences: "CIF + LC", PreferredProducts: []string{"Nutmeg ABCD", "Mace Whole"}, CommunicationNotes: "Very professional. Responds within 24h. Always pays on LC, never delays. Prefers CIF Rotterdam.", DealHistory: []BuyerDeal{{Date: "2026-05-18", Product: "Nutmeg ABCD", Quantity: "15 MT", Incoterms: "CIF", Value: "$127,500"}, {Date: "2026-02-10", Product: "Nutmeg ABCD", Quantity: "20 MT", Incoterms: "FOB", Value: "$168,000"}, {Date: "2026-11-05", Product: "Mace Whole", Quantity: "8 MT", Incoterms: "CIF", Value: "$112,000"}}},
			{ID: "crm_2", BuyerName: "Tokyo Organic Imports", Company: "Tokyo Organic Imports K.K.", Country: "Japan", TotalVolume: "24 MT", PaymentHistory: "Good", TrustLevel: 4, Preferences: "FOB + TT", PreferredProducts: []string{"Cloves Lal Pari", "Nutmeg ABCD"}, CommunicationNotes: "Formal and polite. Responds within 48h. Occasional payment delay (5-7 days) but always pays.", DealHistory: []BuyerDeal{{Date: "2026-05-20", Product: "Cloves Lal Pari", Quantity: "8 MT", Incoterms: "FOB", Value: "$73,600"}, {Date: "2026-01-15", Product: "Nutmeg ABCD", Quantity: "10 MT", Incoterms: "FOB", Value: "$84,000"}}},
			{ID: "crm_3", BuyerName: "Gulf Aromatics LLC", Company: "Gulf Aromatics LLC", Country: "UAE", TotalVolume: "30 MT", PaymentHistory: "Average", TrustLevel: 3, Preferences: "CIF + TT", PreferredProducts: []string{"Nutmeg ABCD", "Cassia Cinnamon"}, CommunicationNotes: "Can be slow to respond (3-5 days). Aggressive price negotiation. Has delayed LC confirmation twice.", DealHistory: []BuyerDeal{{Date: "2026-05-10", Product: "Nutmeg ABCD", Quantity: "30 MT", Incoterms: "CIF", Value: "$246,000"}}},
			{ID: "crm_4", BuyerName: "Dutch Botanical Bulk BV", Company: "Dutch Botanical Bulk BV", Country: "Netherlands", TotalVolume: "12 MT", PaymentHistory: "Good", TrustLevel: 4, Preferences: "FOB + LC", PreferredProducts: []string{"Cloves Lal Pari", "Mace Whole"}, CommunicationNotes: "Excellent communication. Very detailed with specifications. Requires EU phytosanitary certifications.", DealHistory: []BuyerDeal{{Date: "2026-05-16", Product: "Cloves Lal Pari", Quantity: "12 MT", Incoterms: "FOB", Value: "$109,200"}}},
		},
		commodityPrices: []CommodityPrice{
			{Commodity: "Nutmeg", CurrentPrice: 8500, Currency: "USD", Unit: "MT", Change24h: 1.2, Change7d: -2.4, HistoricalData: generatePriceHistory(8500, 0.025)},
			{Commodity: "Cloves", CurrentPrice: 9200, Currency: "USD", Unit: "MT", Change24h: -0.8, Change7d: 3.1, HistoricalData: generatePriceHistory(9200, 0.03)},
			{Commodity: "Coconut", CurrentPrice: 1200, Currency: "USD", Unit: "MT", Change24h: 0.3, Change7d: 1.5, HistoricalData: generatePriceHistory(1200, 0.02)},
			{Commodity: "Coffee", CurrentPrice: 6800, Currency: "USD", Unit: "MT", Change24h: 2.1, Change7d: 4.7, HistoricalData: generatePriceHistory(6800, 0.035)},
			{Commodity: "Cocoa", CurrentPrice: 9400, Currency: "USD", Unit: "MT", Change24h: -1.5, Change7d: -5.2, HistoricalData: generatePriceHistory(9400, 0.04)},
			{Commodity: "Mace", CurrentPrice: 14000, Currency: "USD", Unit: "MT", Change24h: 0.7, Change7d: 2.3, HistoricalData: generatePriceHistory(14000, 0.02)},
			{Commodity: "Cinnamon", CurrentPrice: 4200, Currency: "USD", Unit: "MT", Change24h: -0.4, Change7d: 1.1, HistoricalData: generatePriceHistory(4200, 0.022)},
		},
		negotiationNotes: []NegotiationNote{
			{ID: "note_1", BuyerName: "Klausen Spice GmbH", Date: "2026-05-20", Category: "Preference", Content: "Always requests CIF Rotterdam. Never accepts FOB — their in-house logistics cannot handle port clearance in Indonesia.", Tags: []string{"cif", "rotterdam", "logistics"}},
			{ID: "note_2", BuyerName: "Gulf Aromatics LLC", Date: "2026-05-18", Category: "Risk", Content: "Has delayed LC confirmation twice. Always negotiate minimum 30% advance TT before releasing cargo.", Tags: []string{"lc-delay", "advance-payment", "high-risk"}},
			{ID: "note_3", BuyerName: "Tokyo Organic Imports", Date: "2026-05-15", Category: "Payment", Content: "Payment arrives 5-7 days after BL presentation. Their bank (MUFG Tokyo) processes on Tuesdays and Thursdays only.", Tags: []string{"mufg", "payment-delay", "bl"}},
			{ID: "note_4", BuyerName: "Dutch Botanical Bulk BV", Date: "2026-05-14", Category: "Opportunity", Content: "Expressed interest in 3-year supply contract for Cloves. Volumes could be 40-50 MT/year.", Tags: []string{"long-term-contract", "high-volume", "strategic"}},
			{ID: "note_5", BuyerName: "Sultan Spice Co.", Date: "2026-05-22", Category: "Risk", Content: "Company registered address changed recently. Verify updated bank account details before next TT payment. Potential fraud indicator.", Tags: []string{"fraud-indicator", "verify", "caution"}},
			{ID: "note_6", BuyerName: "Klausen Spice GmbH", Date: "2026-03-05", Category: "General", Content: "Key contact: Marcus Weber (Head of Procurement). Always copy Lena Schmidt (Finance) on formal documents.", Tags: []string{"contact", "marcus-weber", "key-person"}},
		},
		suppliers: []Supplier{
			{ID: "sup_1", Name: "PT Maluku Spice Mandiri", Location: "Ambon, Maluku", Product: "Nutmeg (ABCD Grade)", SupplyCapacity: "50 MT/month", LastPrice: "$7,800/MT", QualityGrade: "A", ReliabilityScore: 5, LegalDocs: true, Notes: "Top-tier nutmeg supplier. SGS certified. Consistent quality over 3 years.", TransactionHistory: []SupplierTransaction{{Date: "2026-05-10", Product: "Nutmeg ABCD", Quantity: "20 MT", Price: "$156,000"}, {Date: "2026-03-15", Product: "Nutmeg ABCD", Quantity: "15 MT", Price: "$117,000"}}, CreatedAt: "2026-01-15"},
			{ID: "sup_2", Name: "CV Cengkeh Nusantara", Location: "Minahasa, North Sulawesi", Product: "Cloves (Lal Pari Grade)", SupplyCapacity: "30 MT/month", LastPrice: "$8,500/MT", QualityGrade: "A", ReliabilityScore: 4, LegalDocs: true, Notes: "Reliable clove supplier. Occasional delays during rainy season (Nov-Feb).", TransactionHistory: []SupplierTransaction{{Date: "2026-05-18", Product: "Cloves Lal Pari", Quantity: "10 MT", Price: "$85,000"}}, CreatedAt: "2026-02-01"},
			{ID: "sup_3", Name: "Tani Banda Aceh Cooperative", Location: "Banda Aceh, Aceh", Product: "Mace (Whole High Grade)", SupplyCapacity: "8 MT/month", LastPrice: "$12,500/MT", QualityGrade: "B", ReliabilityScore: 3, LegalDocs: false, Notes: "Small cooperative. Excellent mace quality but limited capacity. Legal docs pending.", TransactionHistory: []SupplierTransaction{{Date: "2026-04-20", Product: "Mace Whole", Quantity: "3 MT", Price: "$37,500"}}, CreatedAt: "2026-03-10"},
			{ID: "sup_4", Name: "PT Kayu Manis Kerinci", Location: "Kerinci, Jambi", Product: "Cassia Cinnamon (Split)", SupplyCapacity: "40 MT/month", LastPrice: "$3,800/MT", QualityGrade: "A", ReliabilityScore: 5, LegalDocs: true, Notes: "Largest cassia supplier in Sumatra. Phytosanitary certified. Very reliable.", TransactionHistory: []SupplierTransaction{{Date: "2026-05-20", Product: "Cassia Split", Quantity: "25 MT", Price: "$95,000"}, {Date: "2026-04-05", Product: "Cassia Split", Quantity: "20 MT", Price: "$76,000"}}, CreatedAt: "2026-11-20"},
		},
	}
}

// ============================================================
// CORS MIDDLEWARE
// ============================================================

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ============================================================
// HELPERS
// ============================================================

func (s *ExopilotServer) writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *ExopilotServer) writeError(w http.ResponseWriter, status int, msg string) {
	s.writeJSON(w, status, map[string]string{"error": msg})
}

func todayStr() string {
	return time.Now().UTC().Format("2006-01-02")
}

// getUserID extracts the user UID from the Firebase Authorization header
// Returns an error if the token is missing, malformed, or fails verification
func (s *ExopilotServer) getUserID(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("missing authorization header")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("invalid bearer token format")
	}

	tokenStr := parts[1]
	if authClient == nil {
		// Only allow demo mode if explicitly configured for local development
		if os.Getenv("ALLOW_DEMO_MODE") == "true" {
			return "demo-user", nil
		}
		return "", fmt.Errorf("auth client not initialized")
	}

	token, err := authClient.VerifyIDToken(ctx, tokenStr)
	if err != nil {
		log.Printf("Token verification failed: %v", err)
		return "", fmt.Errorf("token verification failed: %w", err)
	}

	return token.UID, nil
}

// seedUserFirestore loads mock data into the user's Firestore collections if they are totally empty
func (s *ExopilotServer) seedUserFirestore(userID string) {
	if fsClient == nil {
		return
	}

	// 1. Inquiries
	inqs, err := GetBuyerInquiries(userID)
	if err == nil && len(inqs) == 0 {
		log.Printf("Seeding initial mock inquiries for user: %s", userID)
		for _, inq := range s.inquiries {
			fbi := FBInquiry{
				BuyerName:            inq.BuyerName,
				Country:              inq.Country,
				Product:              inq.Product,
				Quantity:             inq.Quantity,
				Price:                inq.Price,
				Status:               inq.Status,
				Source:               inq.Source,
				Date:                 inq.Date,
				LastContactDate:      inq.LastContactDate,
				FollowUpReminderDate: inq.FollowUpReminderDate,
				NegotiationNotes:     inq.NegotiationNotes,
				FirstEmailSentAt:     inq.FirstEmailSentAt,
			}
			_, _ = CreateBuyerInquiry(userID, &fbi)
		}
	}

	// 2. Shipments
	ships, err := GetShipments(userID)
	if err == nil && len(ships) == 0 {
		log.Printf("Seeding initial mock shipments for user: %s", userID)
		for _, sh := range s.shipments {
			docs := make([]FBShipmentDocument, len(sh.Documents))
			for i, d := range sh.Documents {
				docs[i] = FBShipmentDocument{Type: d.Type, Uploaded: d.Uploaded}
			}
			fbs := FBShipment{
				ContainerNumber: sh.ContainerNumber,
				ShippingLine:    sh.ShippingLine,
				Commodity:       sh.Commodity,
				Status:          sh.Status,
				ETD:             sh.ETD,
				ETA:             sh.ETA,
				PortOrigin:      sh.PortOrigin,
				PortDestination: sh.PortDestination,
				BuyerName:       sh.BuyerName,
				Documents:       docs,
			}
			_, _ = CreateShipment(userID, &fbs)
		}
	}

	// 3. Suppliers
	sups, err := GetSuppliers(userID)
	if err == nil && len(sups) == 0 {
		log.Printf("Seeding initial mock suppliers for user: %s", userID)
		for _, sup := range s.suppliers {
			txs := make([]FBSupplierTransaction, len(sup.TransactionHistory))
			for i, t := range sup.TransactionHistory {
				txs[i] = FBSupplierTransaction{Date: t.Date, Product: t.Product, Quantity: t.Quantity, Price: t.Price}
			}
			fbsup := FBSupplier{
				Name:               sup.Name,
				Location:           sup.Location,
				Product:            sup.Product,
				SupplyCapacity:     sup.SupplyCapacity,
				LastPrice:          sup.LastPrice,
				QualityGrade:       sup.QualityGrade,
				ReliabilityScore:   sup.ReliabilityScore,
				LegalDocs:          sup.LegalDocs,
				Notes:              sup.Notes,
				TransactionHistory: txs,
				CreatedAt:          sup.CreatedAt,
			}
			_, _ = CreateSupplier(userID, &fbsup)
		}
	}

	// 4. Buyer CRM
	crms, err := GetBuyerCRMs(userID)
	if err == nil && len(crms) == 0 {
		log.Printf("Seeding initial mock buyer crm for user: %s", userID)
		for _, crm := range s.buyerCRM {
			deals := make([]FBBuyerDeal, len(crm.DealHistory))
			for i, d := range crm.DealHistory {
				deals[i] = FBBuyerDeal{Date: d.Date, Product: d.Product, Quantity: d.Quantity, Value: d.Value}
			}
			fbc := FBBuyerCRM{
				BuyerName:          crm.BuyerName,
				Company:            crm.Company,
				Country:            crm.Country,
				DealHistory:        deals,
				TotalVolume:        crm.TotalVolume,
				PaymentHistory:     crm.PaymentHistory,
				PreferredProducts:  crm.PreferredProducts,
				CommunicationNotes: crm.CommunicationNotes,
				TrustLevel:         crm.TrustLevel,
				Preferences:        crm.Preferences,
			}
			_, _ = CreateBuyerCRM(userID, &fbc)
		}
	}

	// 5. Negotiation Notes
	notes, err := GetNegotiationNotes(userID)
	if err == nil && len(notes) == 0 {
		log.Printf("Seeding initial mock negotiation notes for user: %s", userID)
		for _, note := range s.negotiationNotes {
			fbn := FBNegotiationNote{
				BuyerName: note.BuyerName,
				Date:      note.Date,
				Category:  note.Category,
				Content:   note.Content,
				Tags:      note.Tags,
			}
			_, _ = CreateNegotiationNote(userID, &fbn)
		}
	}
}

// ============================================================
// HANDLERS: DASHBOARD
// ============================================================

func (s *ExopilotServer) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	// If Firestore is connected, fetch live Firestore data!
	if fsClient != nil {
		s.seedUserFirestore(userID)

		inquiries, err1 := GetBuyerInquiries(userID)
		shipments, err2 := GetShipments(userID)
		suppliers, err3 := GetSuppliers(userID)
		buyerCRM, err4 := GetBuyerCRMs(userID)
		negotiationNotes, err5 := GetNegotiationNotes(userID)

		if err1 == nil && err2 == nil && err3 == nil && err4 == nil && err5 == nil {
			today := todayStr()
			activeShipments := 0
			for _, sh := range shipments {
				if sh.Status != "Arrived" && sh.Status != "Completed" {
					activeShipments++
				}
			}
			closedDeals := 0
			followUpsDue := 0
			for _, inq := range inquiries {
				if inq.Status == "Closed Deal" {
					closedDeals++
				}
				if inq.FollowUpReminderDate != "" && inq.FollowUpReminderDate <= today && inq.Status != "Closed Deal" && inq.Status != "Lost" {
					followUpsDue++
				}
			}

			s.writeJSON(w, http.StatusOK, map[string]any{
				"summary": DashboardSummary{
					TotalInquiries:      len(inquiries),
					ActiveShipments:     activeShipments,
					ClosedDeals:         closedDeals,
					PipelineValue:       "$2,847,500",
					SourcingSuppliers:   len(suppliers),
					MonthlyIncreaseRate: "+18.2%",
					FollowUpsDueToday:   followUpsDue,
					ActiveCommodities:   len(s.commodityPrices),
				},
				"inquiries":        inquiries,
				"shipments":        shipments,
				"buyerCRM":         buyerCRM,
				"commodityPrices":  s.commodityPrices,
				"negotiationNotes": negotiationNotes,
				"suppliers":        suppliers,
			})
			return
		}
	}

	// Fallback to in-memory
	s.mu.RLock()
	defer s.mu.RUnlock()

	today := todayStr()
	activeShipments := 0
	for _, sh := range s.shipments {
		if sh.Status != "Arrived" && sh.Status != "Completed" {
			activeShipments++
		}
	}
	closedDeals := 0
	followUpsDue := 0
	for _, inq := range s.inquiries {
		if inq.Status == "Closed Deal" {
			closedDeals++
		}
		if inq.FollowUpReminderDate != "" && inq.FollowUpReminderDate <= today && inq.Status != "Closed Deal" && inq.Status != "Lost" {
			followUpsDue++
		}
	}

	s.writeJSON(w, http.StatusOK, map[string]any{
		"summary": DashboardSummary{
			TotalInquiries:      len(s.inquiries),
			ActiveShipments:     activeShipments,
			ClosedDeals:         closedDeals,
			PipelineValue:       "$2,847,500",
			SourcingSuppliers:   len(s.suppliers),
			MonthlyIncreaseRate: "+18.2%",
			FollowUpsDueToday:   followUpsDue,
			ActiveCommodities:   len(s.commodityPrices),
		},
		"inquiries":        s.inquiries,
		"shipments":        s.shipments,
		"buyerCRM":         s.buyerCRM,
		"commodityPrices":  s.commodityPrices,
		"negotiationNotes": s.negotiationNotes,
		"suppliers":        s.suppliers,
	})
}

// ============================================================
// HANDLERS: INQUIRIES
// ============================================================

func (s *ExopilotServer) handleInquiries(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodGet:
		if fsClient != nil {
			inquiries, err := GetBuyerInquiries(userID)
			if err == nil {
				s.writeJSON(w, http.StatusOK, map[string]any{"inquiries": inquiries})
				return
			}
		}

		s.mu.RLock()
		defer s.mu.RUnlock()
		s.writeJSON(w, http.StatusOK, map[string]any{"inquiries": s.inquiries})

	case http.MethodPost:
		var body map[string]string
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			s.writeError(w, http.StatusBadRequest, "Invalid JSON")
			return
		}
		if strings.TrimSpace(body["buyerName"]) == "" || strings.TrimSpace(body["country"]) == "" {
			s.writeError(w, http.StatusBadRequest, "buyerName and country are required")
			return
		}

		if fsClient != nil {
			fbi := FBInquiry{
				BuyerName:            strings.TrimSpace(body["buyerName"]),
				Country:              strings.TrimSpace(body["country"]),
				Product:              or(body["product"], "Nutmeg (ABCD Grade)"),
				Quantity:             or(body["quantity"], "10 MT"),
				Price:                or(body["price"], "$8,000/MT"),
				Status:               "New Inquiry",
				Source:               or(body["source"], "Direct"),
				Date:                 todayStr(),
				LastContactDate:      todayStr(),
				FollowUpReminderDate: body["followUpReminderDate"],
				NegotiationNotes:     body["negotiationNotes"],
			}
			id, err := CreateBuyerInquiry(userID, &fbi)
			if err == nil {
				fbi.ID = id
				inqs, _ := GetBuyerInquiries(userID)
				s.writeJSON(w, http.StatusCreated, map[string]any{"message": "Inquiry added", "inquiry": fbi, "inquiries": inqs})
				return
			}
		}

		// Fallback
		newInq := Inquiry{
			ID: fmt.Sprintf("inq_%d", time.Now().UnixNano()), BuyerName: strings.TrimSpace(body["buyerName"]),
			Country: strings.TrimSpace(body["country"]), Product: or(body["product"], "Nutmeg (ABCD Grade)"),
			Quantity: or(body["quantity"], "10 MT"), Price: or(body["price"], "$8,000/MT"),
			Status: "New Inquiry", Source: or(body["source"], "Direct"),
			Date: todayStr(), LastContactDate: todayStr(),
			FollowUpReminderDate: body["followUpReminderDate"], NegotiationNotes: body["negotiationNotes"],
		}
		s.mu.Lock()
		s.inquiries = append([]Inquiry{newInq}, s.inquiries...)
		inquiries := s.inquiries
		s.mu.Unlock()
		s.writeJSON(w, http.StatusCreated, map[string]any{"message": "Inquiry added", "inquiry": newInq, "inquiries": inquiries})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *ExopilotServer) handleInquiryByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/inquiry/")
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodPut:
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)

		if fsClient != nil {
			err := UpdateBuyerInquirySecure(id, userID, body)
			if err == nil {
				inquiries, _ := GetBuyerInquiries(userID)
				// Find updated
				var updated *FBInquiry
				for _, inq := range inquiries {
					if inq.ID == id {
						updated = &inq
						break
					}
				}
				s.writeJSON(w, http.StatusOK, map[string]any{"inquiry": updated, "inquiries": inquiries})
				return
			}
			s.writeError(w, http.StatusForbidden, "Permission denied: resource ownership mismatch")
			return
		}

		// Fallback
		s.mu.Lock()
		defer s.mu.Unlock()
		for i, inq := range s.inquiries {
			if inq.ID == id {
				if v, ok := body["status"].(string); ok {
					s.inquiries[i].Status = v
				}
				if v, ok := body["followUpReminderDate"].(string); ok {
					s.inquiries[i].FollowUpReminderDate = v
				}
				if v, ok := body["negotiationNotes"].(string); ok {
					s.inquiries[i].NegotiationNotes = v
				}
				if v, ok := body["lastContactDate"].(string); ok {
					s.inquiries[i].LastContactDate = v
				}
				if v, ok := body["firstEmailSentAt"].(string); ok {
					s.inquiries[i].FirstEmailSentAt = v
				}
				s.writeJSON(w, http.StatusOK, map[string]any{"inquiry": s.inquiries[i], "inquiries": s.inquiries})
				return
			}
		}
		s.writeError(w, http.StatusNotFound, "Inquiry not found")

	case http.MethodDelete:
		if fsClient != nil {
			err := DeleteBuyerInquirySecure(id, userID)
			if err == nil {
				inquiries, _ := GetBuyerInquiries(userID)
				s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "inquiries": inquiries})
				return
			}
			s.writeError(w, http.StatusForbidden, "Permission denied: resource ownership mismatch")
			return
		}

		// Fallback
		s.mu.Lock()
		defer s.mu.Unlock()
		filtered := s.inquiries[:0]
		for _, inq := range s.inquiries {
			if inq.ID != id {
				filtered = append(filtered, inq)
			}
		}
		s.inquiries = filtered
		s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "inquiries": s.inquiries})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============================================================
// HANDLERS: SHIPMENTS
// ============================================================

func (s *ExopilotServer) handleShipments(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodGet:
		if fsClient != nil {
			shipments, err := GetShipments(userID)
			if err == nil {
				s.writeJSON(w, http.StatusOK, map[string]any{"shipments": shipments})
				return
			}
		}

		s.mu.RLock()
		defer s.mu.RUnlock()
		s.writeJSON(w, http.StatusOK, map[string]any{"shipments": s.shipments})

	case http.MethodPost:
		var body map[string]string
		json.NewDecoder(r.Body).Decode(&body)
		if strings.TrimSpace(body["containerNumber"]) == "" || body["etd"] == "" || body["eta"] == "" {
			s.writeError(w, http.StatusBadRequest, "containerNumber, etd, and eta are required")
			return
		}

		if fsClient != nil {
			fbs := FBShipment{
				ContainerNumber: strings.TrimSpace(body["containerNumber"]),
				ShippingLine:    or(body["shippingLine"], "Maersk"),
				Commodity:       or(body["commodity"], "Nutmeg"),
				Status:          "Preparing",
				ETD:             body["etd"],
				ETA:             body["eta"],
				PortOrigin:      or(body["portOrigin"], "Tanjung Priok, Jakarta"),
				PortDestination: body["portDestination"],
				BuyerName:       body["buyerName"],
				Documents: []FBShipmentDocument{
					{Type: "Bill of Lading", Uploaded: false},
					{Type: "Commercial Invoice", Uploaded: false},
					{Type: "Packing List", Uploaded: false},
				},
			}
			id, err := CreateShipment(userID, &fbs)
			if err == nil {
				fbs.ID = id
				ships, _ := GetShipments(userID)
				s.writeJSON(w, http.StatusCreated, map[string]any{"shipment": fbs, "shipments": ships})
				return
			}
		}

		// Fallback
		newShip := Shipment{
			ID:              fmt.Sprintf("ship_%d", time.Now().UnixNano()),
			ContainerNumber: strings.TrimSpace(body["containerNumber"]),
			ShippingLine:    or(body["shippingLine"], "Maersk"), Commodity: or(body["commodity"], "Nutmeg"),
			Status: "Preparing", ETD: body["etd"], ETA: body["eta"],
			PortOrigin: or(body["portOrigin"], "Tanjung Priok, Jakarta"), PortDestination: body["portDestination"],
			BuyerName: body["buyerName"],
			Documents: []ShipmentDocument{{Type: "Bill of Lading", Uploaded: false}, {Type: "Commercial Invoice", Uploaded: false}, {Type: "Packing List", Uploaded: false}},
		}
		s.mu.Lock()
		s.shipments = append([]Shipment{newShip}, s.shipments...)
		shipments := s.shipments
		s.mu.Unlock()
		s.writeJSON(w, http.StatusCreated, map[string]any{"shipment": newShip, "shipments": shipments})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *ExopilotServer) handleShipmentDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id := ""
	for i, p := range parts {
		if p == "shipment" && i+1 < len(parts) {
			id = parts[i+1]
			break
		}
	}

	var body map[string]string
	json.NewDecoder(r.Body).Decode(&body)
	docType := body["docType"]
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	if fsClient != nil {
		shipments, err := GetShipments(userID)
		if err == nil {
			for _, sh := range shipments {
				if sh.ID == id {
					updatedDocs := make([]FBShipmentDocument, len(sh.Documents))
					for i, doc := range sh.Documents {
						if doc.Type == docType {
							updatedDocs[i] = FBShipmentDocument{Type: doc.Type, Uploaded: !doc.Uploaded}
						} else {
							updatedDocs[i] = doc
						}
					}
					_ = UpdateShipment(id, map[string]interface{}{"documents": updatedDocs})
					newShips, _ := GetShipments(userID)
					var updated *FBShipment
					for _, ns := range newShips {
						if ns.ID == id {
							updated = &ns
							break
						}
					}
					s.writeJSON(w, http.StatusOK, map[string]any{"shipment": updated, "shipments": newShips})
					return
				}
			}
		}
	}

	// Fallback
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, sh := range s.shipments {
		if sh.ID == id {
			for j, doc := range s.shipments[i].Documents {
				if doc.Type == docType {
					s.shipments[i].Documents[j].Uploaded = !doc.Uploaded
					break
				}
			}
			s.writeJSON(w, http.StatusOK, map[string]any{"shipment": s.shipments[i], "shipments": s.shipments})
			return
		}
	}
	s.writeError(w, http.StatusNotFound, "Shipment not found")
}

// ============================================================
// HANDLERS: SUPPLIERS
// ============================================================

func (s *ExopilotServer) handleSuppliers(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodGet:
		if fsClient != nil {
			suppliers, err := GetSuppliers(userID)
			if err == nil {
				s.writeJSON(w, http.StatusOK, map[string]any{"suppliers": suppliers})
				return
			}
		}

		s.mu.RLock()
		defer s.mu.RUnlock()
		s.writeJSON(w, http.StatusOK, map[string]any{"suppliers": s.suppliers})

	case http.MethodPost:
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		name, _ := body["name"].(string)
		location, _ := body["location"].(string)
		if strings.TrimSpace(name) == "" || strings.TrimSpace(location) == "" {
			s.writeError(w, http.StatusBadRequest, "name and location are required")
			return
		}
		score := 3
		if v, ok := body["reliabilityScore"].(float64); ok {
			score = int(v)
		}

		if fsClient != nil {
			fbsup := FBSupplier{
				Name:             strings.TrimSpace(name),
				Location:         strings.TrimSpace(location),
				Product:          strVal(body["product"], "Nutmeg (ABCD Grade)"),
				SupplyCapacity:   strVal(body["supplyCapacity"], ""),
				LastPrice:        strVal(body["lastPrice"], ""),
				QualityGrade:     strVal(body["qualityGrade"], "A"),
				ReliabilityScore: score,
				LegalDocs:        boolVal(body["legalDocs"]),
				Notes:            strVal(body["notes"], ""),
				CreatedAt:        todayStr(),
			}
			id, err := CreateSupplier(userID, &fbsup)
			if err == nil {
				fbsup.ID = id
				sups, _ := GetSuppliers(userID)
				s.writeJSON(w, http.StatusCreated, map[string]any{"supplier": fbsup, "suppliers": sups})
				return
			}
		}

		// Fallback
		newSup := Supplier{
			ID: fmt.Sprintf("sup_%d", time.Now().UnixNano()), Name: strings.TrimSpace(name),
			Location: strings.TrimSpace(location), Product: strVal(body["product"], "Nutmeg (ABCD Grade)"),
			SupplyCapacity: strVal(body["supplyCapacity"], ""), LastPrice: strVal(body["lastPrice"], ""),
			QualityGrade: strVal(body["qualityGrade"], "A"), ReliabilityScore: score,
			LegalDocs: boolVal(body["legalDocs"]), Notes: strVal(body["notes"], ""),
			TransactionHistory: []SupplierTransaction{}, CreatedAt: todayStr(),
		}
		s.mu.Lock()
		s.suppliers = append([]Supplier{newSup}, s.suppliers...)
		suppliers := s.suppliers
		s.mu.Unlock()
		s.writeJSON(w, http.StatusCreated, map[string]any{"supplier": newSup, "suppliers": suppliers})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *ExopilotServer) handleSupplierByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/supplier/")
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodPut:
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)

		if fsClient != nil {
			err := UpdateSupplierSecure(id, userID, body)
			if err == nil {
				sups, _ := GetSuppliers(userID)
				var updated *FBSupplier
				for _, sup := range sups {
					if sup.ID == id {
						updated = &sup
						break
					}
				}
				s.writeJSON(w, http.StatusOK, map[string]any{"supplier": updated, "suppliers": sups})
				return
			}
			s.writeError(w, http.StatusForbidden, "Permission denied: resource ownership mismatch")
			return
		}

		// Fallback
		s.mu.Lock()
		defer s.mu.Unlock()
		for i, sup := range s.suppliers {
			if sup.ID == id {
				if v, ok := body["name"].(string); ok {
					s.suppliers[i].Name = v
				}
				if v, ok := body["location"].(string); ok {
					s.suppliers[i].Location = v
				}
				if v, ok := body["product"].(string); ok {
					s.suppliers[i].Product = v
				}
				if v, ok := body["supplyCapacity"].(string); ok {
					s.suppliers[i].SupplyCapacity = v
				}
				if v, ok := body["lastPrice"].(string); ok {
					s.suppliers[i].LastPrice = v
				}
				if v, ok := body["reliabilityScore"].(float64); ok {
					s.suppliers[i].ReliabilityScore = int(v)
				}
				if v, ok := body["qualityGrade"].(string); ok {
					s.suppliers[i].QualityGrade = v
				}
				if v, ok := body["notes"].(string); ok {
					s.suppliers[i].Notes = v
				}
				if v, ok := body["legalDocs"].(bool); ok {
					s.suppliers[i].LegalDocs = v
				}
				s.writeJSON(w, http.StatusOK, map[string]any{"supplier": s.suppliers[i], "suppliers": s.suppliers})
				return
			}
		}
		s.writeError(w, http.StatusNotFound, "Supplier not found")

	case http.MethodDelete:
		if fsClient != nil {
			err := DeleteSupplierSecure(id, userID)
			if err == nil {
				sups, _ := GetSuppliers(userID)
				s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "suppliers": sups})
				return
			}
			s.writeError(w, http.StatusForbidden, "Permission denied: resource ownership mismatch")
			return
		}

		// Fallback
		s.mu.Lock()
		defer s.mu.Unlock()
		filtered := s.suppliers[:0]
		for _, sup := range s.suppliers {
			if sup.ID != id {
				filtered = append(filtered, sup)
			}
		}
		s.suppliers = filtered
		s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "suppliers": s.suppliers})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============================================================
// HANDLERS: NEGOTIATION NOTES
// ============================================================

func (s *ExopilotServer) handleNotes(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	switch r.Method {
	case http.MethodGet:
		if fsClient != nil {
			notes, err := GetNegotiationNotes(userID)
			if err == nil {
				s.writeJSON(w, http.StatusOK, map[string]any{"notes": notes})
				return
			}
		}

		s.mu.RLock()
		defer s.mu.RUnlock()
		s.writeJSON(w, http.StatusOK, map[string]any{"notes": s.negotiationNotes})

	case http.MethodPost:
		var body struct {
			BuyerName string   `json:"buyerName"`
			Date      string   `json:"date"`
			Category  string   `json:"category"`
			Content   string   `json:"content"`
			Tags      []string `json:"tags"`
		}
		json.NewDecoder(r.Body).Decode(&body)
		if strings.TrimSpace(body.BuyerName) == "" || strings.TrimSpace(body.Content) == "" {
			s.writeError(w, http.StatusBadRequest, "buyerName and content are required")
			return
		}
		date := body.Date
		if date == "" {
			date = todayStr()
		}
		category := body.Category
		if category == "" {
			category = "General"
		}
		tags := body.Tags
		if tags == nil {
			tags = []string{}
		}

		if fsClient != nil {
			fbn := FBNegotiationNote{
				BuyerName: strings.TrimSpace(body.BuyerName),
				Date:      date,
				Category:  category,
				Content:   strings.TrimSpace(body.Content),
				Tags:      tags,
			}
			id, err := CreateNegotiationNote(userID, &fbn)
			if err == nil {
				fbn.ID = id
				notes, _ := GetNegotiationNotes(userID)
				s.writeJSON(w, http.StatusCreated, map[string]any{"note": fbn, "notes": notes})
				return
			}
		}

		// Fallback
		newNote := NegotiationNote{
			ID:        fmt.Sprintf("note_%d", time.Now().UnixNano()),
			BuyerName: strings.TrimSpace(body.BuyerName), Date: date,
			Category: category, Content: strings.TrimSpace(body.Content), Tags: tags,
		}
		s.mu.Lock()
		s.negotiationNotes = append([]NegotiationNote{newNote}, s.negotiationNotes...)
		notes := s.negotiationNotes
		s.mu.Unlock()
		s.writeJSON(w, http.StatusCreated, map[string]any{"note": newNote, "notes": notes})

	default:
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *ExopilotServer) handleNoteByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/negotiation-note/")
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}

	if r.Method != http.MethodDelete {
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if fsClient != nil {
		err := DeleteNegotiationNoteSecure(id, userID)
		if err == nil {
			notes, _ := GetNegotiationNotes(userID)
			s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "notes": notes})
			return
		}
	}

	// Fallback
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := s.negotiationNotes[:0]
	for _, n := range s.negotiationNotes {
		if n.ID != id {
			filtered = append(filtered, n)
		}
	}
	s.negotiationNotes = filtered
	s.writeJSON(w, http.StatusOK, map[string]any{"message": "Deleted", "notes": s.negotiationNotes})
}

// ============================================================
// HANDLERS: AI DOCUMENT GENERATOR
// ============================================================

func (s *ExopilotServer) handleGenerateDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var body struct {
		DocType            string `json:"docType"`
		BuyerName          string `json:"buyerName"`
		Commodity          string `json:"commodity"`
		Quantity           string `json:"quantity"`
		Price              string `json:"price"`
		DestinationCountry string `json:"destinationCountry"`
		NegotiationNotes   string `json:"negotiationNotes"`
		BusinessName       string `json:"businessName"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if body.BuyerName == "" || body.Commodity == "" || body.Quantity == "" {
		s.writeError(w, http.StatusBadRequest, "buyerName, commodity, and quantity are required")
		return
	}

	docType := or(body.DocType, "Quotation")
	country := or(body.DestinationCountry, "Netherlands")
	price := or(body.Price, "[ _____________________ ]")
	notes := body.NegotiationNotes
	dateStr := todayStr()
	serialRef := fmt.Sprintf("EX-2026-%04d", rand.Intn(9000)+1000)
	sellerName := or(body.BusinessName, "PT Rempah Nusantara Abadi")

	// Live Gemini AI Generation via REST if API Key is set in backend
	geminiKey := os.Getenv("GEMINI_API_KEY")
	if geminiKey != "" {
		type Part struct {
			Text string `json:"text"`
		}
		type Content struct {
			Parts []Part `json:"parts"`
		}
		type GeminiReq struct {
			Contents []Content `json:"contents"`
		}

		systemPrompt := fmt.Sprintf(`You are Exopilot AI, a world-class international trade documentation expert.
Generate a professional, fully-detailed, realistic export %s document for:
- Exporter/Seller: %s (Tanjung Priok, Jakarta, Indonesia)
- Buyer/Importer: %s (Destination: %s)
- Product: %s
- Volume/Quantity: %s
- Target Price: %s
- Custom Demands/Negotiation Notes: %s

Requirements:
1. Format output as clean, valid Markdown. Do not include raw HTML.
2. The document MUST NOT look like an AI-generated text template. Do NOT include any conversational preamble, intro text, greeting, or postamble. The document must start directly with the markdown H1 title of the document.
3. To make it look highly authentic and professional, use a clean structured text layout for the document header:
   - The document H1 title should be standard: e.g. "# EXPORT QUOTATION" or "# COMMERCIAL INVOICE" or "# INTERNATIONAL SALES CONTRACT".
   - Below the title, add a beautifully organized metadata block listing key transaction details: Exporter / Seller entity, Importer / Buyer entity, Document Reference Number, Issue Date, and Expiration / Validity Date.
4. Use professional corporate language and legal-standard headings.
5. Include an international transaction reference number (e.g. INV-2026-XXXX or RNA-EX-XXXX).
6. Organize the details using clean markdown tables for items, quantities, and prices.
7. Under separate sections, detail:
   - Port of Loading (Tanjung Priok, Jakarta, Indonesia)
   - Port of Discharge / Destination Port (based on country)
   - Standard Trade Terms (Incoterms: FOB or CIF as preferred by buyer notes)
   - Quality Specifications (moisture content, packaging)
   - Payment Terms (e.g. 30%% advance, 70%% against BL or Letter of Credit)
8. Address any specific custom demands from the negotiation notes (e.g., specific moisture level, delivery request).
9. Strictly DO NOT hallucinate, fabricate, or make up transaction details (such as bank account numbers, SWIFT codes, container numbers, seal numbers, exact freight costs, or shipping lines) unless they are explicitly provided. If any details are not specified, leave them blank (e.g., using "[ _____________________ ]") so that the user can fill them in.
10. Conclude with signature sections and official agricultural liaison declaration.`,
			docType, sellerName, body.BuyerName, country, body.Commodity, body.Quantity, price, or(notes, "None"))

		reqBody := GeminiReq{
			Contents: []Content{
				{
					Parts: []Part{
						{Text: systemPrompt},
					},
				},
			},
		}

		jsonBytes, err := json.Marshal(reqBody)
		if err == nil {
			candidateModels := []string{"gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"}
			for _, modelName := range candidateModels {
				url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, geminiKey)
				req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonBytes))
				if err == nil {
					req.Header.Set("Content-Type", "application/json")
					client := &http.Client{Timeout: 15 * time.Second}
					resp, err := client.Do(req)
					if err == nil && resp.StatusCode == http.StatusOK {
						defer resp.Body.Close()
						var geminiResp struct {
							Candidates []struct {
								Content struct {
									Parts []struct {
										Text string `json:"text"`
									} `json:"parts"`
								} `json:"content"`
							} `json:"candidates"`
						}
						if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err == nil {
							if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
								liveDoc := geminiResp.Candidates[0].Content.Parts[0].Text
								cleanedDoc := cleanAIDocument(liveDoc)
								s.writeJSON(w, http.StatusOK, map[string]any{
									"document": cleanedDoc,
									"note":     fmt.Sprintf("live-gemini-%s", modelName),
								})
								return
							}
						}
					}
					if resp != nil {
						resp.Body.Close()
					}
				}
			}
		}
	}

	// Offline template fallback (without offline warning)
	var doc string
	docLower := strings.ToLower(docType)
	if strings.Contains(docLower, "invoice") {
		doc = fmt.Sprintf("# COMMERCIAL INVOICE\n\n**Document Reference Number:** %s\n**Issue Date:** %s\n**Exporter / Seller:** %s (Tanjung Priok, Jakarta, Indonesia)\n**Importer / Buyer:** %s (Destination: %s)\n\n| Commodity | Volume | Unit Price | Total |\n|---|---|---|---|\n| **%s** | %s | %s | [ _____________________ ] |\n\n### BANK DETAILS\n- Bank Name: [ _____________________ ]\n- Account No: [ _____________________ ]\n- Swift/BIC: [ _____________________ ]\n\n**Special Notes:** %s\n\n---\n*Authorized by Indonesian Agricultural Export Board Liaison*",
			serialRef, dateStr, sellerName, body.BuyerName, country, body.Commodity, body.Quantity, price, or(notes, "Standard export provisions applied."))
	} else if strings.Contains(docLower, "contract") {
		doc = fmt.Sprintf("# INTERNATIONAL SALES CONTRACT\n\n**Document Reference Number:** RNA-EX-%s-%d\n**Issue Date:** %s\n**Exporter / Seller:** %s (Tanjung Priok, Jakarta, Indonesia)\n**Importer / Buyer:** %s (Destination: %s)\n\n### ARTICLE 1: SUBJECT OF AGREEMENT\nSeller agrees to supply **%s** in accordance with the specifications below.\n\n### ARTICLE 2: QUANTITY & DELIVERY\n- Net Volume: **%s** (±3%% tolerance)\n- Port of Loading: Tanjung Priok, Jakarta, Indonesia\n- Port of Discharge: [ _____________________ ]\n- Incoterms: [ FOB / CIF ] — edit as applicable\n\n### ARTICLE 3: PRICE\n**%s FOB** Indonesian ports\n\n### ARTICLE 4: PAYMENT\n- Payment Method: [ Irrevocable LC / T/T ]\n- Advance: [ _____________________ ]%% \n- Balance: against B/L copy\n\n### ARTICLE 5: QUALITY\nSGS/Sucofindo certificate, moisture <12%%, phytosanitary certified.\n\n**Client Notes:** %s\n\n---\n*Signature Seller:* [ _____________________ ] *| Signature Buyer:* [ _____________________ ]*",
			strings.ToUpper(country[:3]), rand.Intn(90000)+10000, dateStr, sellerName, body.BuyerName, country, body.Commodity, body.Quantity, price, or(notes, "Standard provisions apply."))
	} else {
		doc = fmt.Sprintf("# EXPORT QUOTATION\n\n**Document Reference Number:** %s\n**Issue Date:** %s\n**Exporter / Seller:** %s (Tanjung Priok, Jakarta, Indonesia)\n**Importer / Buyer:** %s (Destination: %s)\n\n| Commodity | Volume | Price (FOB) | Origin | Loading Port |\n|---|---|---|---|---|\n| **%s** | %s | %s | Indonesia | Tanjung Priok |\n\n### TRADE TERMS\n1. **Origin:** Indonesia\n2. **Packing:** [ _____________________ ]\n3. **Payment:** [ 30%% T/T advance + 70%% against B/L / LC ]\n4. **Lead Time:** [ _____________________ ] days post-phytosanitary approval\n5. **Quality:** Moisture <12%%, SGS/Sucofindo certified\n\n### SPECIAL DEMANDS ADDRESSED\n%s\n\n---\n*Quotation valid for:* [ _____________________ ] days",
			serialRef, dateStr, sellerName, body.BuyerName, country, body.Commodity, body.Quantity, price, or(notes, "No custom demands specified."))
	}

	s.writeJSON(w, http.StatusOK, map[string]any{
		"document": doc,
		"note":     "offline-template",
	})
}

func cleanAIDocument(text string) string {
	cleaned := strings.TrimSpace(text)

	// 1. Remove markdown wrappers
	if strings.HasPrefix(cleaned, "```markdown") {
		cleaned = strings.TrimSpace(strings.TrimPrefix(cleaned, "```markdown"))
	} else if strings.HasPrefix(cleaned, "```") {
		cleaned = strings.TrimSpace(strings.TrimPrefix(cleaned, "```"))
	}
	if strings.HasSuffix(cleaned, "```") {
		cleaned = strings.TrimSpace(strings.TrimSuffix(cleaned, "```"))
	}

	// 2. Clean preamble before H1/H2 header
	h1Index := strings.Index(cleaned, "#")
	if h1Index != -1 && h1Index > 0 {
		preamble := strings.TrimSpace(cleaned[:h1Index])
		preambleLower := strings.ToLower(preamble)
		conversationalKeywords := []string{"exopilot", "expert", "generate", "here is", "sure", "as a", "i have", "dear", "hello", "professional", "specification"}
		isConversational := len(preamble) < 400
		if !isConversational {
			for _, kw := range conversationalKeywords {
				if strings.Contains(preambleLower, kw) {
					isConversational = true
					break
				}
			}
		}
		if isConversational {
			cleaned = strings.TrimSpace(cleaned[h1Index:])
		}
	}

	// 3. Clean postamble
	lines := strings.Split(cleaned, "\n")
	lastValuableLineIndex := len(lines) - 1
	for lastValuableLineIndex >= 0 {
		lineTrim := strings.TrimSpace(lines[lastValuableLineIndex])
		if lineTrim == "" {
			lastValuableLineIndex--
			continue
		}
		lineLower := strings.ToLower(lineTrim)
		if strings.HasPrefix(lineLower, "if you need") ||
			strings.HasPrefix(lineLower, "hope this helps") ||
			strings.HasPrefix(lineLower, "let me know if") ||
			strings.Contains(lineLower, "exopilot ai") ||
			strings.HasPrefix(lineLower, "best regards") ||
			strings.HasPrefix(lineLower, "here is the") ||
			(len(lineLower) < 100 && (strings.Contains(lineLower, "thank you") || strings.Contains(lineLower, "regards"))) {
			lastValuableLineIndex--
		} else {
			break
		}
	}

	if lastValuableLineIndex < len(lines)-1 {
		cleaned = strings.TrimSpace(strings.Join(lines[:lastValuableLineIndex+1], "\n"))
	}

	return cleaned
}

func (s *ExopilotServer) handleBuyerCRM(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		s.writeError(w, http.StatusUnauthorized, "Unauthorized: "+err.Error())
		return
	}
	if r.Method != http.MethodPut {
		s.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/buyer-crm/")

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		s.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if fsClient != nil {
		err := UpdateBuyerCRMSecure(id, userID, body)
		if err == nil {
			crms, _ := GetBuyerCRMs(userID)
			var updated *FBBuyerCRM
			for _, c := range crms {
				if c.ID == id {
					updated = &c
					break
				}
			}
			s.writeJSON(w, http.StatusOK, map[string]any{"buyer": updated, "buyerCRM": crms})
			return
		}
		s.writeError(w, http.StatusForbidden, "Permission denied: resource ownership mismatch")
		return
	}

	// Fallback in-memory
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.buyerCRM {
		if c.ID == id {
			if dealsRaw, ok := body["dealHistory"]; ok {
				if dealsJSON, err := json.Marshal(dealsRaw); err == nil {
					var deals []BuyerDeal
					if err := json.Unmarshal(dealsJSON, &deals); err == nil {
						s.buyerCRM[i].DealHistory = deals
					}
				}
			}
			if totalVolume, ok := body["totalVolume"].(string); ok {
				s.buyerCRM[i].TotalVolume = totalVolume
			}
			s.writeJSON(w, http.StatusOK, map[string]any{"buyer": s.buyerCRM[i], "buyerCRM": s.buyerCRM})
			return
		}
	}

	s.writeError(w, http.StatusNotFound, "Buyer CRM record not found")
}

// ============================================================
// UTILS
// ============================================================

func or(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

func strVal(v any, def string) string {
	if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
		return s
	}
	return def
}

func boolVal(v any) bool {
	if b, ok := v.(bool); ok {
		return b
	}
	return false
}

// ============================================================
// MAIN
// ============================================================

func main() {
	rand.Seed(time.Now().UnixNano())

	// Initialize Firebase Admin SDK (non-fatal: falls back to in-memory data)
	if err := InitFirebase(); err != nil {
		log.Printf("⚠ Firebase not initialized (%v) — running with in-memory data", err)
	} else {
		defer CloseFirebase()
	}

	server := NewExopilotServer()
	mux := http.NewServeMux()

	// Initialize rate limiter: max 10 attempts per 60 seconds, then lock for 15 minutes
	rateLimiter := NewRateLimiter(10, 60*time.Second, 15*time.Minute)

	// Routes
	mux.HandleFunc("/api/dashboard", server.handleDashboard)
	mux.HandleFunc("/api/inquiry", server.handleInquiries)
	mux.HandleFunc("/api/inquiry/", server.handleInquiryByID)
	mux.HandleFunc("/api/shipment", server.handleShipments)
	mux.HandleFunc("/api/shipment/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/document") {
			server.handleShipmentDocument(w, r)
		} else {
			http.NotFound(w, r)
		}
	})
	mux.HandleFunc("/api/supplier", server.handleSuppliers)
	mux.HandleFunc("/api/supplier/", server.handleSupplierByID)
	mux.HandleFunc("/api/negotiation-note", server.handleNotes)
	mux.HandleFunc("/api/negotiation-note/", server.handleNoteByID)
	mux.HandleFunc("/api/buyer-crm/", server.handleBuyerCRM)
	mux.HandleFunc("/api/generate-document", server.handleGenerateDocument)

	// Root route handler to avoid raw "404 page not found"
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":       "ok",
			"service":      "exopilot-api",
			"message":      "Exopilot Go API is active. Please visit the frontend application.",
			"frontend_url": "http://localhost:3000",
		})
	})

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "exopilot-api", "version": "1.0.0"})
	})

	// Check environment variables for port configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = os.Getenv("GO_API_PORT")
	}
	if port == "" {
		port = "8080"
	}

	handler := corsMiddleware(mux)
	// Apply rate limiting middleware
	handler = rateLimiter.middleware(handler)
	
	fmt.Printf("🚢 Exopilot Go API running on 0.0.0.0:%s\n", port)
	fmt.Printf("   Local:     http://localhost:%s\n", port)
	fmt.Printf("   Network:   http://192.168.56.1:%s\n", port)
	fmt.Printf("   Endpoints: /api/dashboard /api/inquiry /api/shipment /api/supplier /api/negotiation-note /api/generate-document\n")
	fmt.Printf("   Rate Limit: 10 requests per 60 seconds (then 15-min lockout)\n")
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
