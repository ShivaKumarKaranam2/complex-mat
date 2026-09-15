# API Contract: Tasks

Base path: `/api/meetings/{meeting_id}/tasks` for creation; `/api/tasks/{task_id}` for operations on
an existing task; `/api/tasks` for the My Tasks query. All DTOs are Pydantic models per constitution
Principle VI. Every endpoint requires `Authorization: Bearer <token>`; permission checks compare the
authenticated caller's `user.id`/`role` against `Meeting.owner_id` / `Task.assignee_id` server-side
— never a client-supplied name (see [meetings-api.md](./meetings-api.md) header note).

## `POST /api/meetings/{meeting_id}/tasks` — Create Task (User Story 3)

Requires `require_role(ADMIN)` (creating a task's fixed fields is an Admin/Owner action).

**Request body** (`TaskCreateRequest`):

```json
{ "title": "Prepare onboarding API design doc", "descriptionNotes": "See @1234 for related work.", "assigneeId": 7, "dueDate": "2026-09-20" }
```

- `title`: string, required, non-empty.
- `assigneeId`: required — must be an Attendee of `meeting_id` (FR-017); **only accepted from the
  meeting's Owner** — an Admin who is not the Owner gets `403 Forbidden` on this field (FR-016).
- `descriptionNotes`, `dueDate`: optional.

**Responses**:
- `201 Created` → `TaskResponse` (see Meeting Details shape); `status` is always `"TODO"`
  regardless of any client-sent value (FR-019); any `@Name`/`@<number>` tokens in `title`/
  `descriptionNotes` are parsed into `CommentMention`/`TaskAdoReference` rows and trigger
  notifications per [comments-api.md](./comments-api.md).
- `403 Forbidden` — caller is not this meeting's Owner, or `assigneeId` is set by a non-Owner Admin.
- `404 Not Found` — no such meeting.
- `422 Unprocessable Entity` — missing `title`, or `assigneeId` is not an attendee of the meeting.

## `PATCH /api/tasks/{task_id}` — Edit Task (User Stories 3 & 4)

A single endpoint whose accepted fields depend on the caller's relationship to the task, enforced
server-side (FR-016, FR-022):

- The meeting's **Owner**: may set `title`, `dueDate`, `assigneeId` (validated against Attendees).
- Any other **Admin**: may set `title`, `dueDate`, but **not** `assigneeId` (403 if attempted).
- The task's **Assignee**: may set only `descriptionNotes` (any other field in the body → 403).

**Request body** (`TaskUpdateRequest`, all fields optional):

```json
{ "title": "Prepare onboarding API design + review notes", "assigneeId": 12 }
```

**Responses**:
- `200 OK` → updated `TaskResponse`.
- `403 Forbidden` — caller attempts a field they are not permitted to change.
- `404 Not Found` — no such task.
- `422 Unprocessable Entity` — `assigneeId` provided but not an attendee of the task's meeting.

This endpoint does not accept `status` — status changes go through the dedicated endpoint below.

## `DELETE /api/tasks/{task_id}` — Delete Task (User Story 3)

Requires `require_role(ADMIN)` — never available to the Assignee alone (FR-023).

**Responses**:
- `204 No Content` — deleted, along with its Comments and Azure DevOps reference rows.
- `403 Forbidden` — caller is not an Admin.
- `404 Not Found` — no such task.

## `PATCH /api/tasks/{task_id}/status` — Update Task Status (User Story 4)

Used by both drag-and-drop and the direct status control (FR-021) — both call this same endpoint.

**Request body** (`TaskStatusUpdateRequest`): `{ "status": "IN_PROGRESS" }`

**Responses**:
- `200 OK` → updated `TaskResponse`.
- `403 Forbidden` — caller is not this task's Assignee.
- `404 Not Found` — no such task.
- `422 Unprocessable Entity` — `status` is not one of `TODO`/`IN_PROGRESS`/`COMPLETED`.

## `GET /api/tasks/mine` — My Tasks (User Story 4)

Uses the authenticated caller's own id — there is no `assigneeName`/`assigneeId` query parameter,
since identity now comes from the token, not client-supplied data.

**Response** `200 OK` → `TaskWithMeetingResponse[]`:

```json
[
  { "id": 101, "meetingId": 12, "meetingTitle": "Q3 Roadmap Review", "title": "Prepare onboarding API design doc", "dueDate": "2026-09-20", "status": "IN_PROGRESS", "needsReassignment": false }
]
```

Includes `meetingTitle` so each card can be labelled with its parent meeting (FR-025).
