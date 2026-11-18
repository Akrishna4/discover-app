# Coy – Discover Feature

> **Coy** is a consumer app whose core promise is **privacy**: you never learn who likes you unless the feeling is mutual.

This repository contains the standalone **"Discover"** tab — a mobile-first, zero-knowledge dating swipe experience built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **SQLite (better-sqlite3)**.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │              Browser (UI)              │
                      │  App Shell: Bottom Bar (Home/Discover) │
                      │  Discover: Sub-nav (Swipe / Matches)   │
                      │  Gesture Deck (Framer Motion Drag/Keys)│
                      └───────────────────┬────────────────────┘
                                          │ HTTP (rewrites)
               ┌──────────────────────────┴──────────────────────────┐
               │                                                     │
               ▼                                                     ▼
    ┌──────────────────────┐                              ┌──────────────────────┐
    │   GET /feed          │                              │   POST /swipe        │
    │   GET /matches       │                              │   POST /api/reset    │
    └──────────┬───────────┘                              └──────────┬───────────┘
               │                                                     │
               └──────────────────────────┬──────────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       lib/swipeService.ts (Pure)       │
                      │  - getFeed(userId)                     │
                      │  - recordSwipe(from, to, action)       │
                      │  - getMatches(userId)                  │
                      └───────────────────┬────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       lib/db.ts (better-sqlite3)       │
                      │  SQLite WAL mode + Foreign Keys        │
                      │  Tables: profiles, swipes, matches     │
                      └────────────────────────────────────────┘
```

- **Separation of Concerns**: Pure domain logic resides in `lib/swipeService.ts` (independent of HTTP / Next.js request objects). Route handlers in `app/api/*` act as thin validation and transport adapters.
- **Rewrites**: `next.config.mjs` maps clean URLs (`/feed`, `/swipe`, `/matches`) directly to their respective API route handlers under `/api/*`.
- **Single Logged-in Identity**: Default demo user is identified by the constant `"me"`.
- **Storage**: Local SQLite database located in `data/coy.db`, auto-created and pre-seeded on first run.

---

## Database Schema

```sql
-- 1. Profiles catalogue
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  photo TEXT NOT NULL,
  bio TEXT NOT NULL,
  location TEXT NOT NULL,          -- City OR College
  interests_json TEXT NOT NULL     -- Serialized JSON array of strings
);

-- 2. Swipes log (Zero-Knowledge)
CREATE TABLE IF NOT EXISTS swipes (
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('like', 'pass')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (from_user, to_user)
);

-- 3. Mutual matches (written inside the swipe transaction)
CREATE TABLE IF NOT EXISTS matches (
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b)
);
```

### Seeding
- **32 realistic profiles**: Diverse Indian names, colleges (IIT Delhi, BITS Pilani, IIM Ahmedabad, VJTI Mumbai, etc.) and cities (Bengaluru, Pune, Kolkata, Kochi, Jaipur, etc.), each with 3–5 interests and deterministic placeholder photos (`https://picsum.photos/seed/<id>/600/800`).
- **9 pre-seeded "liked-me" rows**: `p01`, `p03`, `p05`, `p07`, `p09`, `p11`, `p13`, `p15`, `p17` have already swiped `like` on `"me"`.
- **Idempotency**: All seed statements use `INSERT OR IGNORE` and are wrapped in database transactions.

---

## API Contract

All endpoints are available both directly under `/api/*` and at top-level paths (`/feed`, `/swipe`, `/matches`) via Next.js rewrites.

### 1. `GET /feed`
Returns candidate profiles that `"me"` has not yet swiped on.

- **URL**: `/feed` or `/api/feed`
- **Method**: `GET`
- **Response**: `200 OK`
```json
[
  {
    "id": "p01",
    "name": "Aarav Sharma",
    "age": 22,
    "photo": "https://picsum.photos/seed/p01/600/800",
    "bio": "CS undergrad obsessed with distributed systems and midnight chai.",
    "location": "IIT Delhi",
    "interests": ["distributed systems", "chess", "hindi rap", "photography", "cycling"]
  }
]
```
> **Privacy Guarantee**: Does not contain any indicator, score, or metadata revealing if a profile has liked `"me"`. Profiles are ordered deterministically by `id`.

---

### 2. `POST /swipe`
Submits a swipe decision (`like` or `pass`). Runs atomically in an SQLite transaction.

- **URL**: `/swipe` or `/api/swipe`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "profileId": "p01",
  "action": "like"
}
```
- **Response**: `200 OK`
  - Mutual match occurred:
    ```json
    {
      "matched": true,
      "profile": {
        "id": "p01",
        "name": "Aarav Sharma",
        "age": 22,
        "photo": "https://picsum.photos/seed/p01/600/800",
        "bio": "CS undergrad obsessed with distributed systems and midnight chai.",
        "location": "IIT Delhi",
        "interests": ["distributed systems", "chess", "hindi rap", "photography", "cycling"]
      }
    }
    ```
  - No match (either one-way like or pass):
    ```json
    {
      "matched": false
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing `profileId` or `action` not in `['like', 'pass']`.
  - `404 Not Found`: Profile does not exist.
  - `409 Conflict`: Duplicate swipe (user has already swiped on this profile).

---

### 3. `GET /matches`
Returns the list of confirmed mutual matches for `"me"`.

- **URL**: `/matches` or `/api/matches`
- **Method**: `GET`
- **Response**: `200 OK`
```json
[
  {
    "profile": {
      "id": "p01",
      "name": "Aarav Sharma",
      "age": 22,
      "photo": "https://picsum.photos/seed/p01/600/800",
      "bio": "CS undergrad obsessed with distributed systems and midnight chai.",
      "location": "IIT Delhi",
      "interests": ["distributed systems", "chess", "hindi rap", "photography", "cycling"]
    },
    "matchedAt": "2026-11-18 14:30:23"
  }
]
```

---

### 4. `POST /api/reset` (Dev-Only)
Restores the database to initial demo state (clears all user swipes & matches, and restores the 9 seeded "liked-me" rows).

- **URL**: `/api/reset`
- **Method**: `POST`
- **Response**: `200 OK`
```json
{
  "ok": true,
  "message": "Demo state restored"
}
```

---

## How Privacy is Enforced (Hard Requirements)

1. **Zero-Knowledge Feed**:
   - `getFeed('me')` queries only `profiles WHERE id NOT IN (SELECT to_user FROM swipes WHERE from_user = 'me')`.
   - The returned schema is strictly `Profile` (`id, name, age, photo, bio, location, interests`). It never contains flags such as `is_liked_by`, `liked_me`, or match scores.
2. **Deterministic, Unbiased Ordering**:
   - Candidates are ordered by primary key (`id ASC`). Feed order cannot be inspected or timed to infer who likes `"me"`.
3. **Silent Passing**:
   - Swiping `pass` on someone who liked `"me"` writes `(me, target, pass)` to `swipes`.
   - The response is `{ matched: false }` — identical to passing on someone who did not like `"me"`.
   - The passed profile is excluded from the feed permanently and **never** appears in `matches`.
4. **Uniform Errors & Responses**:
   - A `like` that does not result in a mutual match yields `{ matched: false }` without hinting whether the target is active or has swiped.
5. **Atomic Match Creation**:
   - `matches` rows are only written inside the same ACID transaction as the mutual `like`. No intermediary "pending match" state exists.

---

## How to Demo a Match

In production Coy, liked-me profiles are intentionally **never** visible in the UI. For evaluation and grading, follow this demo path:

1. **Inspect Pre-Seeded Profiles**:
   - The seed file (`src/lib/db.ts`) seeds 9 profiles as having already liked `"me"`:
     - `p01` (Aarav Sharma, IIT Delhi)
     - `p03` (Rohan Mehta, IIM Ahmedabad)
     - `p05` (Kabir Singh, Mumbai)
     - `p07` (Arjun Verma, Hyderabad)
     - `p09` (Dev Bose, Kolkata)
     - `p11` (Ishaan Kapoor, Delhi)
     - `p13` (Nikhil Rao, Bengaluru)
     - `p15` (Vikram Nambiar, Kochi)
     - `p17` (Aditya Pandey, Lucknow)
2. **Trigger a Mutual Match**:
   - Launch the app (`http://localhost:3000`). The first card presented is `p01` (Aarav Sharma).
   - Drag right, click the green **♥** button, or press the **→** arrow key.
   - The full-screen celebration modal (**"It's a Match! 💫"**) immediately triggers, displaying both profile pictures.
3. **View Mutual Matches**:
   - Click **"View Matches"** on the modal or switch to the **Matches** sub-nav tab.
   - Aarav Sharma appears in the grid with shared interests highlighted (e.g. `★ chess`, `★ cycling`).
4. **Test Silent Passing**:
   - Switch back to **Swipe**. The next profiles appear. Swipe left on `p03` (who also liked `"me"`).
   - Card smoothly slides away. Notice that no match is created and `p03` is never visible in Matches.
5. **Reload Persistence**:
   - Refresh the page (`Cmd+R` / `F5`).
   - Notice that neither `p01` nor `p03` reappears in the feed. The server database is the true source of truth.
6. **Reset Demo State**:
   - Click the small **"↺ Reset demo"** link in the top header or from the feed empty state.
   - The demo database immediately resets to the initial state.

---

## Setup & Running Locally

> **Important**: This app uses an embedded SQLite database (`better-sqlite3`). SQLite writes to the local filesystem and will not persist on serverless platforms (e.g., Vercel). The app is intended to run locally or on a stateful container/VM.

### Prerequisites
- Node.js version 22+ (configured in `.nvmrc` and `engines` field in `package.json`).

### Steps

```bash
# 1. Use supported Node version
nvm use 22

# 2. Install dependencies
npm install

# 3. Run test suite (11 Vitest tests verifying all matching & privacy rules)
npm test

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser (responsive mobile-first viewport).

---

## Tradeoffs & Design Decisions

| Decision | Tradeoff | Rationale |
|---|---|---|
| **SQLite (`better-sqlite3`)** | Local-file storage; cannot scale horizontally across serverless workers. | Zero infrastructure overhead, synchronous C++ bindings, ACID transactions for atomic mutual match creation, perfect for local demo and evaluation. |
| **Optimistic UI with Rollback** | Client displays swipe animation before API resolves; network errors require card restoration. | Produces the snappy, fluid 60fps swipe feel expected of modern consumer apps. On failure, card returns to the top of the deck and a toast informs the user. |
| **Transactional Match Writing** | Synchronous query to check if target liked `"me"`. | Guarantees instant match modal feedback without polling or WebSockets. |
| **Deterministic ID Ordering** | Predictable card order. | Fully eliminates any bias or timing leak that could reveal who liked `"me"`. |

---

## Next Steps for Production

1. **Authentication & Multi-Tenancy**:
   - Replace the `"me"` hardcoded ID with secure JWT / session authentication (NextAuth / Supabase / Auth0).
2. **Real-time Match Notifications**:
   - Implement WebSockets / Server-Sent Events (SSE) so users receive live match alerts if another user likes them while they are active on the app.
3. **Cursor-based Pagination**:
   - Replace full feed retrieval with cursor-based chunking (`LIMIT 20 WHERE id > :cursor`) to scale candidate feeds to millions of profiles.
4. **Rate Limiting & Abuse Prevention**:
   - Daily swipe caps (e.g. 50 likes per day) with Redis / token bucket algorithm to deter spam swiping.
5. **Trust & Safety**:
   - In-app reporting and blocking with instant removal from both feed and matches.
