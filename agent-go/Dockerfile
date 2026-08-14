FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /invisia-agent .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=build /invisia-agent /invisia-agent
CMD ["/invisia-agent", "run"]
