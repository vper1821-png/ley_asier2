FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download -x
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o /invisia-agent .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /invisia-agent /invisia-agent
CMD ["/invisia-agent", "run"]
