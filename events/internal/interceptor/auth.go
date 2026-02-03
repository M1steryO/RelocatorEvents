package interceptor

import (
	"context"
	"errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"strconv"
)

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("metadata is not provided")
	}
	userIdMetadata, ok := md["x-user-id"]
	if !ok {
		return nil, errors.New("metadata is not provided")
	}
	if len(userIdMetadata) != 1 {
		return nil, errors.New("metadata is not provided")
	}
	userId, err := strconv.ParseInt(userIdMetadata[0], 10, 64)
	if err != nil {
		return nil, errors.New("metadata is not provided")
	}

	ctx = context.WithValue(ctx, "userId", userId)
	return handler(ctx, req)
}
