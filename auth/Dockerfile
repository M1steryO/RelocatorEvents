FROM golang:1.23-alpine AS builder

COPY . /m1stery18/github.com/TestGoProject/auth/source
WORKDIR /m1stery18/github.com/TestGoProject/auth/source

RUN go mod download
RUN go build -o ./bin/auth cmd/auth/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/TestGoProject/auth/source/bin/auth .

CMD ["./auth", "-config-path", "config/local.env"]