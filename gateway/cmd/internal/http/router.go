package http

import (
	"context"
	"fmt"
	auth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	user "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"strings"

	//events "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
	grpcClients "github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/config"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/http/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net/http"
)

type Deps struct {
	Auth    grpcClients.AuthServiceClient
	AuthCfg config.AuthServiceConfig
	CORS    *middleware.CORS
}

//	func NewRouter(deps Deps) http.Handler {
//		r := chi.NewRouter()
//
//		r.Use(deps.CORS.Handler)
//		r.Use(middleware.RequestID)
//		r.Use(middleware.Logging)
//
//		// public
//		r.Get("/healthz", handlers.Health)
//
//		authMW := middleware.NewAuthMiddleware(deps.Auth)
//
//		r.Route("/v1", func(r chi.Router) {
//
//			r.With(authMW.RequireAuth).Get("/events", handl)
//		})
//
//		//r.Route("/v1", func(r chi.Router) {
//		//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
//		//})
//		//
//		//r.Route("/v1", func(r chi.Router) {
//		//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
//		//})
//		//
//		//r.Route("/v1", func(r chi.Router) {
//		//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
//		//})
//		//
//		//r.Route("/v1", func(r chi.Router) {
//		//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
//		//})
//		//
//		//r.Route("/v1", func(r chi.Router) {
//		//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
//		//})
//
//		return r
//	}
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
				fmt.Println(r.URL.Path)
				gw.ServeHTTP(w, r)
			}))
		})

	})

	return r, nil
}
