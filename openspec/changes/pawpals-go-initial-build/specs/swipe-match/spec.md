## ADDED Requirements

### Requirement: Record swipe action
The system SHALL expose `POST /swipes` accepting `{ targetUserId, direction: 'LIKE' | 'PASS' | 'SUPER_LIKE' }`. For `LIKE` and `SUPER_LIKE` directions, the backend SHALL immediately write the interaction to Redis (`SADD user:{userId}:likes {targetUserId}`) without a synchronous PostgreSQL write.

#### Scenario: LIKE recorded in Redis
- **WHEN** user A calls `POST /swipes` with `{ targetUserId: B, direction: 'LIKE' }`
- **THEN** the backend executes `SADD user:A:likes B` in Redis and returns within 50 ms

#### Scenario: PASS is not stored in Redis
- **WHEN** user A calls `POST /swipes` with `{ direction: 'PASS' }`
- **THEN** the backend does NOT write to Redis and returns `{ matched: false }`

---

### Requirement: Instant mutual match detection
Immediately after writing a LIKE to Redis, the backend SHALL execute `SISMEMBER user:{targetUserId}:likes {userId}` to check whether the target has previously liked the caller. This check SHALL complete in O(1) time regardless of the number of total likes in the system.

#### Scenario: No mutual like
- **WHEN** user B has not previously liked user A
- **THEN** `SISMEMBER` returns 0 and the API responds `{ matched: false }`

#### Scenario: Mutual like detected
- **WHEN** user B previously liked user A (entry exists in Redis `user:B:likes`)
- **THEN** `SISMEMBER` returns 1, the backend creates a `Match` record in PostgreSQL, and responds `{ matched: true, matchId: "<uuid>" }`

---

### Requirement: Match persistence
When a mutual match is detected, the backend SHALL create exactly one `Match` record in PostgreSQL containing `userAId`, `userBId`, `createdAt`. Duplicate match records for the same pair SHALL be prevented via a unique constraint.

#### Scenario: Match record created on mutual like
- **WHEN** a mutual like is detected between users A and B
- **THEN** a single `Match` row is inserted with both user IDs (lower ID first for deduplication)

#### Scenario: No duplicate match on race condition
- **WHEN** both users like each other simultaneously
- **THEN** only one `Match` record exists (enforced by unique constraint on `(min(A,B), max(A,B))`)

---

### Requirement: Real-time match notification
When a match is created, the backend SHALL emit a `match:new` Socket.IO event to both users' connected sockets containing `{ matchId, partnerProfile }`. The frontend SHALL display a full-screen match modal upon receiving this event.

#### Scenario: Both users online at match time
- **WHEN** a match is created and both users have active WebSocket connections
- **THEN** both users receive a `match:new` event within 200 ms and the modal appears

#### Scenario: Offline user
- **WHEN** one user is not connected at match time
- **THEN** the match is persisted in PostgreSQL; the notification is delivered when the user reconnects (via `GET /matches` polling on app foreground)

---

### Requirement: Swipe deck card queue
The frontend SHALL pre-fetch and display a queue of up to 10 profiles from `GET /discover`. When the queue drops below 3 cards, the frontend SHALL automatically fetch the next page.

#### Scenario: Queue refill
- **WHEN** the user swipes such that 2 cards remain in the local queue
- **THEN** the frontend calls `GET /discover?page=<next>` and appends the results to the queue

#### Scenario: Queue exhausted
- **WHEN** `GET /discover` returns an empty page and the local queue is empty
- **THEN** the frontend displays an "附近暫時沒有新朋友" empty state card
