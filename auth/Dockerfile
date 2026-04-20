FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY . .

RUN go mod download
RUN go build -o ./bin/auth cmd/auth/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /app/bin/auth .
COPY --from=builder /app/config ./config

CMD ["./auth", "--config-path", "config/prod.env"]
