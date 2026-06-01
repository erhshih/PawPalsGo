## ADDED Requirements

### Requirement: Create meeting (initiator pays)
The system SHALL expose `POST /meetings` allowing an authenticated user to schedule a meeting with a matched partner. Creating a meeting SHALL deduct exactly 5 肉乾 (jerky) from the initiator's wallet and hold them in escrow. If the initiator has fewer than 5 肉乾, the request SHALL be rejected.

Request body: `{ matchId, scheduledAt: ISO8601 datetime }`. `scheduledAt` MUST be at least 30 minutes in the future.

#### Scenario: Successful meeting creation
- **WHEN** an initiator with ≥ 5 肉乾 submits `POST /meetings` with a valid `scheduledAt`
- **THEN** a `Meeting` record is created with `status: SCHEDULED`, the initiator's wallet is debited 5 肉乾, the `escrow` field is set to 5, and HTTP 201 is returned

#### Scenario: Insufficient balance
- **WHEN** the initiator has fewer than 5 肉乾
- **THEN** the system returns HTTP 422 with error code `INSUFFICIENT_BALANCE`

#### Scenario: Scheduled too soon
- **WHEN** `scheduledAt` is less than 30 minutes from now
- **THEN** the system returns HTTP 400 with error code `SCHEDULED_TOO_SOON`

---

### Requirement: Cancel meeting — benign (> 2 hours before)
When a meeting is cancelled more than 2 hours before `scheduledAt`, the system SHALL return the full 5 肉乾 escrow to the initiator's wallet and transition the meeting to `status: CANCELLED_BENIGN`.

#### Scenario: Benign cancellation
- **WHEN** either party calls `DELETE /meetings/{id}` and `now < scheduledAt - 2h`
- **THEN** the 5 escrowed 肉乾 are credited back to the initiator, `status` becomes `CANCELLED_BENIGN`, and HTTP 200 is returned with `{ refunded: 5 }`

---

### Requirement: Cancel meeting — penalty (≤ 2 hours before)
When a meeting is cancelled within 2 hours of `scheduledAt`, the system SHALL transfer the escrowed 5 肉乾 to the non-cancelling party's wallet and transition the meeting to `status: CANCELLED_PENALTY`.

#### Scenario: Penalty cancellation by initiator
- **WHEN** the initiator calls `DELETE /meetings/{id}` and `now ≥ scheduledAt - 2h`
- **THEN** the 5 escrowed 肉乾 are credited to the non-initiator's wallet, `status` becomes `CANCELLED_PENALTY`, and the response includes `{ penalised: true, compensatedUserId: "<id>" }`

#### Scenario: Penalty cancellation by non-initiator
- **WHEN** the non-initiator cancels within 2 hours
- **THEN** the 5 escrowed 肉乾 are credited to the initiator's wallet, `status` becomes `CANCELLED_PENALTY`

---

### Requirement: QR code generation for non-initiator
When a meeting reaches `scheduledAt`, the non-initiator SHALL be able to call `GET /meetings/{id}/qr` to receive a time-limited token (30-second TTL stored in Redis). The frontend SHALL render this token as a QR code with a visible countdown progress bar.

#### Scenario: QR token issued
- **WHEN** the non-initiator calls `GET /meetings/{id}/qr` and `now ≥ scheduledAt`
- **THEN** the system generates a UUID token, stores it in Redis with `SETEX meeting:{id}:totp {token} 30`, and returns `{ token, expiresIn: 30 }`

#### Scenario: QR token requested before scheduled time
- **WHEN** `GET /meetings/{id}/qr` is called before `scheduledAt`
- **THEN** the system returns HTTP 422 with error code `MEETING_NOT_STARTED`

#### Scenario: QR token refresh
- **WHEN** the client calls `GET /meetings/{id}/qr` again after the previous token expired
- **THEN** a new token is issued and the old one is overwritten in Redis

---

### Requirement: QR code verification by initiator (check-in)
The initiator SHALL call `POST /meetings/{id}/verify` with `{ token }` after scanning the non-initiator's QR code. The backend SHALL validate the token against Redis. On success, the 5 escrowed 肉乾 SHALL be transferred to the non-initiator's wallet and the meeting status set to `COMPLETED`.

#### Scenario: Successful check-in
- **WHEN** the initiator submits the correct, unexpired token to `POST /meetings/{id}/verify`
- **THEN** Redis `GET meeting:{id}:totp` matches the submitted token, the escrow is released to the non-initiator, `status` becomes `COMPLETED`, and HTTP 200 is returned with `{ success: true, released: 5 }`

#### Scenario: Expired token
- **WHEN** the submitted token no longer exists in Redis (TTL elapsed)
- **THEN** the system returns HTTP 422 with error code `QR_EXPIRED`

#### Scenario: Wrong token
- **WHEN** the submitted token does not match the Redis value
- **THEN** the system returns HTTP 422 with error code `QR_INVALID`

---

### Requirement: Meeting status transitions are atomic
All wallet debit, credit, and escrow operations within a single meeting state transition SHALL be executed in a single PostgreSQL transaction to prevent partial updates.

#### Scenario: Database failure during check-in
- **WHEN** the PostgreSQL transaction fails during `COMPLETED` transition
- **THEN** neither the wallet credit nor the status update is committed, and the escrow remains intact
