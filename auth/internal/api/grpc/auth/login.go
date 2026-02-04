package auth

import (
	"context"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
)

func (i *Implementation) Login(ctx context.Context, req *descAuth.LoginRequest) (*descAuth.LoginResponse, error) {
	return &descAuth.LoginResponse{}, nil
}
