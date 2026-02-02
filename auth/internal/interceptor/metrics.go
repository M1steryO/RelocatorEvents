package interceptor

import (
	"auth/internal/metric"
	"context"
	"google.golang.org/grpc"
	"time"
)

func MetricsInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	metric.IncRequestCounter()
	startTime := time.Now()
	res, err := handler(ctx, req)
	reqTime := time.Since(startTime).Seconds()
	if err != nil {
		metric.IncResponseCounter("error", info.FullMethod)
		metric.HistogramResponseTimeObserve("error", reqTime)
	} else {
		metric.IncResponseCounter("success", info.FullMethod)
		metric.HistogramResponseTimeObserve("success", reqTime)
	}
	return res, err
}
