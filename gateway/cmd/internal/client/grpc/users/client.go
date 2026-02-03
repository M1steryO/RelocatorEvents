package users

import desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"

type userServiceClient struct {
	client desc.UserV1Client
}

func NewUserServiceClient(client desc.UserV1Client) *userServiceClient {
	return &userServiceClient{client: client}

}
