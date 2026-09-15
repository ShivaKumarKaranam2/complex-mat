# API Contract: Task Comments, @Mentions, and Notifications

Base path: `/api/tasks/{task_id}/comments`. Requires `Authorization: Bearer <token>`. Also covers
the mention-search endpoint used while typing "@" followed by letters.

## `GET /api/tasks/{task_id}/comments` — List Comments (User Story 5)

**Response** `200 OK` → `CommentResponse[]`:

```json
[
  {
    "id": 55,
    "taskId": 101,
    "authorId": 3,
    "authorName": "John",
    "message": "Can @Sarah confirm this lines up with @1234?",
    "mentions": [{ "userId": 7, "employeeName": "Sarah Iyer" }],
    "adoReferences": [{ "adoWorkItemId": 1234, "title": "Implement customer onboarding API", "type": "Story", "isAvailable": true }],
    "createdAt": "2026-09-14T10:00:00Z"
  }
]
```

## `POST /api/tasks/{task_id}/comments` — Post Comment (User Story 5)

Allowed only for the parent Meeting's Owner, this Task's Assignee, or any Admin (FR-027) — anyone
else gets `403 Forbidden`.

**Request body** (`CommentCreateRequest`): `{ "message": "Can @Sarah confirm this lines up with @1234?" }`

**Responses**:
- `201 Created` → `CommentResponse` (shape above). On creation the message is parsed
  ([research.md](../research.md) item 6):
  - each `@<letters>` token resolved against the parent Meeting's Attendees becomes a
    `CommentMention` and triggers an email to that member (FR-036), independent of any assignee
    notification for the same comment;
  - each `@<digits>` token becomes/updates a `TaskAdoReference` on the parent Task (FR-030).
  - unless the author **is** the Task's Assignee, the Assignee also receives a comment-notification
    email (FR-035); email delivery failures never affect this response (FR-038).
- `403 Forbidden` — caller is not the Meeting Owner, the Assignee, or an Admin.
- `404 Not Found` — no such task.
- `422 Unprocessable Entity` — empty `message`.

## `GET /api/meetings/{meeting_id}/attendees/mention-search` — Mention Suggestions (User Story 5)

Backs the "@" + letters dropdown while typing in a Task's Title, Description/Notes, or a Comment.

**Query parameters**: `q` (string, optional) — substring match against Attendee `employeeName`.

**Response** `200 OK` → `UserResponse[]`, restricted to that meeting's Attendees only (FR-028) — not
a workspace-wide member search (compare [users-api.md](./users-api.md), which is workspace-wide).
