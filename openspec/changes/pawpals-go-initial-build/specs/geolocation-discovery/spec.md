## ADDED Requirements

### Requirement: User location update
The system SHALL expose `PATCH /users/me/location` accepting `{ lat: number, lng: number }` to update the authenticated user's last known GPS coordinates. The backend SHALL store coordinates as a PostGIS `geography(Point, 4326)` column.

#### Scenario: Valid location update
- **WHEN** an authenticated user calls `PATCH /users/me/location` with `{ lat: 25.033, lng: 121.565 }`
- **THEN** the system updates the user's `location` geography column and returns HTTP 200

#### Scenario: Invalid coordinates
- **WHEN** a user submits `lat > 90` or `lng > 180`
- **THEN** the system returns HTTP 400 with error code `INVALID_COORDINATES`

---

### Requirement: Frontend GPS debounce (500 m threshold)
The React Native frontend SHALL request GPS permission on app launch and subscribe to position updates. It SHALL only call `PATCH /users/me/location` when the user has moved more than 500 metres from the last reported position, computed using the haversine formula.

#### Scenario: Movement below threshold
- **WHEN** the device reports a new GPS position that is 10 metres from the last reported position
- **THEN** the frontend does NOT call `PATCH /users/me/location`

#### Scenario: Movement above threshold
- **WHEN** the device reports a new GPS position that is 600 metres from the last reported position
- **THEN** the frontend calls `PATCH /users/me/location` with the new coordinates and stores them as the new baseline

---

### Requirement: Nearby discovery endpoint
The system SHALL expose `GET /discover` that returns a paginated list of pets (if caller is `LOVER`) or LOVER users (if caller is `OWNER`) within a configurable radius of the caller's current location using PostGIS `ST_DWithin`.

Query parameters:
- `radius` (km, default 5, max 50)
- `page` (default 1)
- `limit` (default 20, max 100)

Each result SHALL include a `distanceM` field (metres, integer).

#### Scenario: LOVER discovers nearby pets
- **WHEN** a LOVER calls `GET /discover?radius=3`
- **THEN** the system returns pets whose owner's location is within 3 km, sorted ascending by distance, with pagination metadata

#### Scenario: OWNER discovers nearby LOVERs
- **WHEN** an OWNER calls `GET /discover?radius=5`
- **THEN** the system returns LOVER users within 5 km, sorted ascending by distance

#### Scenario: No results within radius
- **WHEN** no pets/users exist within the specified radius
- **THEN** the system returns HTTP 200 with `{ data: [], total: 0, page: 1 }`

#### Scenario: Missing location data
- **WHEN** the caller has never updated their location (null geography column)
- **THEN** the system returns HTTP 422 with error code `LOCATION_NOT_SET`

---

### Requirement: PostGIS spatial query implementation
The backend DiscoverService SHALL use `prisma.$queryRaw` with `ST_DWithin` and `ST_Distance` to execute spatial queries. Raw query results SHALL be mapped to typed DTOs before returning to the controller.

#### Scenario: Query uses geography type
- **WHEN** the discover query is executed
- **THEN** the raw SQL casts coordinates to `::geography` and uses metre-based distances (no manual degree-to-metre conversion)
