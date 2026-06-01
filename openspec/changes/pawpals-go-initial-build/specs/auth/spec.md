## ADDED Requirements

### Requirement: Email password registration
The system SHALL allow users to register with a unique email address and a plaintext password. The backend MUST hash the password using bcrypt (cost factor ≥ 10) before persisting to the database. Plaintext passwords SHALL never be stored.

#### Scenario: Successful registration
- **WHEN** a user submits a valid email, password (≥ 8 chars), and role (`OWNER` or `LOVER`)
- **THEN** the system creates a User record, stores the bcrypt hash, and returns HTTP 201 with an access token and sets a refresh token HttpOnly cookie

#### Scenario: Duplicate email
- **WHEN** a user attempts to register with an email that already exists
- **THEN** the system returns HTTP 409 Conflict with error code `EMAIL_TAKEN`

#### Scenario: Missing role selection
- **WHEN** a user submits registration without a `role` field
- **THEN** the system returns HTTP 400 Bad Request with error code `ROLE_REQUIRED`

---

### Requirement: Role selection is permanent
The system SHALL enforce that a user's `role` (`OWNER` or `LOVER`) is set exactly once at registration and cannot be changed thereafter.

#### Scenario: Attempt to change role via API
- **WHEN** an authenticated user sends a `PATCH /users/me` request containing a `role` field
- **THEN** the system ignores the `role` field and returns the unchanged user record

---

### Requirement: Email password login
The system SHALL authenticate users via email and password and issue a JWT access token and a refresh token.

#### Scenario: Successful login
- **WHEN** a user submits correct email and password to `POST /auth/login`
- **THEN** the system returns HTTP 200 with `{ accessToken }` and sets an HttpOnly `refreshToken` cookie (7-day expiry)

#### Scenario: Wrong password
- **WHEN** a user submits correct email but wrong password
- **THEN** the system returns HTTP 401 Unauthorized with error code `INVALID_CREDENTIALS`

---

### Requirement: JWT access token
The system SHALL use short-lived JWT access tokens (TTL 15 minutes) containing `sub` (userId) and `role` claims. All protected endpoints SHALL require a valid `Authorization: Bearer <token>` header.

#### Scenario: Expired access token
- **WHEN** a request arrives with an access token whose `exp` claim is in the past
- **THEN** the system returns HTTP 401 with error code `TOKEN_EXPIRED`

#### Scenario: Valid token grants access
- **WHEN** a request arrives with a valid, unexpired access token
- **THEN** the system processes the request and the handler receives `req.user = { userId, role }`

---

### Requirement: Refresh token rotation
The system SHALL issue a new access token when a valid refresh token cookie is presented to `POST /auth/refresh`. The old refresh token SHALL be invalidated in Redis upon use.

#### Scenario: Successful token refresh
- **WHEN** a client calls `POST /auth/refresh` with a valid `refreshToken` cookie
- **THEN** the system returns a new `{ accessToken }` and sets a new `refreshToken` cookie, invalidating the old one

#### Scenario: Reused refresh token
- **WHEN** a client presents a refresh token that has already been used
- **THEN** the system returns HTTP 401 with error code `TOKEN_REUSED` and invalidates the entire token family

---

### Requirement: Role-based access guard (RolesGuard)
The system SHALL enforce role-based access control using a `RolesGuard` that inspects the `role` claim in the JWT. Endpoints decorated with `@Roles('OWNER')` SHALL reject requests from `LOVER` users with HTTP 403.

#### Scenario: LOVER attempts to create a pet
- **WHEN** a user with `role: LOVER` sends `POST /pets`
- **THEN** the `RolesGuard` returns HTTP 403 Forbidden with error code `FORBIDDEN_ROLE`

#### Scenario: OWNER creates a pet
- **WHEN** a user with `role: OWNER` sends `POST /pets` with valid body
- **THEN** the request passes the guard and the pet is created
