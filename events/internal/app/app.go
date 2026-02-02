package app

import (
	"context"
	"events/internal/client/kafka"
	"events/internal/config"
	"events/internal/core/logger"
	"events/internal/core/utils/rate_limiter"
	"events/internal/interceptor"
	"events/internal/metric"
	"events/internal/middleware"
	desc "events/pkg/events_v1"
	reviewsDesc "events/pkg/reviews_v1"
	"flag"
	"github.com/M1steryO/platform_common/pkg/closer"
	kafka2 "github.com/confluentinc/confluent-kafka-go/v2/kafka"
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
	promServer      *http.Server

	kafkaConsumer *kafka.Consumer
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

	go func() {
		defer wg.Done()
		ctx := context.Background()
		err := a.runKafkaConsumer(ctx)
		if err != nil {
			log.Fatal("failed to run kafka consumer: ", err)
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
		a.initPrometheus,
		a.initKafkaConsumer,
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
		Name:        "events",
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
				interceptor.AuthInterceptor,
				interceptor.ValidateInterceptor,
				interceptor.ErrorCodesInterceptor,
				interceptor.MetricsInterceptor,
				interceptor.LoggerInterceptor,
			),
		),
	)

	reflection.Register(a.grpcServer)

	desc.RegisterEvent_V1Server(a.grpcServer, a.serviceProvider.EventsImpl(ctx))
	reviewsDesc.RegisterReviewsV1Server(a.grpcServer, a.serviceProvider.ReviewsImpl(ctx))

	return nil
}

func (a *App) initHTTPServer(ctx context.Context) error {
	mux := runtime.NewServeMux()

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}

	err := desc.RegisterEvent_V1HandlerFromEndpoint(ctx, mux, a.serviceProvider.GRPCConfig().Address(), opts)

	err = reviewsDesc.RegisterReviewsV1HandlerFromEndpoint(ctx, mux, a.serviceProvider.GRPCConfig().Address(), opts)

	handlerWithAuth := middleware.AuthMiddleware(mux)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS заголовки
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Expose-Headers", "Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		handlerWithAuth.ServeHTTP(w, r)
	})

	if err != nil {
		return err
	}
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
func (a *App) initPrometheus(ctx context.Context) error {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())

	prometheusServer := http.Server{
		Addr:    a.serviceProvider.PromConfig().Address(),
		Handler: mux,
	}
	a.promServer = &prometheusServer
	return nil

}

func (a *App) runPrometheus() error {
	log.Printf("Prometheus server is running on %s", a.serviceProvider.PromConfig().Address())
	err := a.promServer.ListenAndServe()
	if err != nil {
		return err
	}
	return nil
}

func (a *App) runKafkaConsumer(ctx context.Context) error {
	if err := a.kafkaConsumer.Start(ctx); err != nil {
		log.Fatal("failed to run kafka consumer: ", err)
	}
	return nil
}

type handler struct {
}

func (h *handler) Handle(msg []byte, topic kafka2.TopicPartition, consumerNumber int) error {
	return nil
}

func (a *App) initKafkaConsumer(ctx context.Context) error {
	kafkaCfg := a.serviceProvider.KafkaConfig()
	cn := 0
	consumer, err := kafka.NewConsumer(kafkaCfg.Brokers(), kafkaCfg.Topics(), a.serviceProvider.EventsHandler(ctx), cn)

	if err != nil {
		return err
	}
	a.kafkaConsumer = consumer

	closer.Add(consumer.Stop)
	return nil
}
