# Etapa de construcción: Alpine limpia + Go 1.25 descargado manualmente
FROM alpine:latest AS builder

# Instalamos herramientas y descargamos Go 1.25.0
RUN apk add --no-cache curl ca-certificates && \
    curl -L https://go.dev/dl/go1.25.0.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}" \
    GOPATH="/go" \
    GOROOT="/usr/local/go"

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Sincronizamos dependencias (esto actualizará go.mod si hace falta)
RUN go mod tidy
# Compilamos el binario para Linux
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o /invisia-agent .

# Imagen final (ligera)
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /invisia-agent /invisia-agent
CMD ["/invisia-agent", "run"]
