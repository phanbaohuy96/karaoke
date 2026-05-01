# AGENTS.md

Guidance for AI coding agents working in Karaoke Remote.

## Project Overview

Karaoke Remote is a standalone local karaoke web app. It includes a React + Vite frontend, Express backend, WebSocket realtime session sync, QR-based guest joining, and YouTube search/playback.

**Product identity**: Karaoke Remote  
**Primary UI language**: Vietnamese  
**Runtime style**: Local network app for a host computer and guest mobile devices

**Stack**: React, Vite, TypeScript, Express, `ws`, YouTube IFrame Player API, YouTube Data API, QR code generation.

## Architecture

The app is split into a browser client and a Node server:

- `client/` — React frontend for host and guest screens.
- `server/` — Express REST API and WebSocket server.
- `dist/client` — built frontend served by Express in production.

Core runtime flow:

```text
Host opens /
  |
  |-- POST /api/sessions ---------------------> Express
  |      |
  |      `-- create in-memory session + host token
  |
  |-- connect /ws as host --------------------> WebSocket server
  |
  `-- render fullscreen YouTube player + overlays

Guest scans QR /join/:sessionId
  |
  |-- GET /api/sessions/:id ------------------> Express
  |-- connect /ws as guest -------------------> WebSocket server
  |-- GET /api/youtube/search?q=...karaoke ---> YouTube Data API proxy
  |
  `-- add/control songs through WebSocket actions
```

Session state lives in memory in `server/src/services/sessionStore.ts`. Every session mutation should broadcast a fresh `session_snapshot`.

## Project Structure

```text
client/src/
  api/             REST API clients and response parsing
  components/      shared React UI components
  hooks/           WebSocket session hook
  pages/           host and guest page implementations
  types/           client session/socket types
  styles.css       app-wide styles

server/src/
  config/          environment loading
  routes/          REST routes for sessions and YouTube search
  services/        session store and YouTube API service
  types/           server session types
  ws/              WebSocket message types and server handling

.env.example       safe environment template
Makefile           common dev/build/stop commands
README.md          setup and usage docs
```

## Operating Principles

1. **Keep the host player primary**: the host screen should remain a fullscreen-style YouTube player with translucent overlays, not a dashboard layout.
2. **Keep guest mobile-first**: the guest page should focus on fast search, add, playlist count, and fullscreen playlist controls.
3. **Vietnamese first**: user-facing labels, empty states, alerts, and buttons should remain Vietnamese unless the user asks otherwise.
4. **Realtime state is authoritative**: host and guest should use WebSocket snapshots for shared playlist/playback state.
5. **Small targeted changes**: avoid broad refactors, speculative abstractions, or unrelated formatting.
6. **Protect secrets**: never commit `.env`, API keys, credentials, tokens, or generated secrets.

## Command Priority

Prefer project-standard commands over ad-hoc direct commands.

```bash
make install       # npm install
make dev           # frontend + backend dev servers
make dev-fe        # Vite frontend only
make dev-be        # Express/WebSocket backend only
make down          # stop frontend + backend ports
make down-fe       # stop frontend port
make down-be       # stop backend port
make build         # typecheck and build client/server
make start         # run production server
make clean         # remove dist
```

Use this validation command before reporting code changes complete:

```bash
npm run build
```

The build runs TypeScript checks, Vite production build, and server TypeScript emit.

## Environment

Required variables are documented in `.env.example`:

```env
PORT=3001
APP_PUBLIC_ORIGIN=http://localhost:5173
YOUTUBE_API_KEY=
```

Rules:

- `.env` is local-only and ignored by git.
- `YOUTUBE_API_KEY` is required for real search results.
- `APP_PUBLIC_ORIGIN` controls QR join URLs.
- For phone testing, use the host computer LAN IP, not `localhost`.
- Vite dev binds to `0.0.0.0`, but phone access still depends on the LAN IP and local firewall.

## Frontend Guidance

Important files:

- `client/src/pages/HostPage.tsx` — host player screen, QR overlay, playback controls.
- `client/src/pages/JoinPage.tsx` — guest mobile remote, search, playlist drawer.
- `client/src/components/YouTubePlayer.tsx` — YouTube IFrame API wrapper.
- `client/src/components/QRCodeCard.tsx` — QR rendering and compact/full variants.
- `client/src/components/Playlist.tsx` — playlist and now-playing rendering.
- `client/src/components/SearchBar.tsx` and `SearchResults.tsx` — guest search UI.
- `client/src/hooks/useSessionSocket.ts` — WebSocket lifecycle and client actions.
- `client/src/styles.css` — current UI styling.

Frontend rules:

- Keep YouTube native controls hidden unless explicitly requested.
- App-level click on the host player should toggle play/pause.
- Keep QR compact by default; expanded QR should stay near the top-right QR position.
- Clicking outside QR info or the join URL should dismiss QR info.
- Search should append `karaoke` when the query does not already contain it.
- Guest playlist controls should support play/pause, next, select, and remove.
- Added search results should show disabled `Đã thêm` status.
- Touch controls should remain comfortable on mobile.

## Backend Guidance

Important files:

- `server/src/services/sessionStore.ts` — session creation and playlist/playback state transitions.
- `server/src/ws/socketServer.ts` — WebSocket join and action handling.
- `server/src/ws/messageTypes.ts` — socket message contracts.
- `server/src/routes/sessions.ts` — create/read session REST endpoints.
- `server/src/routes/youtube.ts` and `server/src/services/youtubeService.ts` — YouTube search proxy.

Session state model:

- `playlist` contains queued songs.
- `nowPlaying` is the current song or `null`.
- `isPlaying` is shared between host and guest.
- `playNext` moves the first queued song to `nowPlaying`.
- `setNowPlaying` selects a queued song and removes it from the queue.
- `setPlaying(false)` pauses without clearing `nowPlaying`.

Behavior rules:

- Guests are allowed to control playlist and playback actions.
- Selecting or advancing a song should set `isPlaying` to `true`.
- Removing a queued song should not affect `nowPlaying` unless explicitly requested.
- Broadcast `session_snapshot` after every successful session mutation.
- Keep host token validation for host joins.
- This is an in-memory demo store; do not add persistence unless asked.

## Type and Contract Guidance

Client/server types are separate but intentionally similar:

- `client/src/types/session.ts`
- `server/src/types/session.ts`

When changing session DTOs or socket messages:

- Update both client and server type files.
- Update WebSocket send/receive handling in `useSessionSocket.ts` and `socketServer.ts`.
- Avoid duplicate fields for the same data, such as adding another video id when `videoId` exists.
- Keep `requestedBy` as a role-like value (`host` / `guest`) unless product requirements change.

## YouTube Guidance

- Search goes through the backend, not directly from the browser.
- `YOUTUBE_API_KEY` must stay server-side.
- Keep the search query validation and Vietnamese error messages.
- The YouTube IFrame API runs on the host player screen.
- Browser autoplay policies may require a user gesture before sound playback.
- If changing player state handling, test selecting a new song while another song is playing.

## Testing Checklist

For code changes, verify the narrowest relevant checks plus build:

```bash
npm run build
```

For UI or realtime changes, run the app and smoke-test with Playwright/browser:

1. Host page loads at `/` and creates a session.
2. Host status dot reaches connected.
3. QR panel opens and join URL uses `APP_PUBLIC_ORIGIN`.
4. Guest page loads at `/join/:sessionId` in a mobile viewport.
5. Search returns YouTube results and appends `karaoke` if missing.
6. Adding a song updates guest count and `Đã thêm` status.
7. Host receives the queued song and shows it as next.
8. Host starts playback and guest sees now-playing.
9. Guest play/pause syncs back to host.
10. Guest next/select/remove actions sync back to host.
11. Browser console has no new errors or warnings.

## Git and Commit Guidance

- Do not commit unless the user explicitly asks.
- Prefer specific staged paths over `git add .`.
- Do not commit `.env`, credentials, API keys, or local build artifacts unless explicitly requested and safe.
- Run `npm run build` before committing code changes when possible.

## Final Reminders

1. Read existing code before changing behavior.
2. Keep host/player and guest/remote responsibilities clear.
3. Preserve Vietnamese UI text.
4. Keep REST, WebSocket, client types, and server types aligned.
5. Use Playwright/browser for UI changes before reporting completion.
6. Avoid comments unless they explain a non-obvious constraint.
7. Do not add persistence, auth, multi-room storage, deployment config, or test frameworks unless asked.
