package app

import (
	"context"
	"flag"
	"github.com/M1steryO/RelocatorEvents/auth/internal/config"
	"github.com/M1steryO/RelocatorEvents/auth/internal/interceptor"
	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	"github.com/M1steryO/RelocatorEvents/auth/internal/metric"
	"github.com/M1steryO/RelocatorEvents/auth/internal/utils/rate_limiter"
	descAccess "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"github.com/M1steryO/platform_common/pkg/closer"
	grpcMiddleware "github.com/grpc-ecosystem/go-grpc-middleware"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/grpc-ecosystem/grpc-opentracing/go/otgrpc"
	"github.com/opentracing/opentracing-go"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sony/gobreaker"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

var configPath = ""

func init() {
	flag.StringVar(&configPath, "config-path", "local.env", "path to config file")
}

type App struct {
	serviceProvider *serviceProvider
	grpcServer      *grpc.Server
	httpServer      *http.Server
}

func NewApp(ctx context.Context) (*App, error) {
	a := &App{}
	err := a.initDeps(ctx)

	if err != nil {
		return nil, err
	}
	return a, nil
}

func (a *App) Run() error {
	defer func() {
		closer.CloseAll()
		closer.Wait()
	}()
	wg := sync.WaitGroup{}
	wg.Add(3)
	go func() {
		defer wg.Done()
		err := a.runGRPCServer()
		if err != nil {
			log.Fatal("failed to run grpc server: ", err)
		}
	}()

	go func() {
		defer wg.Done()
		err := a.runHTTPServer()
		if err != nil {
			log.Fatal("failed to run http server: ", err)
		}
	}()

	go func() {
		defer wg.Done()
		err := a.runPrometheus()
		if err != nil {
			log.Fatal("failed to run prometheus server: ", err)
		}
	}()

	logger.Init(a.serviceProvider.LoggerConfig().Env())

	wg.Wait()
	return nil
}

func (a *App) initDeps(ctx context.Context) error {
	inits := []func(context.Context) error{
		a.initConfig,
		a.initServiceProvider,
		a.initGRPCServer,
		a.initHTTPServer,
		metric.Init,
	}

	for _, f := range inits {
		err := f(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *App) initConfig(_ context.Context) error {
	flag.Parse()
	err := config.Load(configPath)
	if err != nil {
		return err
	}

	return nil
}

func (a *App) initServiceProvider(_ context.Context) error {
	a.serviceProvider = newServiceProvider()
	return nil
}

func (a *App) initGRPCServer(ctx context.Context) error {
	//creds, err := credentials.NewServerTLSFromFile("service.pem", "service.key")
	//if err != nil {
	//	log.Fatalf("failed to load TLS keys: %v", err)
	//}

	limit := a.serviceProvider.GRPCConfig().RateLimit()
	rateLimiter := rate_limiter.NewRateLimiter(ctx, limit, time.Second)

	_ = gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        "auth",
		MaxRequests: 3,               // half-open state setting
		Timeout:     5 * time.Second, // open state setting
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
			return failureRatio >= 0.6
		},
		OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
			log.Printf("Circuit Breaker: %s, changed from %v, to %v\n", name, from, to)
		},
	})

	a.grpcServer = grpc.NewServer(
		//grpc.Creds(creds),
		grpc.Creds(insecure.NewCredentials()),
		grpc.UnaryInterceptor(
			grpcMiddleware.ChainUnaryServer(
				interceptor.NewRateLimiterInterceptor(rateLimiter).Unary,
				// interceptor.NewCircuitBreakerInterceptor(circuitBreaker).Unary,
				otgrpc.OpenTracingServerInterceptor(opentracing.GlobalTracer()),
				interceptor.ErrorCodesInterceptor,
				interceptor.MetricsInterceptor,
				interceptor.ValidateInterceptor,
				interceptor.LoggerInterceptor,
			),
		),
	)

	reflection.Register(a.grpcServer)

	desc.RegisterUserV1Server(a.grpcServer, a.serviceProvider.UserImpl(ctx))
	descAuth.RegisterAuthV1Server(a.grpcServer, a.serviceProvider.AuthImpl(ctx))
	descAccess.RegisterAccessV1Server(a.grpcServer, a.serviceProvider.AccessImpl(ctx))

	return nil
}

func (a *App) initHTTPServer(ctx context.Context) error {

	authHeaderMatcher := func(key string) (string, bool) {
		switch strings.ToLower(key) {
		case "cookie", "set-cookie", "authorization", "x-telegram-init-data":
			return key, true
		}
		return runtime.DefaultHeaderMatcher(key)
	}

	mux := runtime.NewServeMux(
		runtime.WithIncomingHeaderMatcher(authHeaderMatcher),
		runtime.WithOutgoingHeaderMatcher(authHeaderMatcher),
	)

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}

	err := desc.RegisterUserV1HandlerFromEndpoint(ctx, mux, a.serviceProvider.GRPCConfig().Address(), opts)
	if err != nil {
		return err
	}
	err = descAccess.RegisterAccessV1HandlerFromEndpoint(ctx, mux, a.serviceProvider.GRPCConfig().Address(), opts)
	if err != nil {
		return err
	}
	err = descAccess.RegisterAccessV1HandlerFromEndpoint(ctx, mux, a.serviceProvider.GRPCConfig().Address(), opts)
	if err != nil {
		return err
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS заголовки
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Authorization, Cookie, X-Telegram-Init-Data")
		w.Header().Set("Access-Control-Expose-Headers", "Authorization, Set-Cookie")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		mux.ServeHTTP(w, r)
	})

	a.httpServer = &http.Server{
		Addr:    a.serviceProvider.HTTPConfig().Address(),
		Handler: handler,
	}
	return nil
}

func (a *App) runGRPCServer() error {
	log.Printf("GRPC server is running on %s", a.serviceProvider.GRPCConfig().Address())

	list, err := net.Listen("tcp", a.serviceProvider.GRPCConfig().Address())
	if err != nil {
		return err
	}

	err = a.grpcServer.Serve(list)
	if err != nil {
		return err
	}

	return nil
}

func (a *App) runHTTPServer() error {
	log.Printf("HTTP server is running on %s", a.serviceProvider.HTTPConfig().Address())

	err := a.httpServer.ListenAndServe()
	if err != nil {
		return err
	}
	return nil
}

func (a *App) runPrometheus() error {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())

	prometheusServer := http.Server{
		Addr:    a.serviceProvider.PromConfig().Address(),
		Handler: mux,
	}

	log.Printf("Prometheus server is running on %s", a.serviceProvider.PromConfig().Address())
	err := prometheusServer.ListenAndServe()
	if err != nil {
		return err
	}
	return nil
}
