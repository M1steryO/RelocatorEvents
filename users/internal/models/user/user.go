package user

import "time"

type User struct {
	ID   int64
	Info UserInfo

	CreatedAt time.Time
	UpdatedAt *time.Time
}

type UserInfo struct {
	UserID int64
	Name   string
	Email  *string

	TelegramID       *int64
	TelegramUsername string

	City    string
	Country string

	Interests []Interest
}
