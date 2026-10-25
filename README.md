# The Secret Santa Club

A Nuxt 4 app for an eight-person Secret Santa draw. Enter eight names, share personal invitations, and let each participant reveal their recipient.

## Run locally

Use Node.js 22.14 or newer (includes `node:sqlite`), then:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal, normally `http://localhost:3000`.

1. Enter a draw title and exactly eight unique names.
2. Create the draw and save the private organiser URL. It is the only way to return to the invitations.
3. Send each participant their own invitation link.
4. Each person opens their link and presses **Reveal my Secret Santa name**. They can revisit it for a reminder; a reveal never generates a new assignment.

## Personal links

An invitation looks like:

```text
/pick?name=Alicia&token=<private-random-token>
```

The name parameter is for readability. The server identifies the participant using the cryptographically random token, so editing `name` does not let someone view a different recipient. The page displays the name verified by the server. Anyone holding an invitation can reveal that person's recipient, so share each link privately. The organiser URL can retrieve all invitation links and must also remain private.

The organiser screen shows reveal status, without displaying pairings. Links do not expire. There is no email delivery, login, draw reset, or name editing after creation; create another draw if the group changes.

## Draw rules and persistence

All eight assignments are generated and saved in one SQLite transaction before any participant picks. A cryptographically random Fisher–Yates shuffle is repeated until no one is assigned themselves. Every valid permutation has the same probability. Every name appears exactly once as a recipient, and the draw cannot get stuck on the last participant. Database constraints also reject self-assignments and duplicate recipients. Mutual pairs are allowed.

The database defaults to `.data/secret-santa.sqlite`, which is ignored by Git. This file contains names, private invitation tokens, and pairings; keep it private and back it up. To change its location, set `SECRET_SANTA_DB_PATH` (see `.env.example`).

## Verify and build

```sh
npm test
npm run typecheck
npm run build
npm run test:production
node .output/server/index.mjs
```

Production needs a Node server and a persistent writable disk for SQLite. Set `SECRET_SANTA_DB_PATH` to a durable absolute path and keep the same database across restarts and redeployments. Production environment variables must be supplied to the process; the built server does not automatically read `.env`. Serve over HTTPS and avoid logging full invitation URLs. Use one host with a local disk; for multiple hosts or ephemeral/serverless deployments, replace SQLite with a shared transactional database. A static export cannot enforce a shared draw.

The UI uses Google Fonts with local serif/sans-serif fallbacks and contains no analytics or third-party JavaScript. Private page and API responses use `no-store` and `no-referrer` headers.

Tests cover the eight-person rules across 1,000 draws, input normalisation and duplicates, invalid credentials, separate draws, repeat reveals, and persistence across database reopen. The production test starts the built server on a temporary port with a temporary database and checks pages, API validation, credentials, privacy headers, name tampering, and concurrent reveals.
