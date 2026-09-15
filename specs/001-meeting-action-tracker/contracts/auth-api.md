# API Contract: Authentication

Base path: `/api/auth`. All request/response bodies are JSON, Pydantic models per constitution
Principle VI. Every other contract in this directory requires a valid `Authorization: Bearer
<token>` header obtained here, except this endpoint itself.

## `POST /api/auth/login` — Sign In (User Story 1)

The Login screen offers visually separate "Team Member" and "Admin" sign-in options, but both post
to this same endpoint with the same body — the option clicked is not sent to the server and has no
effect on the result (FR-002).

**Request body** (`LoginRequest`):

```json
{ "employeeMailId": "sarah@example.com", "password": "•••••••••" }
```

**Responses**:
- `200 OK` → `LoginResponse`:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": 7, "employeeName": "Sarah", "employeeMailId": "sarah@example.com", "role": "TEAM_MEMBER" }
  }
  ```
  `role` is the account's actual, stored Role — this is what the frontend uses to decide which
  navigation/actions to show, regardless of which sign-in option was clicked (FR-002).
- `401 Unauthorized` — credentials do not match an active user (wrong password, unknown mail ID, or
  a deactivated account) (FR-001, FR-006).

## `GET /api/auth/me` — Current Session (used by route guards)

**Responses**:
- `200 OK` → the same `user` object shape as above.
- `401 Unauthorized` — missing/expired/invalid token.

## Out of scope for this contract

There is no `POST /api/auth/register` — self-registration is explicitly out of scope (see spec
Assumptions); accounts are created only via [users-api.md](./users-api.md)'s Admin-only endpoint.
