package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

// ============================================================
// FIREBASE CLIENT INITIALIZATION
// ============================================================

var (
	fsClient   *firestore.Client
	authClient *auth.Client
	ctx        context.Context
)

// InitFirebase initializes the Firebase Admin SDK and Firestore/Auth clients
func InitFirebase() error {
	ctx = context.Background()

	credentialsPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if credentialsPath == "" {
		credentialsPath = "./firebase-service-account.json"
	}

	// Initialize Firebase App with service account credentials
	opt := option.WithCredentialsFile(credentialsPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return fmt.Errorf("error initializing Firebase app: %v", err)
	}

	// Initialize Firestore client
	client, err := app.Firestore(ctx)
	if err != nil {
		return fmt.Errorf("error initializing Firestore client: %v", err)
	}
	fsClient = client

	// Initialize Auth client
	ac, err := app.Auth(ctx)
	if err != nil {
		return fmt.Errorf("error initializing Firebase auth client: %v", err)
	}
	authClient = ac

	log.Println("✓ Firebase (Auth & Firestore) initialized successfully")
	return nil
}

// CloseFirebase closes the Firestore client connection
func CloseFirebase() error {
	if fsClient != nil {
		return fsClient.Close()
	}
	return nil
}

// ============================================================
// DATA MODELS & STRUCTS FOR FIRESTORE
// ============================================================

type Profile struct {
	ID              string `firestore:"id" json:"id"`
	CompanyName     string `firestore:"company_name" json:"company_name"`
	MainCommodity   string `firestore:"main_commodity" json:"main_commodity"`
	PhoneNumber     string `firestore:"phone_number" json:"phone_number"`
	LegalEntityType string `firestore:"legal_entity_type" json:"legal_entity_type"`
	GoogleFormURL   string `firestore:"google_form_url,omitempty" json:"google_form_url,omitempty"`
	CreatedAt       int64  `firestore:"created_at" json:"created_at"`
	UpdatedAt       int64  `firestore:"updated_at" json:"updated_at"`
}

type FBInquiry struct {
	ID                   string `firestore:"id" json:"id"`
	UserID               string `firestore:"user_id" json:"user_id"`
	BuyerName            string `firestore:"buyer_name" json:"buyerName"`
	Country              string `firestore:"country" json:"country"`
	Product              string `firestore:"product" json:"product"`
	Quantity             string `firestore:"quantity" json:"quantity"`
	Price                string `firestore:"price" json:"price"`
	Status               string `firestore:"status" json:"status"`
	Source               string `firestore:"source" json:"source"`
	Date                 string `firestore:"date" json:"date"`
	LastContactDate      string `firestore:"last_contact_date" json:"lastContactDate"`
	FollowUpReminderDate string `firestore:"follow_up_reminder_date,omitempty" json:"followUpReminderDate,omitempty"`
	NegotiationNotes     string `firestore:"negotiation_notes,omitempty" json:"negotiationNotes,omitempty"`
	FirstEmailSentAt     string `firestore:"first_email_sent_at,omitempty" json:"firstEmailSentAt,omitempty"`
	CreatedAt            int64  `firestore:"created_at" json:"createdAt"`
	UpdatedAt            int64  `firestore:"updated_at" json:"updatedAt"`
}

type FBShipmentDocument struct {
	Type     string `firestore:"type" json:"type"`
	Uploaded bool   `firestore:"uploaded" json:"uploaded"`
}

type FBShipment struct {
	ID              string               `firestore:"id" json:"id"`
	UserID          string               `firestore:"user_id" json:"user_id"`
	ContainerNumber string               `firestore:"container_number" json:"containerNumber"`
	ShippingLine    string               `firestore:"shipping_line" json:"shippingLine"`
	Commodity       string               `firestore:"commodity" json:"commodity"`
	Status          string               `firestore:"status" json:"status"`
	ETD             string               `firestore:"etd" json:"etd"`
	ETA             string               `firestore:"eta" json:"eta"`
	PortOrigin      string               `firestore:"port_origin" json:"portOrigin"`
	PortDestination string               `firestore:"port_destination" json:"portDestination"`
	BuyerName       string               `firestore:"buyer_name" json:"buyerName,omitempty"`
	Documents       []FBShipmentDocument `firestore:"documents" json:"documents"`
	CreatedAt       int64                `firestore:"created_at" json:"createdAt"`
	UpdatedAt       int64                `firestore:"updated_at" json:"updatedAt"`
}

type FBSupplierTransaction struct {
	Date     string `firestore:"date" json:"date"`
	Product  string `firestore:"product" json:"product"`
	Quantity string `firestore:"quantity" json:"quantity"`
	Price    string `firestore:"price" json:"price"`
}

type FBSupplier struct {
	ID                 string                  `firestore:"id" json:"id"`
	UserID             string                  `firestore:"user_id" json:"user_id"`
	Name               string                  `firestore:"name" json:"name"`
	Location           string                  `firestore:"location" json:"location"`
	Product            string                  `firestore:"product" json:"product"`
	SupplyCapacity     string                  `firestore:"supply_capacity" json:"supplyCapacity"`
	LastPrice          string                  `firestore:"last_price" json:"lastPrice"`
	QualityGrade       string                  `firestore:"quality_grade" json:"qualityGrade"`
	ReliabilityScore   int                     `firestore:"reliability_score" json:"reliabilityScore"`
	LegalDocs          bool                    `firestore:"legal_docs" json:"legalDocs"`
	Notes              string                  `firestore:"notes" json:"notes"`
	TransactionHistory []FBSupplierTransaction `firestore:"transaction_history" json:"transactionHistory"`
	CreatedAt          string                  `firestore:"created_at" json:"createdAt"`
	UpdatedAt          int64                   `firestore:"updated_at" json:"updatedAt"`
}

type FBBuyerDeal struct {
	Date      string `firestore:"date" json:"date"`
	Product   string `firestore:"product" json:"product"`
	Quantity  string `firestore:"quantity" json:"quantity"`
	Incoterms string `firestore:"incoterms" json:"incoterms"`
	Value     string `firestore:"value" json:"value"`
}

type FBBuyerCRM struct {
	ID                 string        `firestore:"id" json:"id"`
	UserID             string        `firestore:"user_id" json:"user_id"`
	BuyerName          string        `firestore:"buyer_name" json:"buyerName"`
	Company            string        `firestore:"company" json:"company"`
	Country            string        `firestore:"country" json:"country"`
	DealHistory        []FBBuyerDeal `firestore:"deal_history" json:"dealHistory"`
	TotalVolume        string        `firestore:"total_volume" json:"totalVolume"`
	PaymentHistory     string        `firestore:"payment_history" json:"paymentHistory"`
	PreferredProducts  []string      `firestore:"preferred_products" json:"preferredProducts"`
	CommunicationNotes string        `firestore:"communication_notes" json:"communicationNotes"`
	TrustLevel         int           `firestore:"trust_level" json:"trustLevel"`
	Preferences        string        `firestore:"preferences" json:"preferences"`
	CreatedAt          int64         `firestore:"created_at" json:"createdAt"`
}

type FBNegotiationNote struct {
	ID        string   `firestore:"id" json:"id"`
	UserID    string   `firestore:"user_id" json:"user_id"`
	BuyerName string   `firestore:"buyer_name" json:"buyerName"`
	Date      string   `firestore:"date" json:"date"`
	Category  string   `firestore:"category" json:"category"`
	Content   string   `firestore:"content" json:"content"`
	Tags      []string `firestore:"tags" json:"tags"`
	CreatedAt int64    `firestore:"created_at" json:"createdAt"`
}

// ============================================================
// FIRESTORE OPERATIONS
// ============================================================

// --- Profile ---

func GetProfile(userID string) (*Profile, error) {
	doc, err := fsClient.Collection("profiles").Doc(userID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var profile Profile
	if err := doc.DataTo(&profile); err != nil {
		return nil, err
	}
	return &profile, nil
}

func CreateProfile(userID string, profile *Profile) error {
	profile.ID = userID
	profile.CreatedAt = time.Now().Unix()
	profile.UpdatedAt = time.Now().Unix()
	_, err := fsClient.Collection("profiles").Doc(userID).Set(ctx, profile)
	return err
}

func UpdateProfile(userID string, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now().Unix()
	fbUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := fsClient.Collection("profiles").Doc(userID).Update(ctx, fbUpdates)
	return err
}

// --- Buyer Inquiries ---

func GetBuyerInquiries(userID string) ([]FBInquiry, error) {
	iter := fsClient.Collection("buyer_inquiries").Where("user_id", "==", userID).Documents(ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return nil, err
	}
	var inquiries []FBInquiry
	for _, doc := range docs {
		var inquiry FBInquiry
		if err := doc.DataTo(&inquiry); err != nil {
			return nil, err
		}
		inquiry.ID = doc.Ref.ID
		inquiries = append(inquiries, inquiry)
	}
	return inquiries, nil
}

func CreateBuyerInquiry(userID string, inquiry *FBInquiry) (string, error) {
	inquiry.UserID = userID
	inquiry.CreatedAt = time.Now().Unix()
	inquiry.UpdatedAt = time.Now().Unix()
	ref, _, err := fsClient.Collection("buyer_inquiries").Add(ctx, inquiry)
	if err != nil {
		return "", err
	}
	// Save ID inside doc too
	_, _ = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, nil
}

func UpdateBuyerInquiry(inquiryID string, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now().Unix()
	fbUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := fsClient.Collection("buyer_inquiries").Doc(inquiryID).Update(ctx, fbUpdates)
	return err
}

func DeleteBuyerInquiry(inquiryID string) error {
	_, err := fsClient.Collection("buyer_inquiries").Doc(inquiryID).Delete(ctx)
	return err
}

// --- Shipments ---

func GetShipments(userID string) ([]FBShipment, error) {
	iter := fsClient.Collection("shipment_tracker").Where("user_id", "==", userID).Documents(ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return nil, err
	}
	var shipments []FBShipment
	for _, doc := range docs {
		var shipment FBShipment
		if err := doc.DataTo(&shipment); err != nil {
			return nil, err
		}
		shipment.ID = doc.Ref.ID
		shipments = append(shipments, shipment)
	}
	return shipments, nil
}

func CreateShipment(userID string, shipment *FBShipment) (string, error) {
	shipment.UserID = userID
	shipment.CreatedAt = time.Now().Unix()
	shipment.UpdatedAt = time.Now().Unix()
	ref, _, err := fsClient.Collection("shipment_tracker").Add(ctx, shipment)
	if err != nil {
		return "", err
	}
	_, _ = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, nil
}

func UpdateShipment(shipmentID string, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now().Unix()
	fbUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := fsClient.Collection("shipment_tracker").Doc(shipmentID).Update(ctx, fbUpdates)
	return err
}

// --- Suppliers ---

func GetSuppliers(userID string) ([]FBSupplier, error) {
	iter := fsClient.Collection("suppliers").Where("user_id", "==", userID).Documents(ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return nil, err
	}
	var suppliers []FBSupplier
	for _, doc := range docs {
		var supplier FBSupplier
		if err := doc.DataTo(&supplier); err != nil {
			return nil, err
		}
		supplier.ID = doc.Ref.ID
		suppliers = append(suppliers, supplier)
	}
	return suppliers, nil
}

func CreateSupplier(userID string, supplier *FBSupplier) (string, error) {
	supplier.UserID = userID
	supplier.UpdatedAt = time.Now().Unix()
	ref, _, err := fsClient.Collection("suppliers").Add(ctx, supplier)
	if err != nil {
		return "", err
	}
	_, _ = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, nil
}

func UpdateSupplier(supplierID string, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now().Unix()
	fbUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := fsClient.Collection("suppliers").Doc(supplierID).Update(ctx, fbUpdates)
	return err
}

func DeleteSupplier(supplierID string) error {
	_, err := fsClient.Collection("suppliers").Doc(supplierID).Delete(ctx)
	return err
}

// --- Buyer CRM ---

func GetBuyerCRMs(userID string) ([]FBBuyerCRM, error) {
	iter := fsClient.Collection("buyer_crm").Where("user_id", "==", userID).Documents(ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return nil, err
	}
	var crms []FBBuyerCRM
	for _, doc := range docs {
		var crm FBBuyerCRM
		if err := doc.DataTo(&crm); err != nil {
			return nil, err
		}
		crm.ID = doc.Ref.ID
		crms = append(crms, crm)
	}
	return crms, nil
}

func CreateBuyerCRM(userID string, crm *FBBuyerCRM) (string, error) {
	crm.UserID = userID
	crm.CreatedAt = time.Now().Unix()
	ref, _, err := fsClient.Collection("buyer_crm").Add(ctx, crm)
	if err != nil {
		return "", err
	}
	_, _ = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, nil
}

func UpdateBuyerCRM(crmID string, updates map[string]interface{}) error {
	fbUpdates := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
	}
	_, err := fsClient.Collection("buyer_crm").Doc(crmID).Update(ctx, fbUpdates)
	return err
}

// --- Negotiation Notes ---

func GetNegotiationNotes(userID string) ([]FBNegotiationNote, error) {
	iter := fsClient.Collection("negotiation_notes").Where("user_id", "==", userID).Documents(ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return nil, err
	}
	var notes []FBNegotiationNote
	for _, doc := range docs {
		var note FBNegotiationNote
		if err := doc.DataTo(&note); err != nil {
			return nil, err
		}
		note.ID = doc.Ref.ID
		notes = append(notes, note)
	}
	return notes, nil
}

func CreateNegotiationNote(userID string, note *FBNegotiationNote) (string, error) {
	note.UserID = userID
	note.CreatedAt = time.Now().Unix()
	ref, _, err := fsClient.Collection("negotiation_notes").Add(ctx, note)
	if err != nil {
		return "", err
	}
	_, _ = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, nil
}

func DeleteNegotiationNote(noteID string) error {
	_, err := fsClient.Collection("negotiation_notes").Doc(noteID).Delete(ctx)
	return err
}

// ============================================================
// SECURE UPDATE/DELETE FUNCTIONS WITH OWNERSHIP VERIFICATION
// ============================================================

// UpdateBuyerInquirySecure verifies the inquiry belongs to the user before updating
func UpdateBuyerInquirySecure(inquiryID string, userID string, updates map[string]interface{}) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("buyer_inquiries").Doc(inquiryID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		updates["updated_at"] = time.Now().Unix()
		fbUpdates := make([]firestore.Update, 0, len(updates))
		for k, v := range updates {
			fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
		}
		return tx.Update(docRef, fbUpdates)
	})
}

// DeleteBuyerInquirySecure verifies the inquiry belongs to the user before deleting
func DeleteBuyerInquirySecure(inquiryID string, userID string) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("buyer_inquiries").Doc(inquiryID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		return tx.Delete(docRef)
	})
}

// UpdateSupplierSecure verifies the supplier belongs to the user before updating
func UpdateSupplierSecure(supplierID string, userID string, updates map[string]interface{}) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("suppliers").Doc(supplierID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		updates["updated_at"] = time.Now().Unix()
		fbUpdates := make([]firestore.Update, 0, len(updates))
		for k, v := range updates {
			fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
		}
		return tx.Update(docRef, fbUpdates)
	})
}

// DeleteSupplierSecure verifies the supplier belongs to the user before deleting
func DeleteSupplierSecure(supplierID string, userID string) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("suppliers").Doc(supplierID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		return tx.Delete(docRef)
	})
}

// UpdateBuyerCRMSecure verifies the CRM record belongs to the user before updating
func UpdateBuyerCRMSecure(crmID string, userID string, updates map[string]interface{}) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("buyer_crm").Doc(crmID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		fbUpdates := make([]firestore.Update, 0, len(updates))
		for k, v := range updates {
			fbUpdates = append(fbUpdates, firestore.Update{Path: k, Value: v})
		}
		return tx.Update(docRef, fbUpdates)
	})
}

// DeleteNegotiationNoteSecure verifies the note belongs to the user before deleting
func DeleteNegotiationNoteSecure(noteID string, userID string) error {
	return fsClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := fsClient.Collection("negotiation_notes").Doc(noteID)
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		ownerID, _ := doc.DataAt("user_id")
		if ownerID != userID {
			return fmt.Errorf("permission denied: resource ownership mismatch")
		}

		return tx.Delete(docRef)
	})
}
