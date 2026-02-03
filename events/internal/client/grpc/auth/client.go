package auth

import desc "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"

type authServiceClient struct {
	client desc.AccessV1Client
}

func NewAuthServiceClient(client desc.AccessV1Client) *authServiceClient {
	return &authServiceClient{client: client}

}
