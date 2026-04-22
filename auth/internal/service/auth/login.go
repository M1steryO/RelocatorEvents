package auth

import (
	"context"
	models "github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
)

func (s *serv) Login(ctx context.Context, email, password string) (*models.Credentials, error) {
	user, err := s.userService.
}
