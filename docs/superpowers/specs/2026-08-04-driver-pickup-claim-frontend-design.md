# Driver Order Claim & Status Management — Frontend Design

**Date:** 2026-08-04  
**Feature:** Driver Accept Pickup & Status Lifecycle  
**Scope:** Frontend only (`client/`)  
**Target UI:** Driver Dashboard (`/dashboard/driver`)  
**Source mini-spec:** `feature.md`

---

## 1. Goal

Allow an authenticated driver to:

1. Browse **unassigned** pickups and **claim** one.
2. Progress owned pickups through `ASSIGNED` → `COLLECTING` → `COLLECTED`.
3. Enter required verification data (`actualQuantity`) when completing a pickup.

---

## 2. Decisions

| Topic | Choice |
|---|---|
| Architecture | New `features/driver-pickups` module; keep existing dashboard chrome |
| Layout | Assigned list is primary; Unassigned is a **collapsible panel above** it (default expanded) |
| Data | Real API calls with **in-memory mock fallback** when requests fail |
| Image | File picker UI; local preview + mock `imageUrl` string (no upload endpoint) |
| Forms | React Hook Form + Zod (`actualQuantity > 0`) |
| Server state | TanStack React Query (`useQuery` / `useMutation`) |

---

## 3. Architecture

```
client/src/
├── app/providers/QueryProvider.jsx   # new — wrap app
├── features/driver-pickups/
│   ├── api/driverPickups.js          # HTTP + mock fallback
│   ├── hooks/
│   │   ├── useUnassignedPickups.js
│   │   ├── useAssignedPickups.js
│   │   ├── useClaimPickup.js
│   │   └── useUpdatePickupStatus.js
│   ├── components/
│   │   ├── UnassignedPickupsPanel.jsx
│   │   ├── AssignedPickupsList.jsx
│   │   ├── PickupCard.jsx
│   │   ├── CompletePickupModal.jsx
│   │   └── PickupDetailsModal.jsx    # read-only View Details
│   ├── constants.js                  # status colors, query keys
│   ├── mockData.js                   # seeded demo pickups
│   └── index.js
└── features/dashboard/pages/DriverDashboard.jsx  # compose feature
```

### Data flow

- Lists load via React Query.
- Query keys: `['driver-pickups', 'unassigned']`, `['driver-pickups', 'assigned']`.
- Claim / status mutations invalidate both keys (or parent `['driver-pickups']`).
- Components never call `api/` directly; they use hooks only.
- Pages stay thin: `DriverDashboard` keeps sidebar/header/stats and mounts the feature components.

### Mock fallback

- On network error, 404, or 5xx for list/mutation endpoints, use in-memory mock state.
- Mutations against mock update local arrays so claim → start → complete still works offline.
- When fallback is active, show a subtle **“Using demo data”** banner on the dashboard content area.

---

## 4. UI / Interactions

### 4.1 Unassigned Pickups Panel

- Collapsible header: title, count badge, chevron.
- Card fields: order ID, customer name + phone, address + distance, category / estimated quantity when present.
- Primary action: **Claim Order**.
- Success: card leaves Unassigned; appears in Assigned as `ASSIGNED`.
- `409 Conflict`: show message *“This order has already been claimed by another driver.”* (or API `error` text); keep card visible.

### 4.2 Assigned Pickups List

| Status | Badge | Action |
|---|---|---|
| `ASSIGNED` | Yellow / light orange | **Start Driving** → PATCH `COLLECTING` |
| `COLLECTING` | Blue `#3B82F6` | **Complete** → open verification modal |
| `COLLECTED` | Green `#22C55E` | **View Details** (read-only; no status change) |

### 4.3 Complete Pickup Modal

- Required: `actualQuantity` (number > 0).
- Optional: `note` (text), image file → preview + mock `imageUrl` in body.
- Submit: **Confirm & Save** → PATCH with `{ status: 'COLLECTED', actualQuantity, note?, imageUrl? }`.
- Disable submit while pending; inline Zod errors.

### 4.4 Out of scope

- Real image upload service.
- History / Earnings pages.
- Client-side `ACTIVE` driver gating beyond API errors.
- Backend implementation (separate task).

---

## 5. API Contract (frontend expects)

| Action | Method | Path |
|---|---|---|
| List unassigned | `GET` | `/api/driver/pickups/unassigned` |
| List assigned | `GET` | `/api/driver/pickups` (driver’s own active pickups; mock if endpoint missing) |
| Claim | `POST` | `/api/driver/pickups/:id/claim` |
| Update status | `PATCH` | `/api/driver/pickups/:id/status` |

Auth: reuse existing `apiRequest` (`credentials: 'include'`).

Complete body example:

```json
{
  "status": "COLLECTED",
  "actualQuantity": 3.5,
  "note": "Items verified and weighed",
  "imageUrl": "blob:mock-or-object-url"
}
```

---

## 6. Error handling & edge cases

- Fallback to mock on transport / missing-endpoint failures; banner when demo mode is on.
- Do not remove unassigned card until claim succeeds.
- Disable only the button for the in-flight mutation; other cards remain usable.
- Empty states: “No unassigned pickups” / “No assigned pickups yet.”
- No new automated E2E for this pass; manual path claim → start → complete is the MVP check.

---

## 7. Dependencies to add

- `@tanstack/react-query`

Already present: `react-hook-form`, `zod`, `@hookform/resolvers`, Tailwind, React Router.
