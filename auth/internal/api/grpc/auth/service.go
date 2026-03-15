package auth

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
)

type Implementation struct {
	descAuth.UnimplementedAuthServiceServer
	authService service.AuthService
}

func NewImplementation(authService service.AuthService) *Implementation {
	return &Implementation{
		authService: authService,
	}
}
