package users

import desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"

type userServiceClient struct {
	client desc.UserServiceClient
}

func NewUserServiceClient(client desc.UserServiceClient) *userServiceClient {
	return &userServiceClient{client: client}

}
