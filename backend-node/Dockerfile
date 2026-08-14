# ── Etapa 1: compilar el agente Go ──
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

# Copia el backend (código + dependencias)
COPY backend-node/package*.json ./
RUN npm ci --only=production
COPY backend-node/ .

# Copia los binarios pre‑compilados del agente
COPY --from=agent-builder /out/ /app/agent-bin/

# (Opcional) También copia el código fuente del agente si necesitas recompilar bajo demanda
COPY agent-go /app/agent-go

EXPOSE 3838
CMD ["node", "server.js"]
