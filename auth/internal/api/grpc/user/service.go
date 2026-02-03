package user

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
)

type Implementation struct {
	desc.UnimplementedUserV1Server
	service service.UserService
}

func NewUserImplementation(s service.UserService) *Implementation {
	return &Implementation{
		service: s,
	}
}
