# API Contract: People (Users)

Base path: `/api/users`. Every endpoint below requires an authenticated Admin
(`require_role(ADMIN)`, see [research.md](../research.md) item 3) — a Team Member gets `403
Forbidden` on all of them (FR-042). Also used by Attendee/Assignee search from Meetings/Tasks.

## `POST /api/users` — Add Member (User Story 9)

**Request body** (`UserCreateRequest`):

```json
{
  "employeeName": "Sarah Iyer",
  "employeeMailId": "sarah@example.com",
  "employeeId": "E1042",
  "password": "TempPass123!",
  "role": "TEAM_MEMBER"
}
```

**Responses**:
- `201 Created` → `UserResponse` (no `password`/`passwordHash` field ever included):
  ```json
  { "id": 7, "employeeName": "Sarah Iyer", "employeeMailId": "sarah@example.com", "employeeId": "E1042", "role": "TEAM_MEMBER", "isActive": true }
  ```
- `403 Forbidden` — caller is not an Admin.
- `409 Conflict` — `employeeMailId` or `employeeId` already in use (FR-001 uniqueness).
- `422 Unprocessable Entity` — missing/blank required field.

## `GET /api/users` — Search Members (Attendee search, User Story 2; People list, User Story 9)

**Query parameters**:
- `q` (string, optional) — case-insensitive substring match against `employeeName` or `employeeId`
  (FR-011). Omitted → returns all active members (People screen listing).
- `activeOnly` (boolean, default `true`) — deactivated members are excluded from Attendee search by
  default (FR-006).

**Response** `200 OK` → `UserResponse[]` (same shape as above).

## `PATCH /api/users/{user_id}/role` — Change Role (User Story 9)

**Request body**: `{ "role": "ADMIN" }`

**Responses**:
- `200 OK` → updated `UserResponse`.
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such user.

## `PATCH /api/users/{user_id}/password` — Reset Password (User Story 9)

**Request body**: `{ "newPassword": "NewTempPass456!" }`

**Responses**:
- `204 No Content` — password reset; the new credential is communicated to the member out of band,
  not emailed by the system (spec Assumptions).
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such user.

## `PATCH /api/users/{user_id}/active` — Deactivate / Reactivate (User Story 9)

**Request body**: `{ "isActive": false }`

**Responses**:
- `200 OK` → updated `UserResponse`.
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such user.

**Side effects** (FR-006, FR-040, [research.md](../research.md) item 10): setting `isActive: false`
— in the same transaction —
1. blocks that user from signing in and from appearing in future Attendee/Assignee search results;
2. transfers `owner_id` on every Meeting they own to the workspace's configured default Admin;
3. flags `needs_reassignment` on every Task where they are the Assignee, without changing
   `assignee_id`.
