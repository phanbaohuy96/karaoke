# Karaoke Remote

A local karaoke web app with a fullscreen host player and a mobile guest remote. The host creates a session, shows a QR code, and plays YouTube karaoke videos. Guests scan the QR code, search YouTube, add songs to the queue, and control playback in realtime.

## Features

- YouTube search through the backend using the official YouTube Data API.
- QR join flow for phones and tablets.
- Realtime session sync with WebSockets.
- Fullscreen-style host player with overlay controls.
- Mobile-first guest remote for search, queue, play/pause, next, select, and remove.
- Vietnamese UI by default.

## Requirements

- Node.js 20+
- npm
- A YouTube Data API key

## Setup

```sh
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
APP_PUBLIC_ORIGIN=http://localhost:5173
YOUTUBE_API_KEY=your_youtube_api_key
```

For phone access on the same Wi-Fi, `APP_PUBLIC_ORIGIN` must use the computer's LAN IP, not `localhost`:

```env
APP_PUBLIC_ORIGIN=http://192.168.x.x:5173
```

## Development

Run frontend and backend together:

```sh
make dev
```

Or run them separately:

```sh
make dev-fe
make dev-be
```

Stop local dev servers:

```sh
make down
```

Default ports:

- Frontend: `http://localhost:5173`
- Backend/API/WebSocket: `http://localhost:3001`

## Usage

1. Open `http://localhost:5173` on the host computer.
2. The host page creates a karaoke session and shows a QR button in the top-right overlay.
3. Open the QR panel or scan the QR code from a phone.
4. On the phone, search for a song or artist. The app automatically appends `karaoke` to the search query.
5. Add songs to the queue.
6. Use the host overlay or guest playlist drawer to start, pause, skip, select, or remove songs.

## Build and production

Create a production build:

```sh
make build
```

Start the built server:

```sh
make start
```

Production serves the Vite client from `dist/client` and the API/WebSocket server from the same Express app.

## Useful commands

```sh
make install   # npm install
make dev       # frontend + backend dev servers
make dev-fe    # Vite frontend only
make dev-be    # Express/WebSocket backend only
make down      # stop frontend + backend ports
make build     # typecheck and build client/server
make start     # run production server
make clean     # remove dist
```

## Project structure

```txt
client/src/
  api/             REST API clients
  components/      shared React UI
  hooks/           WebSocket session hook
  pages/           host and guest pages
  types/           client session/message types
  styles.css       app styling

server/src/
  config/          environment loading
  routes/          REST API routes
  services/        session store and YouTube API access
  types/           server session types
  ws/              WebSocket message handling
```

## Environment notes

- `.env` is local-only and ignored by git.
- `.env.example` documents required variables without secrets.
- Phones cannot use `localhost` to reach the host computer; use the host computer's LAN IP in `APP_PUBLIC_ORIGIN`.
- The Vite dev server binds to `0.0.0.0`, so LAN devices can reach it when the OS firewall allows inbound connections.

## Verification

Before committing changes, run:

```sh
npm run build
```

For UI changes, also run the app and verify with a browser:

- Host page creates a session and shows a connected status dot.
- QR panel opens and the join URL matches `APP_PUBLIC_ORIGIN`.
- Guest page works in a mobile viewport.
- Search returns results and appends `karaoke`.
- Adding songs updates both guest queue and host overlay.
- Play/pause/next/select/remove sync across host and guest.
