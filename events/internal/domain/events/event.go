package events

import (
	"time"
)

type EventType int32

const (
	EventTypeOffline EventType = 0
	EventTypeOnline  EventType = 1
)

func (et EventType) String() string {
	switch et {
	case EventTypeOffline:
		return "offline"
	case EventTypeOnline:
		return "online"
	}

	return ""
}

type Event struct {
	Id             int64
	Title          string
	Description    *string
	Link           string
	Rating         *float32
	ReviewsCount   *int32
	RatingsCount   *int32
	MinAge         *int32
	SeatsAvailable *int32
	Type           EventType
	MinPrice       *int32
	Currency       *string
	StartsAt       time.Time
	ImageUrl       *string
	Address        *EventAddress
	CreatedAt      time.Time
	UpdatedAt      *time.Time
}
type EventAddress struct {
	VenueName   *string
	FullAddress string

	Country    string
	City       string
	District   *string
	PostalCode *string

	Latitude  *float64
	Longitude *float64

	CreatedAt time.Time
}

type EventCategory struct {
	Title string
	Code  string
}

type FiltersData struct {
	MinPrice   *int32
	MaxPrice   *int32
	Cities     []string
	Categories []*EventCategory
}

type EventsList struct {
	Data    []*Event
	Filters *FiltersData
}
