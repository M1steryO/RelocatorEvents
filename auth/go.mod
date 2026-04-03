module github.com/M1steryO/RelocatorEvents/auth

go 1.24.0

toolchain go1.24.2

require (
	github.com/M1steryO/RelocatorEvents/users v0.0.0
	github.com/M1steryO/platform_common v0.0.0-20260131174141-b1e792f26ff2
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/fatih/color v1.18.0
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/grpc-ecosystem/go-grpc-middleware v1.4.0
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.27.7
	github.com/grpc-ecosystem/grpc-opentracing v0.0.0-20180507213350-8e809c8a8645
	github.com/joho/godotenv v1.5.1
	github.com/opentracing/opentracing-go v1.2.0
	github.com/pkg/errors v0.9.1
	github.com/prometheus/client_golang v1.23.2
	github.com/sony/gobreaker v1.0.0
	google.golang.org/genproto/googleapis/api v0.0.0-20260203192932-546029d2fa20
	google.golang.org/grpc v1.78.0
	google.golang.org/protobuf v1.36.11
)

replace github.com/M1steryO/RelocatorEvents/users => ../users

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/prometheus/client_model v0.6.2 // indirect
	github.com/prometheus/common v0.66.1 // indirect
	github.com/prometheus/procfs v0.16.1 // indirect
	go.yaml.in/yaml/v2 v2.4.2 // indirect
	golang.org/x/net v0.48.0 // indirect
	golang.org/x/sys v0.40.0 // indirect
	golang.org/x/text v0.33.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260128011058-8636f8732409 // indirect
)
