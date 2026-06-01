## ADDED Requirements

### Requirement: Wallet balance
Every user SHALL have exactly one `Wallet` record with a `balance` field (integer, unit: 肉乾). The balance SHALL default to 0 on account creation. The balance SHALL never go below 0; any operation that would result in a negative balance SHALL be rejected.

#### Scenario: New user wallet
- **WHEN** a user completes registration
- **THEN** a `Wallet` record is created with `balance: 0`

#### Scenario: Balance floor enforcement
- **WHEN** a debit operation would reduce the balance below 0
- **THEN** the system rejects the operation with error code `INSUFFICIENT_BALANCE` and leaves the wallet unchanged

---

### Requirement: Get wallet balance
The system SHALL expose `GET /wallet` returning the authenticated user's current balance.

#### Scenario: Balance retrieval
- **WHEN** an authenticated user calls `GET /wallet`
- **THEN** the system returns `{ balance: <integer>, currency: "肉乾" }`

---

### Requirement: Top-up (mock IAP)
The system SHALL expose `POST /wallet/topup` accepting `{ packageId: string }`. Supported packages SHALL be defined server-side. For MVP, all top-up requests are unconditionally approved (simulated IAP). The balance SHALL be credited immediately.

Packages:
| packageId | 肉乾 | Display price |
|-----------|------|---------------|
| `pack_30` | 30   | NT$ 90        |
| `pack_100`| 100  | NT$ 270       |
| `pack_300`| 300  | NT$ 690       |

#### Scenario: Successful top-up
- **WHEN** a user calls `POST /wallet/topup` with `{ packageId: "pack_30" }`
- **THEN** the wallet balance increases by 30 and the response returns `{ added: 30, newBalance: <n> }`

#### Scenario: Unknown package
- **WHEN** a user submits an unknown `packageId`
- **THEN** the system returns HTTP 400 with error code `INVALID_PACKAGE`

---

### Requirement: Treat (投餵肉乾) purchase
The system SHALL expose `POST /swipes/{targetUserId}/treat` allowing a user to send a treat to another user they have swiped on. Sending a treat SHALL deduct 1 肉乾 from the sender and credit 1 肉乾 to the recipient. This transaction SHALL be atomic.

#### Scenario: Successful treat
- **WHEN** a user with balance ≥ 1 sends a treat to another user
- **THEN** sender balance decreases by 1, recipient balance increases by 1, and HTTP 200 is returned

#### Scenario: Treat with zero balance
- **WHEN** a user with balance = 0 attempts to send a treat
- **THEN** HTTP 422 is returned with error code `INSUFFICIENT_BALANCE`

---

### Requirement: Wallet transaction log
All wallet mutations (top-up, debit, credit, escrow, release) SHALL be recorded in a `WalletTransaction` table with: `userId`, `type` (TOPUP | DEBIT | CREDIT | ESCROW | ESCROW_RELEASE), `amount`, `relatedEntityId` (meetingId or null), `createdAt`. This log is append-only; records SHALL never be deleted or modified.

#### Scenario: Escrow transaction logged
- **WHEN** a meeting is created and 5 肉乾 are held in escrow
- **THEN** a `WalletTransaction` row is inserted with `type: ESCROW, amount: 5, relatedEntityId: <meetingId>`

#### Scenario: Release transaction logged
- **WHEN** escrow is released upon successful check-in
- **THEN** a `WalletTransaction` row is inserted with `type: ESCROW_RELEASE, amount: 5`
