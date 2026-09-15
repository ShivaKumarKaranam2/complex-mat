# API Contract: Activity Log

Base path: `/api/activity-log`. Requires `require_role(ADMIN)` — a Team Member gets `403 Forbidden`
(FR-041, FR-042).

## `GET /api/activity-log` — List Activity (User Story 10)

**Query parameters** (all optional):
- `entityType` (string) — filter to one entity type (e.g., `Meeting`, `Task`, `User`).
- `since` (ISO datetime) — only entries at or after this timestamp.
- `page`, `pageSize` — pagination.

**Response** `200 OK` → `ActivityLogEntryResponse[]`, newest first:

```json
[
  { "id": 901, "actorId": 3, "actorName": "John", "action": "MEETING_DELETED", "entityType": "Meeting", "entityId": 12, "timestamp": "2026-09-14T11:05:00Z" }
]
```

Each entry corresponds to one call to the backend's `log_activity` helper
([research.md](../research.md) item 11) — e.g., meeting/task create-edit-delete, member
add/role-change/password-reset/deactivate, a notification sent, a mention made, or an Azure DevOps
reference detected.
