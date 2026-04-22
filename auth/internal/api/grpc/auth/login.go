package auth

import (
	"context"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
)

func (i *Implementation) Login(ctx context.Context, req *descAuth.LoginRequest) (*descAuth.LoginResponse, error) {
	creds, err := i.authService.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, err
	}

	return &descAuth.LoginResponse{
		AccessToken:  creds.AccessToken,
		RefreshToken: creds.RefreshToken,
	}, nil
}
