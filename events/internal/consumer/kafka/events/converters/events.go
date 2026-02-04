package converters

import (
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	"strings"
	"time"
)

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

func ToDomainEvent(src Event) *domain.Event {
	now := time.Now()

	var price int32
	var pricePtr *int32

	if src.Price != nil {
		price = int32(*src.Price)
	}

	pricePtr = &price

	ev := &domain.Event{
		Title:       strings.TrimSpace(src.Title),
		Description: strPtrOrNil(src.Description),
		Link:        strings.TrimSpace(src.Link),

		MinAge:   int32PtrFromIntPtr(src.Age),
		Type:     domain.EventTypeOffline, // из этого DTO online/offline не определить — считаем offline по умолчанию
		MinPrice: pricePtr,
		Currency: strPtrOrNil(src.Currency),

		StartsAt: src.StartsAt,
		ImageUrl: strPtrOrNil(src.ImgURL),

		Address: &domain.EventAddress{
			VenueName:   strPtrOrNil(src.Venue),
			FullAddress: strings.TrimSpace(src.Address),

			Country: strings.TrimSpace(src.Country),
			City:    strings.TrimSpace(src.City),

			// District/PostalCode в DTO нет
			Latitude:  float64Ptr(src.Latitude),
			Longitude: float64Ptr(src.Longitude),

			CreatedAt: now,
		},

		CreatedAt: now,
	}

	// Rating/ReviewsCount/RatingsCount/SeatsAvailable/UpdatedAt/Id — не приходят из DTO, остаются nil/0
	return ev
}

// --- helpers ---

func strPtrOrNil(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	v := s
	return &v
}

func int32PtrFromIntPtr(p *int) *int32 {
	if p == nil {
		return nil
	}
	v := int32(*p)
	return &v
}

func float64Ptr(v float64) *float64 {
	// если хочешь игнорировать 0 как "нет значения" — раскомментируй:
	// if v == 0 { return nil }
	x := v
	return &x
}
