package auth

import desc "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"

type authServiceClient struct {
	client desc.AuthV1Client
}

func NewAuthServiceClient(client desc.AuthV1Client) *authServiceClient {
	return &authServiceClient{client: client}

}
