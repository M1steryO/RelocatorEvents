package reviews

import "errors"

var (
	ErrReviewNotFound = errors.New("event not found")
	ErrReviewExists   = errors.New("event already exists")
	ErrInvalid        = errors.New("invalid error")
)
