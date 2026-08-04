# PawPals backend (Java / Spring Boot)

A from-scratch Java port of `apps/backend` (NestJS), covering the same feature set: auth, pets,
discover/matching, swipes, wallet, meetings (escrow + QR check-in), and chat. It's a parallel
implementation, in the same spirit as `apps/backend-dotnet` — not a drop-in replacement that shares
the Node backend's live data.

Stack: Spring Boot 4.1, Java 17, Spring Security (JWT, stateless), Spring Data JPA (Hibernate),
Spring Data Redis, a plain Spring `WebSocketHandler` for chat, Maven (wrapper included, no local
Maven install needed).

## Running it

```bash
# from apps/backend-java
cp .env.example .env   # optional — sane dev defaults are already baked into application.yml
./mvnw spring-boot:run
```

Needs Postgres + Redis — the repo's root `docker-compose.yml` already provides both
(`docker compose up -d postgres redis` from the repo root). Defaults assume that compose file
(`localhost:5434` / `localhost:6379`). The server listens on **port 3003** by default (the Node
backend uses 3001) so both can run side by side.

`./mvnw test` runs the default context-load test against those same services.

## Deliberate differences from the Node backend

These were conscious tradeoffs to keep this scaffold simple and robust to stand up on its own,
not oversights:

- **Own database schema.** The Node backend's schema is Prisma-managed (native Postgres enums,
  exact `"User"`/`"Pet"`/... table names). This app uses Hibernate (`ddl-auto: update`) against its
  own snake_case tables (`users`, `pets`, ...), auto-created on first boot. It can point at the same
  Postgres server/database as the Node backend without colliding, but the two don't share rows —
  registering a user here doesn't make them appear in the Node backend's DB or vice versa. Making
  them share Prisma's exact schema is possible but means fighting Hibernate's native-Postgres-enum
  mapping (a known rough edge across Hibernate versions); not worth it unless you actually need both
  backends reading the same live data.
- **Chat WebSocket protocol.** The Node backend speaks Socket.IO (`chat.gateway.ts`); the existing
  web/mobile apps use `socket.io-client`. This backend exposes a plain WebSocket at
  `/ws/chat?token=<accessToken>` with a JSON envelope (`{"type": "...", "payload": {...}}`) instead —
  same events (`chat:join`, `chat:send` in; `chat:message`, `chat:read`, `match:new`,
  `meeting:updated` out), different wire protocol. `backend-dotnet` made the same call (it uses
  SignalR). If you want the existing frontends to talk to this backend for chat specifically, either
  add a Socket.IO-compatible layer (e.g. `netty-socketio`) or adjust the client's connection logic.
- **`sendTreat` insufficient-balance error.** The Node backend throws a bare `Error` here, which
  Nest turns into an unhandled 500. This backend returns a proper `422 INSUFFICIENT_BALANCE`,
  consistent with how the same condition is handled everywhere else (e.g. meeting escrow).

## Layout

Mirrors the Node backend's module boundaries as Java packages:
`auth`, `user`, `pet`, `discover`, `swipe` (also owns `Match`), `wallet`, `meeting`, `chat`
(REST + the WebSocket handler), `config` (security, CORS, static `/uploads`, app properties),
`common` (shared exception handling).
