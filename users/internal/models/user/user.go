package user

import "time"

type User struct {
	ID       int64
	Info     UserInfo
	Password string

	CreatedAt time.Time
	UpdatedAt *time.Time
}

type UserInfo struct {
	UserID int64
	Name   string
	Email  *string

	TelegramID       *int64
	TelegramUsername string

	City     string
	Country  string
	Language string

	Interests []Interest

	AvatarURL *string
}

type UpdateUser struct {
	Name      *string
	Email     *string
	Password  *string
	AvatarURL *string
}
