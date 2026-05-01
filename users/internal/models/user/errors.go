package user

import "errors"

var (
	ErrUserNotFound         = errors.New("user not found")
	ErrUserExists           = errors.New("user exists")
	ErrIncorrectOldPassword = errors.New("old password does not match")
)
