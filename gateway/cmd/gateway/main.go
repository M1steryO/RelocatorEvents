package main

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/app"
	"log"
)

func main() {
	a, err := app.NewApp(context.Background())
	if err != nil {
		log.Fatalf("failed to initialize application: %s", err)
	}
	err = a.Run()
	if err != nil {
		log.Fatalf("failed to run app: %s", err)
	}
}
