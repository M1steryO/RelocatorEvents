package auth

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
)

type Implementation struct {
	descAuth.UnimplementedAuthV1Server
	service service.UserService
}

func NewImplementation(service service.UserService) *Implementation {
	return &Implementation{
		service: service,
	}
}
