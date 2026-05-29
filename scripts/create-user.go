package main

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	opt := option.WithCredentialsFile("../../firebase-service-account.json")
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}

	email := "demo123@exopilot.id"
	password := "Testing123!"

	params := (&auth.UserToCreate{}).
		Email(email).
		EmailVerified(true).
		Password(password).
		DisplayName("Demo Firebase User").
		Disabled(false)

	u, err := client.CreateUser(ctx, params)
	if err != nil {
		log.Fatalf("error creating user: %v\n", err)
	}

	fmt.Printf("✅ BERHASIL! Akun berhasil dibuat dan tersimpan di Firebase Auth.\nUID: %s\nEmail: %s\nPassword: %s\n", u.UID, email, password)
}
