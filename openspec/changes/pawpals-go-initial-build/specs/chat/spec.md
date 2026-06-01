## ADDED Requirements

### Requirement: Send chat message
The system SHALL allow two matched users to send text messages to each other via Socket.IO event `chat:send` within their match room (`room:match-{matchId}`). Each message SHALL be persisted to the `Message` table with `matchId`, `senderId`, `text`, `createdAt`.

#### Scenario: Message delivered to both parties
- **WHEN** user A emits `chat:send` with `{ matchId, text: "hello" }` and both users are connected
- **THEN** the server persists the message and emits `chat:message` to both users in the room within 100 ms

#### Scenario: Non-matched users cannot chat
- **WHEN** a user emits `chat:send` with a `matchId` they are not a party to
- **THEN** the server emits `chat:error` with `{ code: 'UNAUTHORIZED_MATCH' }` and does not persist the message

---

### Requirement: Chat history retrieval
The system SHALL expose `GET /matches/{matchId}/messages` returning paginated chat history. Pagination SHALL use cursor-based strategy (`?before=<messageId>&limit=20`). Messages SHALL be returned in descending `createdAt` order (newest first).

#### Scenario: First page load
- **WHEN** a client calls `GET /matches/{matchId}/messages` without a cursor
- **THEN** the 20 most recent messages are returned with a `nextCursor` field

#### Scenario: Cursor pagination
- **WHEN** a client calls with `?before=<messageId>`
- **THEN** the system returns up to 20 messages older than the given message ID

---

### Requirement: Match room access control
A user SHALL only be able to join a Socket.IO match room for matches they are a participant in. The WebSocket gateway SHALL validate the JWT on connection and verify room membership before allowing `chat:send` events.

#### Scenario: Valid match room join
- **WHEN** user A connects and joins `room:match-{matchId}` where they are a participant
- **THEN** the server admits them to the room

#### Scenario: Invalid match room join
- **WHEN** a user attempts to join a room for a match they are not part of
- **THEN** the server emits `error` with `{ code: 'FORBIDDEN_ROOM' }` and does not add them to the room

---

### Requirement: Go! meeting initiation from chat
Within a chat room, the frontend SHALL display a "發起 Go! 約會" button that navigates to the meeting scheduling flow. The chat interface SHALL display a system message when a meeting is created, showing the scheduled time and escrow amount.

#### Scenario: System message on meeting creation
- **WHEN** a meeting is successfully created via `POST /meetings`
- **THEN** a system message is emitted to both users in the match room: `"已發起 Go! 約會 — {scheduledAt}，5 肉乾已托管。"`

---

### Requirement: Unread message count
The system SHALL track unread message counts per match per user. `GET /matches` SHALL return each match with an `unreadCount` field. The count SHALL be reset to 0 when the user opens the chat for that match.

#### Scenario: Unread count increments
- **WHEN** user B receives a new message in a match they have not opened
- **THEN** `GET /matches` for user B returns `unreadCount: 1` for that match

#### Scenario: Unread count resets on open
- **WHEN** user B opens the chat for that match
- **THEN** the frontend calls `POST /matches/{matchId}/read` and the unread count returns to 0
