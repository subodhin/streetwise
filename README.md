# Streetwise, the Dynarq pre-enrolment task

Build a city maintenance map where citizens report problems, an AI sorts and prioritises each report under fixed rules, staff approve the hard cases, and the public watches the city get fixed, live. Alone, from an empty repository to a live Cloudflare deployment, in 96 hours.

Your applicant page at dynarq.com/applicants has this brief too, plus your clock and the submit form.

## What is in this pack

| Path | What it is |
|---|---|
| `data/zones.json` | The 6 maintenance zones of Colombo (example data): id, name, crew, status, polygon |
| `data/past-reports.json` | 30 days of example history for the map, the counters and the charts |
| `data/labelled-reports.json` | 40 reports with the right answers. Measure your triage on these |
| `contract/triage.request.schema.json` | What our marker sends to your `POST /api/triage` |
| `contract/triage.response.schema.json` | What your endpoint must answer |
| `streetwise.config.example.json` | The settings that must be configuration, not code |
| `reference/streetwise-demo.html` | The reference demo: the look and feel we expect. Open it in a browser |

## The product

Streetwise is for 1 city: Colombo, with the 6 maintenance zones in data/zones.json. Everything you show is example data from the starter pack or reports you create. The reference demo shows the feel we expect.

1. **Citizens.** Report a problem with text, a location on the map and an optional photo. Follow their own report from received to fixed.
2. **The AI.** Reads each new report and decides type, size, priority 1 to 5, the crew zone, how sure it is, and a 1 line reason.
3. **Staff.** Sign in, see what needs a person, approve, reject, merge duplicates and mark reports fixed. Every change is logged.
4. **The public.** A smooth, dark, full screen map with clustered reports, zones with their status, and live totals that move without a reload.

## User journeys

Each journey must work from start to end on your live link, on a laptop and on a phone. We walk every one of them when we mark.

1. **A citizen reports a problem.** Opens the map, taps Report, places the pin on the map (or uses their location), writes what they see, adds a photo if they want and sends it. They see at once that it was received, with a report ID and a private link to follow it. Under 60 seconds, no account.
2. **A citizen follows their report.** Opens the private link and sees each step with its time: received, triaged (with the type and priority), approved or published, fixed. If it was merged into another report, the link says so and shows the main report.
3. **Staff clear the queue.** Sign in and land on the queue of reports that need a person, most urgent first. Open one, see the text, photo, location on a small map, the AI decision and its reason and any likely duplicates. Approve, change the type or priority, reject with a reason, or merge. The next report opens. Every action is in the audit log.
4. **Staff close the loop.** Filter published reports by zone and status, mark a report in progress and then fixed. The public totals and the map change within a few seconds.
5. **An admin runs the city.** Pauses a zone with a reason and a date (a paused zone shows on the public map and new reports there say so), edits report types, size names, counter names and the 2 thresholds, and adds or removes staff. No code change and no redeploy needed.
6. **The public watches.** Anyone opens the map without signing in and sees open and recently fixed reports, the zones and their status, and the totals moving. Nothing that still needs a person is ever shown publicly, and no personal data is shown at all.

## Screens to build

At least these screens. Each has a loading state, an empty state and an error state that are designed, not blank.

1. **Public map.** Full screen map of Colombo. Clustered pins coloured by priority, the 6 zones drawn with their status, type filters, a list of reports beside the map on a laptop and under it on a phone, and the live totals.
2. **Report card.** Opens when a pin or a list row is chosen: the text, type, size, priority, zone, time, status, the photo if any. Closes with Escape and with a close button.
3. **Report form.** Pin on the map, text (10 to 500 characters), optional photo (JPG or PNG, up to 5 MB). Clear messages for every wrong input. A success screen with the report ID and the follow link.
4. **Follow page.** The private status page for 1 report, reachable only with its link.
5. **Staff sign in.** Email and password. A wrong password and an unknown email get the same message. Too many tries are slowed down.
6. **Staff queue.** Reports that need a person, sorted by priority then age, with counts per reason (high priority, low confidence, not relevant, possible duplicate).
7. **Report review.** Everything about 1 report and the actions: approve, edit type or priority, reject with a reason, merge into another report, mark in progress, mark fixed.
8. **Zones.** Admin only. The 6 zones with status, pause reason and date, and the number of open reports in each.
9. **Settings.** Admin only. Types, size names, counter names, the 2 thresholds and the map area, read from and saved to the database.
10. **Audit log.** Admin only. Who did what to which report and when, newest first, filterable by person and by report.

## Must have

Every item here decides pass or fail. Build these first.

1. **Public map.** Smooth zoom and pan, clustered pins coloured by priority, a card per report, the 6 zones with status (active or paused, with the pause reason and date), live totals: open, fixed in the last 30 days, fixed in total. Updates without a page reload; polling is fine.
2. **Report form.** Text, location (click the map), optional photo. Every input checked on the server, not only in the browser.
3. **AI triage.** For each new report the model returns type, size, priority 1 to 5, crew zone, confidence 0 to 1 and a 1 line reason. Use Workers AI on your Cloudflare account.
4. **Rules over the model.** Fixed rules decide the route, not the model: priority 4 or 5 goes to a person; confidence under 0.7 goes to a person; type not_relevant is rejected unless a person restores it. Everything else is published. Nothing reaches the public map without passing the rules or a person.
5. **Works without AI.** If the model fails, times out or has no allowance left, plain rules (keywords and location) take over and the report says triaged_by "rules". The page never breaks and no report is lost.
6. **Staff area.** Sign in. Roles checked on the server: staff approve, reject, merge and resolve; admin also edits zones and settings. An audit log of who changed what and when.
7. **Settings, not code.** Report types, size names, the metric names on the counters, the thresholds (4 and 0.7) and the map area are configuration (see streetwise.config.example.json), because Streetwise is meant for more than 1 city.
8. **Measured accuracy.** Run your triage on data/labelled-reports.json (40 reports with the right answers). In the README: how often type and priority are right, and 3 reports it gets wrong and why.
9. **Live on Cloudflare.** Deployed on your own free Cloudflare account: Workers for the site and API, D1 for data, Workers AI for the model. Every network call has a timeout and a retry limit.
10. **The contract.** POST /api/triage on your live link, exactly as in "The contract" below. We call it with reports you have not seen.
11. **Tests and README.** Tests for the rules, the fallback and the roles. A README: how to run it, how to deploy it, the decisions you took, what is missing.

## Should have

These make a strong build. They count only when every must have works.

1. **Duplicates.** A new report close to an open one that says the same thing is offered as a duplicate (text similarity plus distance). Staff merge them: 5 people reporting the same pothole become 1 report with 5 voices.
2. **30 day chart.** Reports and fixes per day, for the city and per zone.
3. **Follow my report.** The citizen gets a private link that shows received, triaged, approved, fixed.

## Bonus

The polish. Only after the rest works.

1. **Replay.** A time slider that plays the last 30 days on the map.
2. **Weekly city summary.** Written by the AI, where every sentence links to the report IDs it is based on and says nothing the data does not contain.
3. **Forecast.** Expected reports per zone for the next 7 days from the history, with the error shown.
4. **Live push.** Updates pushed to the map instead of polling.
5. **Deploy from GitHub.** Every push to main deploys automatically.

## Look and feel

The reference demo below is the bar. Match its quality, not its pixels: your own layout and your own words are expected.

1. **Calm and dark map.** A dark base map, 1 accent colour for actions, priority shown by colour on the pins and by number in the text, never by colour alone.
2. **Smooth.** Zoom, pan and cluster changes stay smooth. New reports arrive with a short, quiet animation. Nothing jumps when data loads.
3. **Readable.** Body text 14 px or larger, enough contrast to read in daylight, numbers in a font where digits line up.
4. **Phone first for citizens.** The public map, the form and the follow page work at 390 px wide with no sideways scrolling and buttons large enough for a thumb.
5. **Keyboard and screen readers.** Every action works with the keyboard, focus is visible, form fields have labels and the map has a list alternative.
6. **Fast.** The public map is usable within 3 seconds on a normal 4G phone. Do not load what the first view does not need.
7. **Honest.** Example data is labelled as example data. Say when the AI decided and when a person did.

## Data model

A starting point in D1. Rename or add what you need and explain your choices in the README.

1. **reports.** id, text, lat, lng, photo (where you store it is your choice; if a free plan cannot store it, say so in the README), type, size, priority, zone, confidence, reason, route, triaged_by, status (received, needs_review, published, in_progress, fixed, rejected, merged), merged_into, created_at, updated_at.
2. **report_events.** Every change to a report: report id, who (a person or the system), what changed, old and new value, when. This is the audit log and the follow page timeline.
3. **zones.** id, name, polygon, status (active or paused), pause reason, paused until.
4. **users.** id, email, password hash, role (staff or admin), active. Never store plain passwords.
5. **settings.** The configuration from streetwise.config.example.json, editable by an admin.

## API you build

Your own routes are your choice. These are the ones we expect to exist, all with checked inputs and clear JSON errors.

1. **POST /api/reports.** Create a report. Runs triage, applies the rules, returns the id and the follow link. Limited per address.
2. **GET /api/reports.** Public reports only, filterable by type, zone and status, for the map and the list.
3. **GET /api/reports/:id/follow.** The follow page data, only with the private token from the link.
4. **GET /api/stats.** The live totals and, if you build the chart, the 30 day series.
5. **Staff routes.** Sign in, sign out, the queue, review actions, zones, settings, audit log. Role checked on the server for every call.
6. **POST /api/triage.** The contract below, open to our marker. It returns the decision and never stores anything.

## The contract

```http
POST /api/triage
Content-Type: application/json

{
  "id": "r-0412",
  "text": "Deep pothole by the bus stop, a scooter nearly fell",
  "lat": 6.9147,
  "lng": 79.8730,
  "reported_at": "2026-10-27T08:14:00+05:30",
  "photo_url": null
}
```

```http
200 OK
Content-Type: application/json

{
  "id": "r-0412",
  "type": "pothole",
  "size": "medium",
  "priority": 4,
  "zone": "Z-03",
  "confidence": 0.82,
  "reason": "Road damage at a bus stop, near accident reported",
  "route": "needs_approval",
  "triaged_by": "model"
}
```

1. type is one of pothole, street_light, flooding, rubbish, not_relevant.
2. size is small, medium or large. priority is a whole number 1 to 5. confidence is 0 to 1.
3. zone is a zone id from data/zones.json, the zone the location falls in, or the nearest one.
4. route is publish, needs_approval or reject, decided by your rules, not by the model.
5. triaged_by is model or rules.
6. Answer within 10 seconds. A bad request gets 400 with a JSON error, never a crash.
7. The endpoint is open to our marker: no sign in, but limit how often 1 address can call it.

## How priority works

The labelled reports and our hidden test reports follow this scale.

1. **5.** Danger to people now, or a main road blocked: deep flood water, a collapsed road, a fallen pole or live wires.
2. **4.** Likely injury or damage soon: a near accident, a hazard at a school, hospital or bus stop, water rising toward homes.
3. **3.** A clear problem on a busy route that needs a crew this week.
4. **2.** Minor, low traffic, or a recurring nuisance.
5. **1.** Cosmetic, still working, or unclear.

## Engineering bar

How we build at Dynarq. Your code is read line by line.

1. **Small, readable functions.** Clear names, 1 job each, no dead code. A new engineer understands a file in a few minutes.
2. **Every network call is bounded.** Model calls and any outside call have a timeout and a retry limit, and the failure path is written, not assumed.
3. **Inputs checked on the server.** Length, type, range and file type, with the same rules whatever the browser sends.
4. **Secrets stay out.** No keys or passwords in the repository or in the client. Use Cloudflare secrets and environment variables.
5. **Logs that help.** Log what was tried, what came back and what was skipped, without personal data.
6. **Migrations.** The database schema is created by migration files in the repository, so a fresh account can be set up from the README alone.
7. **Tests that matter.** The routing rules, the fallback when the model fails, the role checks and the input checks, runnable with 1 command.

## Rules

1. Work alone, with AI. We expect you to use AI coding tools (Claude, Cursor, Copilot, ChatGPT or any other, free or paid, on your own account): the scope is set for an engineer who builds with AI. No other person may help. In the final call you must explain and change every line, whoever typed it.
2. The product runs on free plans only: GitHub, Cloudflare Workers, D1 and Workers AI on your own free accounts. Nobody has to pay for hosting. If a free limit blocks you, write it in the README instead of paying. Your own AI coding tool is your choice and does not count as a service of the product.
3. No secrets in the repository. Use Cloudflare secrets and environment variables.
4. Keep the repository private until we send our decision, and add the GitHub user agentdynarq as a collaborator so we can mark it. Do not share the brief or the starter pack.
5. Use the example data. Do not scrape other sites. Show the map credit line your tile provider asks for.
6. Your submission is never used in any Dynarq or client product. It exists only to judge your work, and it stays confidential.

## How you are judged

Out of 100, plus up to 10 for should haves and bonus items. Then a 45 minute final call.

1. **Works end to end, 20.** Your live Cloudflare link does every must have.
2. **AI triage, 20.** Our hidden reports sent to your /api/triage: type and priority accuracy, rules respected, approval path, and the fallback with the model switched off.
3. **Code, 15.** Structure, naming, small readable functions.
4. **Security, 15.** Roles checked on the server, inputs checked, no secrets.
5. **Tests, 10.** Run on a fresh machine.
6. **Usability and look, 10.** Against the reference demo: the map feel, the staff screens, phone width.
7. **README and AI.md, 10.** Setup, decisions, accuracy, honest limits, and how well you directed and checked the AI.
8. **Final call, a gate.** A demo, a walk through your own code, then 1 live change we set on the call, with a test. If you cannot explain or change your own code, the build does not pass, whatever the score.

## A suggested 4 day plan

A suggestion, not a rule. What matters is that every must have works at the end and the rest is honest.

1. **Day 1.** Read everything. Set up the repository, Workers, D1 and the migrations. Load zones and past reports. Public map with clusters, zones and totals, deployed live on the first day.
2. **Day 2.** Report form and POST /api/reports. Triage with Workers AI, the rules, the fallback and POST /api/triage. Measure accuracy on the 40 labelled reports and improve the prompt and the rules.
3. **Day 3.** Staff sign in, roles, the queue, review actions, the audit log, zones and settings. Follow page. Tests for rules, fallback and roles.
4. **Day 4.** Phone width, empty, loading and error states, speed, should haves if there is time. README with setup, decisions, accuracy, 3 failures and limits. Submit with time to spare.

## What you hand in

All of it, or the submission is not complete.

1. **Private repository.** On GitHub, with agentdynarq added as a collaborator, and a clean commit history that shows how you worked.
2. **Live link.** Your Streetwise on your own Cloudflare account, running until we tell you the result.
3. **Logins for us.** In the README: 1 staff and 1 admin login made only for marking.
4. **README.** How to run it locally, how to deploy it from nothing, the decisions you took and why, your measured type and priority accuracy, 3 reports it gets wrong and why, and what is missing.
5. **How you used AI.** A short AI.md in the repository: which tools you used and for what, 3 places where the AI was wrong or weak and how you found and fixed it, and 1 part you chose to write yourself and why.
6. **A zip of your source.** Uploaded on this page, 25 MB at most, without node_modules or build output.

## Links

- [Behaviour reference](https://www.fixmystreet.com/reports/Westminster): Reports on a map with category and status filters. Look only: do not copy its design, text or data, and do not scrape it.
- [Free map tiles](https://openfreemap.org/): Free, no key, used by the reference demo. MapLibre adds the credit line for you.
- [Map library](https://maplibre.org/maplibre-gl-js/docs/): What the reference demo uses for the smooth map and clusters.
- [Workers AI](https://developers.cloudflare.com/workers-ai/): The model, on your free Cloudflare account.
- [D1](https://developers.cloudflare.com/d1/): The database.
- [Workers](https://developers.cloudflare.com/workers/): The site and the API.

---

# Implementation Documentation

## Live deployment

- Frontend: https://streetwise-frontend.pages.dev
- Backend: https://streetwise.streetwise-city.workers.dev
- Health check: https://streetwise.streetwise-city.workers.dev/api/health

## Stack

React, TypeScript, Vite, MapLibre GL, Hono, Cloudflare Workers, D1, Workers AI and Vitest.

## Local setup

Requirements: Node.js and npm.

    git clone https://github.com/subodhin/streetwise.git
    cd streetwise
    npm install
    npm install --prefix frontend

Authenticate with Cloudflare:

    npx wrangler login

Start the API:

    npm run dev

In a second terminal, start the frontend:

    npm run dev --prefix frontend

Set `VITE_API_URL` if the frontend needs a different API URL. Vite exposes variables prefixed with `VITE_` to browser code; do not put secrets in them.

Configure `AUTH_SECRET` using Wrangler's supported local secrets mechanism. It must be at least 32 characters. Never commit it.

**Local environment note:** Local Wrangler execution encountered a GLIBC compatibility error in `workerd` on the development machine. The deployed application was verified separately.

## Database migrations

List pending remote migrations:

    npx wrangler d1 migrations list streetwise-db --remote

Apply remote migrations:

    npx wrangler d1 migrations apply streetwise-db --remote

Use `--local` on a compatible environment for local D1 migrations.

## Deployment

Configure the authentication secret interactively:

    npx wrangler secret put AUTH_SECRET

Enter a strong random value of at least 32 characters when prompted.

Deploy the Worker:

    npm run deploy

Build the frontend:

    npm run build --prefix frontend

Deploy `frontend/dist` to Cloudflare Pages. Configure the Pages build directory as `frontend`, build command as `npm run build`, output directory as `dist`, and `VITE_API_URL` as the deployed Worker URL. Rebuild and redeploy after changing the build-time API URL.

## Tests

Run the backend tests:

    npm test

Latest verified result: **25 tests passed across 5 test files**.

## Measured classification accuracy

Run:

    npx tsx scripts/evaluate-accuracy.ts

The evaluator compares `classifyWithRules()` against `data/labelled-reports.json`.

| Metric | Correct | Total | Accuracy |
|---|---:|---:|---:|
| Type classification | 40 | 40 | 100.0% |
| Priority classification | 40 | 40 | 100.0% |

No mismatches were reported in the supplied 40-report dataset. These figures measure the rules-based classifier, not Workers AI model accuracy, and do not guarantee performance on unseen reports.

## Additional edge-case limitations

These three manually selected inputs were tested separately from the labelled dataset:

1. **“A pothole beside a pile of dumped rubbish”** — actual result: `rubbish`, priority 2. The rubbish rule takes precedence over the road-damage rule, so mixed-category reports are not represented explicitly.
2. **“The road is damaged and cars are swerving to avoid it”** — actual result: `not_relevant`, priority 1. The wording does not match the current road-damage keywords, so a potentially hazardous issue is missed.
3. **“There is a dangerous obstruction on the street”** — actual result: `not_relevant`, priority 1. The generic wording does not match a supported issue category.

These are additional edge-case probes, not failures from the 40 labelled reports. Confirm intended categories and priorities against the assessment rules before presenting them as formal misclassification examples.

## Security

- Keep `AUTH_SECRET` private and configure it through Wrangler secrets.
- Never commit environment files, passwords or credentials.
- Enforce authorization on the backend; frontend role checks alone are insufficient.
- Use HTTPS for deployed application traffic.

## Known limitations

- Expand the labelled dataset with ambiguous and mixed-category reports.
- Improve handling of reports containing multiple issues.
- Test generic descriptions of dangerous obstructions.
- Evaluate AI-assisted triage separately from rules-based classification.
- Continue testing timeout, retry and fallback behaviour.
- Verify dedicated staff and admin marking accounts before submission.

## Assessment marking accounts

Create dedicated accounts and test both before submission. Replace these placeholders with the assessment-only credentials in the submitted README. Do not use personal credentials or disclose production secrets.

- Staff username: staff01@sw.com
- Staff password: subodhi12345@D
- Admin username: admin@sw.com
- Admin password: subodhi12345@D

## Source ZIP

Create a source archive no larger than 25 MB. Exclude `node_modules`, `.wrangler`, build output, local environment files, credentials and other generated files. Inspect the archive before uploading it to the assessment page.
