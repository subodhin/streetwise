# Streetwise — City Issue Reporting and Triage

Streetwise is a web application for reporting and tracking city issues in Colombo. It provides a public map, automated report triage, a staff review queue, and an admin dashboard for managing zones and settings.

## Live Application

- **Public dashboard:** https://streetwise-frontend.pages.dev
- **Staff login:** https://streetwise-frontend.pages.dev/staff/login
- **Admin dashboard:** https://streetwise-frontend.pages.dev/admin
- **Backend API:** https://streetwise.streetwise-city.workers.dev
- **Health check:** https://streetwise.streetwise-city.workers.dev/api/health

## Tech Stack

- **Frontend:** React, TypeScript, Vite, MapLibre GL
- **Backend:** Hono, Cloudflare Workers
- **Database:** Cloudflare D1
- **AI:** Cloudflare Workers AI with a rules-based fallback
- **Testing:** Vitest

## Features

- Public city map with report details and live report totals.
- Citizen report submission with automated triage.
- Report classification by type, size, priority, and zone.
- Routing rules for reports requiring human review.
- Staff authentication, report queue, and review actions.
- Admin dashboard for zone management, settings, and audit logs.
- Server-side role-based access control.
- Rules-based fallback when AI triage cannot be used.

## Local Setup

### Requirements

- Node.js and npm
- A Cloudflare account for running the backend and database

### Install

```bash
git clone https://github.com/subodhin/streetwise.git
cd streetwise
npm install
npm install --prefix frontend
```

Authenticate with Cloudflare:

```bash
npx wrangler login
```

Configure the required environment variables and secrets. `AUTH_SECRET` must be a strong secret of at least 32 characters. Never commit secrets or local environment files.

### Run the Backend

```bash
npm run dev
```

### Run the Frontend

In a second terminal:

```bash
npm run dev --prefix frontend
```

Set `VITE_API_URL` to the backend URL when using a different API endpoint. Variables prefixed with `VITE_` are exposed to frontend code, so do not store secrets in them.

**Local environment limitation:** Local Wrangler execution encountered a GLIBC compatibility issue with `workerd` on the development machine. The deployed application was tested separately.

## Database Migrations

List remote migrations:

```bash
npx wrangler d1 migrations list streetwise-db --remote
```

Apply remote migrations:

```bash
npx wrangler d1 migrations apply streetwise-db --remote
```

Use `--local` only in a compatible local environment.

## Deployment

### Backend

Configure the authentication secret interactively:

```bash
npx wrangler secret put AUTH_SECRET
```

Enter a strong random secret of at least 32 characters when prompted.

Deploy the backend:

```bash
npm run deploy
```

### Frontend

Build the frontend:

```bash
npm run build --prefix frontend
```

Deploy `frontend/dist` to Cloudflare Pages.

Configure the Pages project with:

- **Build directory:** `frontend`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_API_URL`, set to the deployed backend URL

Rebuild and redeploy the frontend after changing the build-time API URL.

## Tests

Run the test suite:

```bash
npm test
```

**Latest verified result:** 25 tests passed across 5 test files.

## Measured Classification Accuracy

Run the evaluator:

```bash
npx tsx scripts/evaluate-accuracy.ts
```

The evaluator compares `classifyWithRules()` against `data/labelled-reports.json`.

| Metric | Correct | Total | Accuracy |
|---|---:|---:|---:|
| Type classification | 40 | 40 | 100.0% |
| Priority classification | 40 | 40 | 100.0% |

No mismatches were reported in the supplied 40-report dataset.

**Important:** These figures measure the rules-based classifier, not Workers AI model accuracy. They do not guarantee performance on unseen reports.

## Additional Edge-Case Tests

The following manually selected inputs were tested separately from the labelled dataset. They demonstrate limitations of the current rules-based classifier.

1. **Input:** “A pothole beside a pile of dumped rubbish”  
   **Actual result:** `rubbish`, priority 2.  
   **Limitation:** The rubbish rule takes precedence over the road-damage rule, so reports containing multiple issue types are not represented explicitly.

2. **Input:** “The road is damaged and cars are swerving to avoid it”  
   **Actual result:** `not_relevant`, priority 1.  
   **Limitation:** The wording does not match the current road-damage keywords, so a potentially hazardous issue may be missed.

3. **Input:** “There is a dangerous obstruction on the street”  
   **Actual result:** `not_relevant`, priority 1.  
   **Limitation:** The generic wording does not match a supported issue category.

These are additional edge-case probes, not failures from the 40 labelled reports.

## Security

- Keep `AUTH_SECRET` private and configure it through Cloudflare Wrangler secrets.
- Never commit environment files, passwords, tokens, or production secrets.
- Enforce authorization on the backend rather than relying only on frontend role checks.
- Use HTTPS for deployed application traffic.
- Use dedicated assessment-only accounts for marking.

## Known Limitations

- Mixed-category reports may be classified as only one issue type.
- Generic descriptions of dangerous obstructions may not match supported categories.
- The measured accuracy results cover the labelled dataset and rules-based classifier only.
- AI-assisted triage needs separate evaluation against labelled reports.
- Local Wrangler execution was not verified because of the development machine's GLIBC compatibility issue.

## Assessment Marking Accounts

The following dedicated accounts are provided for assessment marking.

**Staff**
- Email: `staff01@sw.com`
- Password: `subodhi12345@D`

**Admin**
- Email: `admin@sw.com`
- Password: `subodhi12345@D`

Verify both accounts before submission. These credentials must be assessment-only, must not be reused for personal accounts, and should be changed if they have been exposed or are used elsewhere.

## Source ZIP

Prepare a source archive no larger than **25 MB**.

Include the application source, tests, required configuration examples, migrations, and documentation. Exclude:

- `node_modules`
- `.wrangler`
- Build output
- Local environment files
- Secrets and unrelated generated files

Inspect the archive before uploading it to the assessment submission page.