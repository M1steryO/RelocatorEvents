package models

import "time"

type Event struct {
	Link        string    `json:"link"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Country     string    `json:"country"`
	Category    string    `json:"category"`
	StartsAt    time.Time `json:"starts_at"`
	Venue       string    `json:"venue"`
	City        string    `json:"city"`
	Price       *float64  `json:"price"`
	Currency    string    `json:"currency"`
	Age         *int      `json:"age"` // nullable
	Address     string    `json:"address"`
	Longitude   float64   `json:"longitude"`
	Latitude    float64   `json:"latitude"`
	ImgURL      string    `json:"img_url"`
}
