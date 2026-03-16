package grpc

import "context"

type UserServiceClient interface {
	GetUserCountry(context.Context, int64) (string, error)
	GetUserName(ctx context.Context, userId int64) (string, error)
}
