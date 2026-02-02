package auth

import (
	"auth/internal/service"
	descAuth "auth/pkg/auth_v1"
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
