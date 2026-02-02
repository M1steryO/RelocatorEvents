package model

import (
	"database/sql"
	"time"
)

type EventType string

const (
	EventTypeOffline EventType = "offline"
	EventTypeOnline  EventType = "online"
)

type Event struct {
	Id             int64           `db:"id"`
	Title          string          `db:"title"`
	Description    sql.NullString  `db:"description"`
	Link           string          `db:"link"`
	Rating         sql.NullFloat64 `db:"rating"`
	ReviewsCount   sql.NullInt32   `db:"reviews_count"`
	RatingsCount   sql.NullInt32   `db:"ratings_count"`
	MinAge         sql.NullInt32   `db:"min_age"`
	MinPrice       sql.NullInt32   `db:"min_price"`
	Currency       sql.NullString  `db:"currency"`
	SeatsAvailable sql.NullInt32   `db:"seats_available"`
	Type           EventType       `db:"type"`
	StartsAt       time.Time       `db:"starts_at"`
	ImageUrl       sql.NullString  `db:"image_url"`

	Address *EventAddress `db:""`

	CreatedAt time.Time    `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type EventAddress struct {
	VenueName sql.NullString `db:"venue_name"`

	City        sql.NullString `db:"city"`
	District    sql.NullString `db:"district"`
	PostalCode  sql.NullString `db:"postal_code"`
	Country     sql.NullString `db:"country"`
	FullAddress sql.NullString `db:"full_address"`

	Latitude  sql.NullFloat64 `db:"latitude"`
	Longitude sql.NullFloat64 `db:"longitude"`

	CreatedAt time.Time `db:"created_at"`
}

type EventCategory struct {
	Title string `db:"title"`
	Code  string `db:"code"`
}

type FiltersData struct {
	MinPrice   sql.NullInt32    `db:"min_price"`
	MaxPrice   sql.NullInt32    `db:"max_price"`
	Cities     []string         `db:"cities"`
	Categories []*EventCategory `db:"categories"`
}
