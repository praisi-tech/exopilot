package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Inquiry represents B2B international purchase orders for Indonesian spices
type Inquiry struct {
	ID        string    `json:"id"`
	BuyerName string    `json:"buyer_name"`
	Country   string    `json:"country"`
	Product   string    `json:"product"` // e.g., "Nutmeg", "Cloves"
	Quantity  string    `json:"quantity"`
	Status    string    `json:"status"` // "New", "Negotiating", "Closed"
	CreatedAt time.Time `json:"created_at"`
}

// Shipment represents container cargo tracked in transit
type Shipment struct {
	ID              string    `json:"id"`
	ContainerNumber string    `json:"container_number"`
	ShippingLine    string    `json:"shipping_line"`
	Status          string    `json:"status"` // "Customs", "On Vessel", "Arrived"
	Commodity       string    `json:"commodity"`
	ETD             time.Time `json:"etd"`
	ETA             time.Time `json:"eta"`
}

// StatsResponse represents aggregated dashboard metadata
type StatsResponse struct {
	TotalInquiries   int        `json:"total_inquiries"`
	ActiveContainers int        `json:"active_containers"`
	Inquiries        []Inquiry  `json:"inquiries"`
	Shipments        []Shipment `json:"shipments"`
}

// ExopilotServer manages database states thread-safely in-memory as a high-performance prototype
type ExopilotServer struct {
	mu        sync.RWMutex
	inquiries []Inquiry
	shipments []Shipment
}

func NewExopilotServer() *ExopilotServer {
	// Populate realistic initial Indonesian Spice export data
	return &ExopilotServer{
		inquiries: []Inquiry{
			{ID: "1", BuyerName: "Klausen Spice GmbH", Country: "Germany", Product: "Nutmeg ABCD Grade", Quantity: "15 MT", Status: "Negotiating", CreatedAt: time.Now().Add(-48 * time.Hour)},
			{ID: "2", BuyerName: "Tokyo Organic Imports", Country: "Japan", Product: "Cloves Lal Pari Grade", Quantity: "8 MT", Status: "Closed", CreatedAt: time.Now().Add(-24 * time.Hour)},
			{ID: "3", BuyerName: "Singapore Spice Trading Hub", Country: "Singapore", Product: "Mace Whole High Grade", Quantity: "2 MT", Status: "New", CreatedAt: time.Now().Add(-2 * time.Hour)},
		},
		shipments: []Shipment{
			{ID: "s1", ContainerNumber: "EMCU8902143", ShippingLine: "Evergreen", Status: "On Vessel", Commodity: "Nutmeg", ETD: time.Now().Add(-72 * time.Hour), ETA: time.Now().Add(180 * time.Hour)},
			{ID: "s2", ContainerNumber: "MSKU4723920", ShippingLine: "Maersk", Status: "Customs", Commodity: "Cloves", ETD: time.Now(), ETA: time.Now().Add(240 * time.Hour)},
		},
	}
}

// GET /api/dashboard - Returns summary metrics & mock structures
func (s *ExopilotServer) HandleGetDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	// Assess active containers (Status isn't "Arrived")
	activeContainers := 0
	for _, ship := range s.shipments {
		if ship.Status != "Arrived" {
			activeContainers++
		}
	}

	response := StatsResponse{
		TotalInquiries:   len(s.inquiries),
		ActiveContainers: activeContainers,
		Inquiries:        s.inquiries,
		Shipments:        s.shipments,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding dashboard statistics: %v", err)
	}
}

// POST /api/inquiry - Receives, validates & saves a new buyer inquiry
func (s *ExopilotServer) HandlePostInquiry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		BuyerName string `json:"buyer_name"`
		Country   string `json:"country"`
		Product   string `json:"product"`
		Quantity  string `json:"quantity"`
	}

	// 1. Decode payload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON body format"})
		return
	}

	// 2. Rigid Server-side Form Validation
	if req.BuyerName == "" {
		s.writeJSONError(w, "buyer_name is a required field", http.StatusBadRequest)
		return
	}
	if req.Country == "" {
		s.writeJSONError(w, "country is a required field", http.StatusBadRequest)
		return
	}
	if req.Product == "" {
		s.writeJSONError(w, "product is a required field (e.g. Nutmeg, Cloves etc.)", http.StatusBadRequest)
		return
	}
	if req.Quantity == "" {
		s.writeJSONError(w, "quantity is a required field", http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// 3. Assemble and persist
	newInquiry := Inquiry{
		ID:        fmt.Sprintf("inq_%d", time.Now().UnixNano()),
		BuyerName: req.BuyerName,
		Country:   req.Country,
		Product:   req.Product,
		Quantity:  req.Quantity,
		Status:    "New", // Defaults to New as instructed
		CreatedAt: time.Now(),
	}

	s.inquiries = append([]Inquiry{newInquiry}, s.inquiries...)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Quotation inquiry logged successfully",
		"data":    newInquiry,
	})
}

func (s *ExopilotServer) writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func main() {
	server := NewExopilotServer()
	mux := http.NewServeMux()

	// Modern routing definitions (Go 1.22+ handles methods directly, standard fallback shown for safety)
	mux.HandleFunc("/api/dashboard", server.HandleGetDashboard)
	mux.HandleFunc("/api/inquiry", server.HandlePostInquiry)

	port := ":8080"
	fmt.Printf("Exopilot Go API Gateway successfully listening on http://localhost%s\n", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
