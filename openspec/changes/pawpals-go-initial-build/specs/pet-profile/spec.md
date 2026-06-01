## ADDED Requirements

### Requirement: Create pet profile (OWNER only)
The system SHALL allow authenticated users with `role: OWNER` to create a pet profile via `POST /pets`. The request SHALL be rejected with HTTP 403 for `LOVER` users. A pet profile SHALL contain: `name` (string), `breed` (string), `bio` (string, max 140 chars), `tags` (string[], max 5), `birthDate` (ISO date, optional).

#### Scenario: OWNER creates pet
- **WHEN** an OWNER submits `POST /pets` with valid fields
- **THEN** the system creates a `Pet` record linked to the owner's user ID and returns HTTP 201 with the pet object

#### Scenario: LOVER blocked by guard
- **WHEN** a LOVER submits `POST /pets`
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Bio exceeds character limit
- **WHEN** an OWNER submits a `bio` longer than 140 characters
- **THEN** the system returns HTTP 400 with error code `BIO_TOO_LONG`

---

### Requirement: Upload pet photos
The system SHALL expose `POST /pets/{petId}/photos` accepting `multipart/form-data` with one image file per request (JPEG or PNG, max 10 MB). Each pet SHALL support up to 5 photos. Photos SHALL be stored on the server filesystem under `uploads/` and the URL stored in the `Photo` table.

#### Scenario: Successful photo upload
- **WHEN** an OWNER uploads a valid JPEG to `POST /pets/{petId}/photos`
- **THEN** the file is saved to `uploads/pets/{petId}/{uuid}.jpg` and a `Photo` record is created with the URL

#### Scenario: Exceeds photo limit
- **WHEN** an OWNER attempts to upload a 6th photo for a pet that already has 5
- **THEN** the system returns HTTP 422 with error code `PHOTO_LIMIT_EXCEEDED`

#### Scenario: Invalid file type
- **WHEN** an OWNER uploads a file that is not JPEG or PNG
- **THEN** the system returns HTTP 400 with error code `INVALID_FILE_TYPE`

---

### Requirement: Photo ordering
The system SHALL allow OWNER to set a `sortOrder` on each photo. The first photo (`sortOrder: 0`) is the primary display photo. Photos SHALL be returned sorted ascending by `sortOrder` in all API responses.

#### Scenario: Photos returned in order
- **WHEN** `GET /pets/{petId}` is called
- **THEN** the `photos` array is sorted by `sortOrder` ascending

---

### Requirement: Edit pet profile
The system SHALL expose `PATCH /pets/{petId}` allowing the owning OWNER to update `name`, `breed`, `bio`, `tags`, and `birthDate`. Other users SHALL receive HTTP 403.

#### Scenario: OWNER updates own pet
- **WHEN** the owning OWNER sends `PATCH /pets/{petId}` with `{ bio: "new bio" }`
- **THEN** only the `bio` field is updated and the full updated pet is returned

#### Scenario: Non-owner attempt
- **WHEN** a different authenticated user sends `PATCH /pets/{petId}`
- **THEN** the system returns HTTP 403

---

### Requirement: Delete pet photo
The system SHALL expose `DELETE /pets/{petId}/photos/{photoId}` allowing the owning OWNER to remove a specific photo. The corresponding file SHALL be deleted from the filesystem.

#### Scenario: Successful photo deletion
- **WHEN** the owning OWNER calls `DELETE /pets/{petId}/photos/{photoId}`
- **THEN** the `Photo` record is deleted, the file removed from disk, and HTTP 200 returned
