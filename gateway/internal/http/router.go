package http

import (
	"context"
	auth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	user "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	events "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
	reviews "github.com/M1steryO/RelocatorEvents/events/pkg/reviews_v1"
	media "github.com/M1steryO/RelocatorEvents/media/pkg/api/media/v1"
	grpcClients "github.com/M1steryO/RelocatorEvents/gateway/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/config"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/http/middleware"
	"google.golang.org/grpc/metadata"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net/http"
)

type Deps struct {
	Auth      grpcClients.AuthServiceClient
	AuthCfg   config.AuthServiceConfig
	EventsCfg config.EventsServiceConfig
	CORS      *middleware.CORS
}

func NewRouter(ctx context.Context, deps Deps) (http.Handler, error) {
	gw := runtime.NewServeMux(
		runtime.WithOutgoingHeaderMatcher(func(key string) (string, bool) {
			switch key {
			case "authorization":
				return "Authorization", true
			case "set-cookie":
				return "Set-Cookie", true
			default:
				return runtime.DefaultHeaderMatcher(key)
			}
		}),
		runtime.WithMetadata(func(ctx context.Context, r *http.Request) metadata.MD {
			userID, ok := r.Context().Value(middleware.CtxUserIdKey).(int64)
			if !ok {
				return metadata.MD{}
			}

			return metadata.Pairs(
				"x-user-id", strconv.FormatInt(userID, 10),
			)
		}),
	)

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}

	if err := auth.RegisterAuthV1HandlerFromEndpoint(ctx, gw, deps.AuthCfg.GetAddress(), opts); err != nil {
		return nil, err
	}

	if err := user.RegisterUserV1HandlerFromEndpoint(ctx, gw, deps.AuthCfg.GetAddress(), opts); err != nil {
		return nil, err
	}

	if err := events.RegisterEvent_V1HandlerFromEndpoint(ctx, gw, deps.EventsCfg.GetAddress(), opts); err != nil {
		return nil, err
	}

	if err := reviews.RegisterReviewsV1HandlerFromEndpoint(ctx, gw, deps.EventsCfg.GetAddress(), opts); err != nil {
		return nil, err
	}

	if err := media.RegisterMEdia

	r := chi.NewRouter()
	r.Use(deps.CORS.Handler)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	authMW := middleware.NewAuthMiddleware(deps.Auth /* + telegramAuth если нужно */)

	r.Route("/v1", func(r chi.Router) {

		r.Handle("/user/create", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.URL.Path = "/user/v1/create"
			gw.ServeHTTP(w, r)
		}))

		r.Group(func(r chi.Router) {
			r.Use(authMW.RequireAuth)
			r.Handle("/events/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r.URL.Path = "/events/v1" + strings.TrimPrefix(r.URL.Path, "/v1/events")
				gw.ServeHTTP(w, r)
			}))
			r.Handle("/user", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r.URL.Path = "/user/v1" + strings.TrimPrefix(r.URL.Path, "/v1/user")
				gw.ServeHTTP(w, r)
			}))

			r.Handle("/reviews", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r.URL.Path = "/reviews/v1" + strings.TrimPrefix(r.URL.Path, "/v1/reviews")
				gw.ServeHTTP(w, r)
			}))
		})

	})

	return r, nil
}
