## ADDED Requirements

### Requirement: Bottom tab navigation
The app SHALL render a persistent bottom tab bar with three tabs: 探索 (Swipe/Discover), 訊息 (Chat), 身份 (Profile/Me). The active tab SHALL be visually distinguished (white icon, white label). Tab switching SHALL be instant with no loading state between tabs.

#### Scenario: Tab switching
- **WHEN** a user taps the 訊息 tab
- **THEN** the 訊息 screen is displayed, the 訊息 icon becomes white, and the previously active tab icon becomes zinc-600

#### Scenario: Deep link to chat tab
- **WHEN** the app receives a match notification and the user taps it
- **THEN** the app navigates to the 訊息 tab and opens the relevant match conversation

---

### Requirement: Authentication gate
All tabs and their child screens SHALL be inaccessible until the user is authenticated. Unauthenticated users SHALL be redirected to the Welcome screen. The JWT access token SHALL be stored in secure storage (`expo-secure-store`).

#### Scenario: Unauthenticated access attempt
- **WHEN** the app launches and no valid token exists in secure storage
- **THEN** the Welcome/Login screen is displayed and tab navigation is hidden

#### Scenario: Expired token on launch
- **WHEN** the app launches with an expired access token
- **THEN** the app attempts a silent refresh via the refresh token cookie; if refresh fails, the user is redirected to the login screen

---

### Requirement: Threads-aesthetic visual system
The app SHALL implement a Dark Mode-only visual system derived from the Threads design language:
- Background: `bg-zinc-950` (main), `bg-zinc-900` (cards/modals)
- Text: `text-white` (primary), `text-zinc-500` (secondary)
- Borders: `border-zinc-800`, 0.5px hairline
- No cartoon or decorative elements; refined thin-line icons (Lucide)
- Typography: system sans-serif, semibold headings, monospace labels

#### Scenario: Card component appearance
- **WHEN** any card or modal is rendered
- **THEN** it uses `bg-zinc-900` background, `border-zinc-800` 0.5px border, and no drop shadows except white glow on primary CTAs

---

### Requirement: Lucide icon library
The app SHALL use `lucide-react-native` for all icons. Icon weight SHALL be `strokeWidth={1.5}` for inactive states and `strokeWidth={2}` for active/primary states.

#### Scenario: Icon rendering
- **WHEN** the tab bar renders
- **THEN** active tab icon has `strokeWidth={2}` and inactive icons have `strokeWidth={1.5}`

---

### Requirement: Global loading and error states
The app SHALL display a full-screen loading indicator (zinc-950 background, white spinner) while the initial auth check and data fetch are in progress. Network errors SHALL display a toast notification at the bottom of the screen with an automatic 3-second dismiss.

#### Scenario: API error toast
- **WHEN** any API call returns a 5xx error
- **THEN** a toast appears at the bottom of the screen with the error message and disappears after 3 seconds
