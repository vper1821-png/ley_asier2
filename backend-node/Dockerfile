# ── Etapa 1: compilar el agente Go para todas las plataformas ──
FROM golang:1.25-alpine AS agent-builder
WORKDIR /src
COPY agent-go/go.mod agent-go/go.sum ./
RUN go mod download
COPY agent-go/ .
RUN mkdir -p /out && \
    CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o /out/agent-win-x64.exe . && \
    CGO_ENABLED=0 GOOS=linux   GOARCH=amd64 go build -ldflags "-s -w" -o /out/agent-linux-x64 . && \
    CGO_ENABLED=0 GOOS=darwin  GOARCH=amd64 go build -ldflags "-s -w" -o /out/agent-mac-x64 . && \
    CGO_ENABLED=0 GOOS=darwin  GOARCH=arm64 go build -ldflags "-s -w" -o /out/agent-mac-arm64 .

# ── Etapa 2: runtime Node.js ──
FROM node:22-alpine
WORKDIR /app

# Instala Go (misma versión que en agent-builder)
RUN apk add --no-cache curl && \
    curl -L https://go.dev/dl/go1.25.0.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

# Instala msitools (wixl) y tar para empaquetar agentes
RUN apk add --no-cache msitools tar

# Copia el backend
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Copia los binarios pre‑compilados y el código fuente del agente
COPY --from=agent-builder /out/ /app/agent-bin/
COPY agent-go /app/agent-go

EXPOSE 3838
USER root
CMD ["node", "server.js"]
