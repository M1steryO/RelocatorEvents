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
		logger.Info("step 1: incoming metadata missing")
		return nil, sys.NewCommonError("metadata is not provided: no incoming context", codes.Unauthenticated)
	}

	logger.Info(fmt.Sprintf("step 2: full metadata: %+v", md))

	userIdMetadata, ok := md["x-user-id"]
	if !ok {
		logger.Info("step 3: x-user-id key missing")
		return nil, sys.NewCommonError("metadata is not provided: x-user-id missing", codes.Unauthenticated)
	}

	logger.Info(fmt.Sprintf("step 4: x-user-id raw: %+v", userIdMetadata))

	if len(userIdMetadata) != 1 {
		logger.Info(fmt.Sprintf("step 5: invalid x-user-id count: %d", len(userIdMetadata)))
		return nil, sys.NewCommonError("metadata is not provided: invalid x-user-id count", codes.Unauthenticated)
	}

	userId, err := strconv.ParseInt(userIdMetadata[0], 10, 64)
	if err != nil {
		logger.Info(fmt.Sprintf("step 6: parse error: %v", err))
		return nil, sys.NewCommonError("metadata is not provided: invalid x-user-id value", codes.Unauthenticated)
	}

	logger.Info(fmt.Sprintf("step 7: parsed userId = %d", userId))

	ctx = context.WithValue(ctx, "userId", userId)

	logger.Info("step 8: before handler")
	resp, err := handler(ctx, req)

	logger.Info(fmt.Sprintf("step 9: after handler, err = %v", err))

	return resp, err
}
