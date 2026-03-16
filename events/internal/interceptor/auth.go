package interceptor

import (
	"context"
	"fmt"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"strconv"
)

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, sys.NewCommonError("metadata is not provided", codes.Unauthenticated)
	}

	userIdMetadata, ok := md["x-user-id"]
	logger.Info(fmt.Sprint(userIdMetadata))
	if !ok {
		logger.Info("x-user-id is not provided")
		return nil, sys.NewCommonError("metadata is not provided", codes.Unauthenticated)
	}
	if len(userIdMetadata) != 1 {
		logger.Info("x-user-id is not provided 2")
		return nil, sys.NewCommonError("metadata is not provided", codes.Unauthenticated)
	}

	userId, err := strconv.ParseInt(userIdMetadata[0], 10, 64)
	if err != nil {
		logger.Info("x-user-id is not provided 3")
		return nil, sys.NewCommonError("metadata is not provided", codes.Unauthenticated)
	}

	ctx = context.WithValue(ctx, "userId", userId)
	return handler(ctx, req)
}
