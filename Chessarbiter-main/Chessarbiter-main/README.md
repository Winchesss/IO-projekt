# ChessArbiter Polska

Production-oriented simplified ChessArbiter-like platform for Polish chess tournaments. The app supports public tournament browsing and registration, player profiles, arbiter tournament management, administrator user management, round-robin and MVP Swiss tournament running, result entry, standings, and CSV exports.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Prisma ORM
- PostgreSQL
- Email/password authentication
- bcrypt password hashing
- Zod validation
- Server-side authorization
- Railway-ready deployment

## Features

- Polish user-facing UI
- Registration, login, logout
- HTTP-only signed session cookie
- Roles: `ADMIN`, `ARBITER`, `PLAYER`
- Seeded single administrator
- Player profile and tournament registrations
- Guest tournament registration
- Duplicate registration protection
- Public tournament list, filters, details, pairings, results, and standings
- Arbiter tournament creation, editing, registration management, CSV exports
- Round-robin engine with full schedule generation
- Swiss MVP engine with deterministic score-group pairings
- Result entry and round completion workflow
- Advanced standings: Buchholz, Median Buchholz, Sonneborn-Berger, progressive score
- Admin dashboard, user search/filtering, arbiter role assignment

## Local Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` before running the app.

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chessarbiter?schema=public"
SESSION_SECRET="replace-with-at-least-32-random-characters"
AUTH_SECRET="replace-with-at-least-32-random-characters"
NEXTAUTH_SECRET="replace-with-at-least-32-random-characters"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-admin-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`AUTH_SECRET`, `NEXTAUTH_SECRET`, or `SESSION_SECRET` may be used for session signing. At least one must be set and contain at least 32 characters.

## Database Setup

Create a PostgreSQL database, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

For production deployments:

```bash
npm run prisma:deploy
```

## Admin Creation

The app must have exactly one administrator. New registrations always become `PLAYER`.

Set these in `.env`:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="strong-password"
```

Then run:

```bash
npm run prisma:seed
```

If an administrator already exists, the seed script does not create another one. The database migration also protects the admin from accidental demotion or deletion.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run test
npm run lint
npm run build
```

## Railway Deployment

1. Create a Railway project.
2. Add a PostgreSQL database.
3. Set environment variables from `.env.example`.
4. Ensure `DATABASE_URL` points to the Railway PostgreSQL database.
5. Deploy the repository.
6. Run migrations:

```bash
npm run prisma:deploy
```

7. Seed the administrator:

```bash
npm run prisma:seed
```

The included `railway.json` uses:

```bash
npm run prisma:deploy && npm run start
```

## Vercel Notes

Vercel can host the Next.js app, but PostgreSQL must be provided separately. Set the same environment variables in Vercel and run Prisma migrations from a trusted environment or CI job before serving production traffic.

## Security Notes

- Password hashes are selected only for login verification and are never exposed to UI data queries.
- All protected pages and server actions perform server-side authorization.
- Guests cannot access dashboards.
- Players cannot access arbiter/admin pages.
- Arbiters can manage only their own tournaments.
- Admins can manage all tournaments and users.
- Only admins can assign or remove the arbiter role.
- Admin role cannot be created from the frontend.
- Admin demotion/deletion is blocked by application logic and database triggers.
- Forms use Zod validation.
- Duplicate registrations are blocked by server logic and database uniqueness constraints.

## Swiss-System MVP Limitations

The Swiss engine is deterministic and usable for simple club tournaments. It pairs by score group, avoids repeat pairings where possible, assigns BYEs to low-scoring eligible players, and uses basic color balancing.

It is not a full FIDE Dutch Swiss implementation. It does not guarantee compliance with every official pairing rule, float rule, color preference rule, or transposition requirement. The module is isolated in `lib/tournament-engine/swiss.ts` so it can be replaced later with a stronger pairing engine.

## Future Improvements

- Full FIDE-compliant Swiss pairings
- Advanced configurable tiebreaks
- Importing players from CSV
- Email notifications
- Payments
- Federation and rating integrations
- Rating report generation
- PGN upload
- Live result boards
- More detailed audit logging
- Tournament templates and organizer profiles
