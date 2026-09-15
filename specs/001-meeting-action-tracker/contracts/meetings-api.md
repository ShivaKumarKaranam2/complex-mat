# API Contract: Meetings & Attendees

Base path: `/api/meetings`. All request/response bodies are JSON, Pydantic models per constitution
Principle VI. Every endpoint requires `Authorization: Bearer <token>` (see
[auth-api.md](./auth-api.md)); the acting user's identity and Role/Owner status are derived from
that token server-side — never from a client-supplied name (superseding the earlier no-auth MVP
approach, per constitution v2.0.0 Principle V).

## `POST /api/meetings` — Create Meeting (User Story 2)

Requires `require_role(ADMIN)` — Team Members get `403 Forbidden` (FR-007).

**Request body** (`MeetingCreateRequest`):

```json
{
  "title": "Q3 Roadmap Review",
  "date": "2026-09-15",
  "time": "14:00",
  "agendaNotes": "Review Q3 milestones and blockers.",
  "attendeeIds": [7, 12, 15]
}
```

- `title`: string, required, non-empty.
- `date`, `time`: required (FR-008 prefills `date` client-side from the selected Calendar date).
- `agendaNotes`: optional free text.
- `attendeeIds`: array of active User ids, required, at least one entry.

**Responses**:
- `201 Created` → `MeetingSummaryResponse` (see list below), with `ownerId`/`ownerName` set to the
  caller (FR-010).
- `403 Forbidden` — caller is not an Admin.
- `422 Unprocessable Entity` — missing `title`/`date`/`time`, or an `attendeeIds` entry is not an
  active user.

## `GET /api/meetings` — List Meetings (Calendar + Previous Meetings, User Stories 1 & 8)

**Query parameters** (all optional): `month`, `year` (integers) — restrict to that month; omitted
returns all meetings visible to the caller (used by Previous Meetings).

Role-scoped (FR-014): an Admin receives every meeting; a Team Member receives only meetings where
they are listed as an Attendee.

**Response** `200 OK` → `MeetingSummaryResponse[]`:

```json
[
  { "id": 12, "title": "Q3 Roadmap Review", "date": "2026-09-15", "time": "14:00", "ownerId": 3, "ownerName": "John", "taskCount": 4 }
]
```

## `GET /api/meetings/{meeting_id}` — Meeting Details (User Story 3)

**Response** `200 OK` → `MeetingDetailResponse`:

```json
{
  "id": 12,
  "title": "Q3 Roadmap Review",
  "date": "2026-09-15",
  "time": "14:00",
  "agendaNotes": "Review Q3 milestones and blockers.",
  "ownerId": 3,
  "ownerName": "John",
  "attendees": [{ "id": 7, "employeeName": "Sarah Iyer" }],
  "tasks": [
    { "id": 101, "meetingId": 12, "title": "Prepare onboarding API design doc", "assigneeId": 7, "assigneeName": "Sarah Iyer", "dueDate": "2026-09-20", "status": "TODO", "needsReassignment": false }
  ]
}
```

**Errors**:
- `403 Forbidden` — a Team Member who is not an Attendee of this meeting (FR-014).
- `404 Not Found` — no meeting with that ID.

## `PATCH /api/meetings/{meeting_id}` — Edit Meeting (User Story 7)

Requires `require_role(ADMIN)` — any Admin, not only the Owner (FR-012).

**Request body** (`MeetingUpdateRequest`, all fields optional):

```json
{ "title": "Q3 Roadmap Review (rescheduled)", "date": "2026-09-16", "time": "15:00", "agendaNotes": "...", "attendeeIds": [7, 12] }
```

`ownerId` is never accepted on this endpoint — the Meeting Owner cannot be changed through Edit
Meeting (FR-010; it only ever changes via the deactivation-triggered transfer in
[users-api.md](./users-api.md)).

**Responses**:
- `200 OK` → updated `MeetingDetailResponse`.
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such meeting.
- `422 Unprocessable Entity` — an `attendeeIds` entry is not an active user.

**Side effect**: removing an Attendee who is the Assignee of one of this meeting's Tasks sets that
Task's `needsReassignment: true` rather than un-assigning it (FR-024).

## `DELETE /api/meetings/{meeting_id}` — Delete Meeting (User Story 7)

Requires `require_role(ADMIN)` — any Admin (FR-012).

**Responses**:
- `204 No Content` — the meeting and all of its Tasks (and their Comments/Azure DevOps references)
  are deleted in one transaction (FR-013); recorded as a single Activity Log entry.
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such meeting.
