FROM golang:1.24-alpine AS builder

COPY . /m1stery18/github.com/RelocatorEvents/auth/source

RUN go mod download
RUN go build -o ./bin/auth cmd/auth/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /src/auth/bin/auth .
COPY --from=builder /src/auth/config ./config

CMD ["./auth", "--config-path", "config/prod.env"]

