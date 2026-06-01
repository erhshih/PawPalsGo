## ADDED Requirements

### Requirement: Identity selection screen (Welcome)
The app SHALL display a Welcome screen on first launch (pre-authentication) featuring the PawPals Go wordmark and two tappable identity cards: "OWNER（飼主）" (white card) and "LOVER（貓狗奴）" (zinc-900 card). Selecting an identity SHALL initiate the registration flow.

#### Scenario: OWNER card tapped
- **WHEN** the user taps the OWNER card
- **THEN** the app navigates to the registration form pre-filled with `role: OWNER`

#### Scenario: LOVER card tapped
- **WHEN** the user taps the LOVER card
- **THEN** the app navigates to the registration form pre-filled with `role: LOVER`

#### Scenario: Arrow icon rotation on hover/press
- **WHEN** the user presses an identity card
- **THEN** the arrow icon in the card rotates -45 degrees as a visual feedback affordance

---

### Requirement: Registration form
After identity selection, the app SHALL display a registration form with fields: Email, Password (min 8 chars, hidden), Confirm Password. Submitting SHALL call `POST /auth/register`. Validation errors SHALL be shown inline beneath each field.

#### Scenario: Successful registration
- **WHEN** valid email, password, and matching confirm password are submitted
- **THEN** `POST /auth/register` is called, on success the JWT is stored in secure storage, and the user proceeds to photo onboarding

#### Scenario: Password mismatch
- **WHEN** Password and Confirm Password fields do not match
- **THEN** an inline error "密碼不一致" appears below Confirm Password and the form is not submitted

#### Scenario: Email already taken
- **WHEN** the API returns `EMAIL_TAKEN`
- **THEN** an inline error "此 Email 已被使用" appears below the Email field

---

### Requirement: Photo upload onboarding
After registration, the app SHALL require users to upload at least 1 photo before accessing the main app. OWNER users SHALL upload at minimum 1 self-portrait. LOVER users SHALL upload at minimum 1 self-portrait AND 1 photo with a pet. Each category supports up to 5 photos.

#### Scenario: OWNER completes with 1 photo
- **WHEN** an OWNER uploads 1 self-portrait and taps "進入毛孩世界"
- **THEN** the photos are uploaded via `POST /pets/{id}/photos` and the user enters the main tab navigation

#### Scenario: LOVER blocked without pet photo
- **WHEN** a LOVER has uploaded a self-portrait but no pet photo and taps the CTA
- **THEN** the button remains disabled and shows "還差 1 張必填照片"

#### Scenario: Photo tile interactions
- **WHEN** the user taps an empty photo slot
- **THEN** the device's image picker opens (camera or library); on selection the photo is previewed in the tile with a primary badge if it is the first photo

#### Scenario: Photo removal
- **WHEN** the user taps the ✕ button on a photo tile
- **THEN** the photo is removed from the tile and the slot becomes available

---

### Requirement: Login screen
The app SHALL provide a Login screen accessible from the Welcome screen for returning users. Fields: Email, Password. On successful login, the JWT is stored in secure storage and the user enters the main tab navigation at the 探索 tab.

#### Scenario: Successful login
- **WHEN** valid credentials are submitted
- **THEN** `POST /auth/login` returns tokens, they are stored securely, and the main navigation is shown

#### Scenario: Invalid credentials
- **WHEN** wrong password is submitted
- **THEN** an error banner displays "Email 或密碼錯誤" without clearing the Email field
