package user

import (
	"auth/internal/service"
	desc "auth/pkg/user_v1"
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
