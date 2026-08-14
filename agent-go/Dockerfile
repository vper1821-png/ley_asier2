# Etapa de construcción: usamos Go 1.24 pero instalamos Go 1.25 manualmente
FROM golang:1.24-alpine AS builder

# Instalamos curl y descargamos Go 1.25.0
RUN apk add --no-cache curl && \
    curl -L https://go.dev/dl/go1.25.0.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Compilamos solo el binario para Linux (K8s)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o /invisia-agent .

# Etapa final: imagen ligera
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /invisia-agent /invisia-agent
CMD ["/invisia-agent", "run"]
