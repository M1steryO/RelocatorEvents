package access

import (
	"auth/internal/service"
	descAccess "auth/pkg/access_v1"
)

type Implementation struct {
	descAccess.UnimplementedAccessV1Server
	service service.UserService
}

func NewImplementation(service service.UserService) *Implementation {
	return &Implementation{
		service: service,
	}
}
