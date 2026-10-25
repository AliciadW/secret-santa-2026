# The Secret Santa Club

A Nuxt 4 app for an eight-person Secret Santa draw. Enter eight names, share personal invitations, and let each participant reveal their recipient.

## Run locally

Use Node.js 22.14 or newer. Install dependencies, link this folder to the existing Netlify site, and start Netlify's local development environment:

```sh
npm install
npx netlify link
npx netlify dev
```

Netlify Dev starts the Nuxt dev server and provides a local Postgres database. In a second terminal, apply the migrations to that local database:

```sh
npx netlify database migrations apply
```

Open the local address printed by Netlify Dev. The local database is separate from production. No external database account or manually copied production credentials are needed.

If you already run your own local Postgres database, set `NETLIFY_DB_URL` and `NETLIFY_DB_DRIVER=server` in an ignored `.env` file (see `.env.example`), apply the SQL migrations to that local database, and use `npm run dev` directly.

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

All eight assignments are generated and saved in one Postgres transaction before any participant picks. A cryptographically random Fisher–Yates shuffle is repeated until no one is assigned themselves. Every valid permutation has the same probability. Every name appears exactly once as a recipient, and the draw cannot get stuck on the last participant. Database constraints reject self-assignments, duplicate names, tokens and recipients, and recipients from another draw. Mutual pairs are allowed. Repeated or concurrent reveals preserve both the pairing and the first reveal timestamp.

Storage uses [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/) (managed Postgres) through `@netlify/database` and Drizzle ORM. The connection is resolved at runtime, and importing the app or building it does not connect to the database. Names, private invitation tokens, and pairings remain server-side. The organiser's original name order is preserved with an explicit position column.

## Deploy to Netlify

Connect the GitHub repository to the existing Netlify site. Use `npm run build`, the detected Nuxt publish directory (`dist`), and Node.js 22.14 or newer. Keep Nitro's Netlify server deployment enabled; a static export cannot enforce a shared draw.

Installing `@netlify/database` lets Netlify provision and configure the site's Postgres database. Netlify automatically applies the committed migrations in `netlify/database/migrations/` immediately before publishing a deployment. Do not run migrations against the live database from a build command or application request. See [Netlify's migration lifecycle](https://docs.netlify.com/build/data-and-storage/netlify-database/migrations/).

The schema is defined in `db/schema.ts`. After a future schema change, run `npm run db:generate` and commit the newly generated migration and snapshot. Keep deployed migration files unchanged; create a new migration for subsequent changes. Drizzle ORM and Kit use matching release-candidate versions because the native Netlify Database adapter is not available in Drizzle's current stable release.

There is no existing application data to migrate for this change. New draws persist in Netlify Database across function instances and redeployments. Production connection details are supplied by Netlify; never commit them to Git. Serve over HTTPS and avoid logging full invitation URLs.

## Verify and build

```sh
npm test
npm run typecheck
npm run build
npm run test:production
node .output/server/index.mjs
```

The standalone built server requires a configured Postgres connection (`NETLIFY_DB_URL` and, for a normal Postgres server, `NETLIFY_DB_DRIVER=server`). Supply these environment variables to the process; the standalone server does not automatically read `.env`.

To verify the Netlify adapter itself, build for that target and run its regression test:

```sh
npm run build -- --preset=netlify
npm run test:netlify
```

This test invokes the generated Netlify function with Web `Request` objects and an isolated Postgres engine. It covers draw creation, request validation, the byte limit, private links, and stable reveals. Node server tests alone do not exercise Netlify's request adapter.

The UI uses Google Fonts with local serif/sans-serif fallbacks and contains no analytics or third-party JavaScript. Private page and API responses use `no-store` and `no-referrer` headers.

Tests apply the exact committed SQL migration to isolated PGlite Postgres engines. They cover the eight-person rules across 1,000 draws, input normalisation and duplicates, invalid credentials, separate draws, repeat and concurrent reveals, SQL constraints, transaction rollback, asynchronous API errors, and persistence across database restart. No live database or Netlify credentials are used. The production test starts the built Node server and a temporary Postgres protocol server, then checks pages, API validation, credentials, privacy headers, name tampering, and concurrent reveals through the real Netlify Database/Drizzle connection path.
