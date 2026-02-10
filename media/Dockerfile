FROM golang:1.23-alpine AS builder

COPY . /m1stery18/github.com/RelocatorEvents/media/source
WORKDIR /m1stery18/github.com/RelocatorEvents/media/source

RUN go mod download
RUN go build -o ./bin/media cmd/media/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/RelocatorEvents/media/source/bin/media .

CMD ["./media", "-config-path", "config/local.env"]