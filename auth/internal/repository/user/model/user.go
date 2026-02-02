package model

import (
	"database/sql"
	"time"
)

type User struct {
	Id   int64     `db:"id"`
	Info *UserInfo `db:""`

	CreatedAt time.Time    `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type UserInfo struct {
	TelegramId       *int64 `db:"telegram_id"`
	TelegramUsername string `db:"tg_username"`

	Email string `db:"email"`
	Name  string `db:"name"`

	Country string `db:"country"`
	City    string `db:"city"`

	Interests []UserInterest `db:"interests"`
}

type UserInterest struct {
	Id    int64  `db:"id"`
	Code  string `db:"code"`
	Title string `db:"title"`
}

type CreateUserInfoModel struct {
	Name  string
	Email string

	TelegramId       *int64
	TelegramUsername string

	City    string
	Country string

	Interests []string
}

type CreateUserModel struct {
	Info  CreateUserInfoModel
	Name  string
	Email string

	TelegramToken    string
	TelegramUsername string

	Password string
}
