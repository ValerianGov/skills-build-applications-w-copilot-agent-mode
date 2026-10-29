# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route composition and UI rendering in React; load data through the shared API client using relative `/api` paths, and show accessible loading, error, and empty states.
- Logic tier decision: Keep Express routes thin and put validation and business behavior in explicit service functions; return deliberate 4xx responses for invalid or missing resources.
- Data tier decision: Use Mongoose schemas for required fields and references, and keep persistence and stable demo fixtures in the data layer. Seed with upserts, preserve unrelated records, and reconcile a demo user's prior team membership when moving that fixture.
- Activity tracking approach: Validate the submitted user and team IDs and confirm both records exist before creating an activity. Compute points on the server at one point per minute, set `occurredAt` on creation, and store the submitted activity type and duration.
- Team management approach: Require a team name and mascot, validate member IDs against existing users, and persist members as references. Reject invalid input with 400 responses.
- Leaderboard approach: Aggregate activity points by team, sort by total points descending, and assign ranks starting at 1. Include teams without activity with a total of 0.
- Workout suggestions approach: Find the user by email, prefer a matching workout for their fitness goal and recent activity, and include a reason for the recommendation. Return a 4xx response when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - Run: 4 failures, 1 pass. The model tests fail because required-field validation is missing from User, Team, Activity, and Workout; the seed idempotency and preservation test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` - Run: 4 failures. Invalid activity and team requests return 501 instead of 4xx, the leaderboard omits populated teams, and Mona's suggestion does not match her endurance goal/activity.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - Run: 15 failures. Components still show `Implementation pending` instead of rendering API data and the required accessible loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - Run: passed. A failure indicates a TypeScript compile or type-check error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - Not run yet. A failure indicates a frontend type-check or production bundle error.
