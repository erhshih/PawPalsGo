## ADDED Requirements

### Requirement: Card stack display
The swipe deck SHALL display the top card in full view with the second card partially visible behind it (scaled 96%, offset -8px vertically). Up to 10 profiles SHALL be buffered locally from `GET /discover`.

#### Scenario: Stack rendering
- **WHEN** the discover screen is active and profiles are loaded
- **THEN** the top card is full size and the next card is visible at 96% scale behind it, creating a depth effect

#### Scenario: Empty stack
- **WHEN** all profiles are swiped and no more exist in the buffer or from the API
- **THEN** an "附近暫時沒有新朋友" empty state is shown

---

### Requirement: Photo album navigation within a card
Each card SHALL display up to 5 photos. Tapping the left half of the card SHALL navigate to the previous photo; tapping the right half SHALL navigate to the next photo. The current photo index SHALL be indicated by segmented progress bars at the top of the card.

#### Scenario: Right tap advances photo
- **WHEN** the user taps the right half of a card on photo index 0
- **THEN** photo index increments to 1 and the second photo is displayed with progress bar updated

#### Scenario: Left tap at first photo wraps to last
- **WHEN** the user taps the left half of a card on photo index 0
- **THEN** the display wraps to the last available photo (index n-1)

---

### Requirement: Swipe actions with animation
The deck SHALL support three actions triggered by on-screen buttons: Pass (❌, swipe-left animation), Like (❤️, swipe-right animation), Super Like (⭐, swipe-up animation). Each action SHALL trigger a CSS/Reanimated exit animation (translate + rotate + fade, 320 ms) before revealing the next card.

#### Scenario: Like button tapped
- **WHEN** the user taps the Like button
- **THEN** the top card animates off to the right (swipeRight animation, 320 ms), a "LIKE" toast appears briefly, and `POST /swipes` is called with `direction: LIKE`

#### Scenario: Pass button tapped
- **WHEN** the user taps the Pass button
- **THEN** the top card animates off to the left (swipeLeft animation, 320 ms) and `POST /swipes` is called with `direction: PASS`

#### Scenario: Super Like button tapped
- **WHEN** the user taps the Super Like button
- **THEN** the top card animates upward (swipeUp animation, 320 ms) and `POST /swipes` is called with `direction: SUPER_LIKE`

---

### Requirement: IAP treat modal (投餵肉乾)
Each card SHALL have a "投餵肉乾 🥩" button in the bottom-right corner. Tapping it SHALL open a bottom-sheet modal displaying the treat purchase option (1 肉乾) with a confirm/cancel action. On confirm, `POST /swipes/{targetUserId}/treat` SHALL be called.

#### Scenario: Treat modal opens
- **WHEN** the user taps the 投餵肉乾 button on a card
- **THEN** a bottom-sheet modal slides up with treat details and confirm/cancel buttons

#### Scenario: Treat confirmed
- **WHEN** the user taps confirm in the treat modal
- **THEN** `POST /swipes/{targetUserId}/treat` is called, the modal closes, and a "TREAT SENT" toast appears

#### Scenario: Treat with insufficient balance
- **WHEN** the user taps confirm but has 0 肉乾
- **THEN** the modal displays an error and suggests navigating to the wallet top-up screen

---

### Requirement: Photo kind label chip
Each photo SHALL display a label chip (毛孩特寫 / 主僕街拍合照 / 高冷黑白照) in the top-left corner of the card, sourced from the `Photo.kind` field.

#### Scenario: Label chip displayed
- **WHEN** a card is showing a photo with `kind: "bw"`
- **THEN** a chip reading "高冷黑白照" is visible in the top-left corner with a frosted dark background
