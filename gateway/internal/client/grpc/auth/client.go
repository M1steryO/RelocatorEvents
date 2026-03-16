package auth

import desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"

type authServiceClient struct {
	client desc.AuthServiceClient
}

func NewAuthServiceClient(client desc.AuthServiceClient) *authServiceClient {
	return &authServiceClient{client: client}

}
