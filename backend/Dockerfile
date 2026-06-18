# =============================================================================
# Stage 1: Build static Go binary
# =============================================================================
FROM golang:1.25-alpine AS builder

WORKDIR /build

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -o /build/mrt-server \
    ./cmd/api/main.go

# =============================================================================
# Stage 2: Minimal runtime image
# =============================================================================
FROM alpine:3.19 AS runner

RUN apk add --no-cache ca-certificates tzdata curl && \
    adduser -D -u 1000 appuser

WORKDIR /app

COPY --from=builder /build/mrt-server .
COPY --from=builder /build/migrations ./migrations

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9090/api/health || exit 1

CMD ["./mrt-server"]
