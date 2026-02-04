package access

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	descAccess "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
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
