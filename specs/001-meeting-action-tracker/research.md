# Phase 0 Research: Meeting Action Tracker (MAT)

Most technology choices are fixed by the ratified project constitution (React, FastAPI, local
database, REST). This phase resolves the concrete patterns needed to deliver the full BRD scope —
authentication/RBAC, Meeting Owner enforcement, comments/@mentions, Azure DevOps referencing, and
email notifications — on top of that stack. No `[NEEDS CLARIFICATION]` markers remain.

## 1. Local database engine

- **Decision**: SQLite, accessed through SQLAlchemy, as a single file under the backend project
  (e.g., `backend/mat.db`).
- **Rationale**: The constitution specifies a "local, file-based database." SQLite requires no
  separate server process and is sufficient for this scope's data volume; SQLAlchemy gives the
  repository layer a clean, swappable data-access boundary if a heavier database is needed later.
- **Alternatives considered**: A client/server database (PostgreSQL) — rejected as an unnecessary
  deployment dependency for the constitution's "local database" framing at this scale.

## 2. Backend web framework structure

- **Decision**: FastAPI with the layered structure Router → Service → Repository → SQLAlchemy
  models, using Pydantic models as the DTO layer at the router boundary.
- **Rationale**: Directly mandated by constitution Principle III. FastAPI's dependency-injection
  system (`Depends`) is used both for repository/service wiring and for the authentication/role
  guards described in item 3 below.
- **Alternatives considered**: N/A — framework is fixed by the constitution.

## 3. Authentication and role enforcement

- **Decision**: Password-based login (Employee Mail ID + Password) issuing a short-lived JWT access
  token, returned to the client and sent back as a `Bearer` token on every subsequent request. The
  backend hashes passwords with a modern KDF (e.g., bcrypt/argon2) — no password is ever stored or
  logged in plain text. A FastAPI dependency `get_current_user` decodes and validates the token and
  loads the `User`; a second dependency `require_role(Role.ADMIN)` (or similar) wraps it for
  Admin-only routers/endpoints (People, Activity Log, Create/Edit/Delete Meeting). Meeting-Owner-only
  actions (assigning/reassigning a Task's Assignee) are enforced as an explicit service-layer check
  (`meeting.owner_id == current_user.id`) rather than a role check, since ownership is per-meeting,
  not a role.
- **Rationale**: Constitution Principle V (as amended) requires Employee Mail ID/Password
  authentication and a two-role RBAC model; Principle VII requires these rules enforced in the
  backend, not just hidden UI controls. A stateless JWT keeps the API RESTful (Principle VI) without
  server-side session storage. Distinguishing "Role" (Admin/Team Member) from "Meeting Owner" (a
  per-meeting attribute) mirrors the BRD's explicit distinction between the two.
- **Alternatives considered**: Server-side session cookies — rejected as it adds session-store
  infrastructure with no benefit over a signed JWT at this scale; OAuth/SSO — explicitly out of
  scope per the BRD ("no self-registration... no external identity system").

## 4. Frontend auth/session state

- **Decision**: A React Context (`AuthContext`) holding the signed-in user (id, name, Role) and the
  JWT, backed by `sessionStorage` so a reload keeps the session but closing the tab/browser ends it.
  A route guard redirects unauthenticated visitors to Login, and a second guard hides/redirects
  Admin-only routes (People, Activity Log, Create/Edit Meeting entry points) for Team Members.
- **Rationale**: Centralizes "who is signed in and with what Role" in one place consumed by nav,
  route guards, and permission-gated UI (e.g., the assign-task control shown only to the Meeting
  Owner), consistent with constitution Principle II (API/session concerns isolated from
  presentation).
- **Alternatives considered**: `localStorage` for the token — rejected in favor of `sessionStorage`
  to avoid an indefinitely-persisted credential on a shared machine, consistent with the project's
  existing preference for session-scoped identity state.

## 5. Meeting Owner vs. Admin role enforcement

- **Decision**: `Meeting.owner_id` is set once, at creation, to the creating Admin's user id, and is
  never directly editable by any endpoint. Two independent backend checks exist: (a) "is an Admin"
  (Role check) gates create/edit/delete-meeting and most Task fields; (b) "is this meeting's Owner"
  (ownership check) additionally gates only the Task-Assignee field. A request from an Admin who is
  not the Owner attempting to set/change `Task.assignee_id` is rejected with 403 even though the
  same Admin can edit every other field on that meeting/task.
- **Rationale**: The BRD is explicit that "Admins may edit or delete any Meeting or Task
  workspace-wide, except changing a Task's Assignee" — this is a narrower, per-meeting authority
  layered on top of the Admin role, not a role of its own, so it cannot be modeled as a third Role
  value.
- **Alternatives considered**: Modeling "Meeting Owner" as a role — rejected, since it is per-meeting
  and every Admin can hold it for meetings they create, which a single global Role field cannot
  express.

## 6. Comment posting permissions, @mentions, and Azure DevOps reference detection

- **Decision**: A single regex-based parser runs over a Task's `title`, `description_notes`, and
  each `Comment.message` whenever they are written: a token matching `@[A-Za-z][\w]*` is treated as
  a member-mention candidate (resolved against that meeting's Attendees by display name), and a
  token matching `@\d+` is treated as an Azure DevOps reference candidate (the digits are the work
  item ID). Mentions are stored as normalized `(comment_id_or_task_id, mentioned_user_id)` rows at
  write time (for reliable notification and to avoid re-parsing on every read); Azure DevOps
  references are stored as normalized `(task_id, ado_id)` rows at write time, but their display
  title/type/availability is refreshed from the Azure DevOps API at read time (with a short cache)
  since that state can change outside MAT. Posting a comment is allowed only for the Task's parent
  Meeting's Owner, the Task's Assignee, or any Admin — enforced in the comment service before the
  parser ever runs.
- **Rationale**: Storing mentions/references at write time makes "who to notify" and "what's linked"
  cheap to query without re-parsing text on every request, while re-checking Azure DevOps
  availability at read time is what makes the "unavailable indicator" (FR-032) accurate even when an
  item is deleted after the reference was created. Digits-vs-letters immediately after `@` is the
  single disambiguation rule the BRD specifies, so one parser serves both concerns.
- **Alternatives considered**: Parsing only at read time — rejected, since notifying a mentioned
  member (FR-036) must happen once, at write time, not on every future read of the same comment.

## 7. Azure DevOps integration

- **Decision**: A dedicated `AzureDevOpsClient` service wraps the Azure DevOps REST API (work item
  lookup/search by ID and free-text, scoped by the connected organization/project) behind a small
  interface (`search(query, as_user)`, `get(work_item_id, as_user)`). All calls are wrapped so a
  timeout, auth failure, or non-2xx response from Azure DevOps is caught and translated into "no
  suggestions" or "unavailable" rather than propagating as a MAT-level error — satisfying "MAT
  remains usable if Azure DevOps is temporarily unavailable" (FR-033). Referencing a work item is
  strictly read-only: MAT never calls a create/update endpoint against Azure DevOps.
- **Rationale**: Isolating all Azure DevOps calls behind one client keeps the rest of the backend
  unaware of Azure DevOps-specific failure modes and makes the "read-only, never duplicates a work
  item" rule (FR-031) trivially true — there is simply no write method on the client to call.
- **Alternatives considered**: Calling the Azure DevOps SDK directly from the task service —
  rejected as it would spread external-API error handling and auth details across business logic,
  conflicting with constitution Principle IX (single clear responsibility per module).

## 8. Email notifications

- **Decision**: A `NotificationService` with one method per triggering event (task assigned, comment
  posted, mention made) that composes the message and hands it to an `EmailSender` interface (an
  SMTP-backed implementation for this project), invoked via FastAPI `BackgroundTasks` so the HTTP
  response for the triggering action (assign/comment/mention) is never delayed or failed by email
  delivery. A delivery failure is caught and logged inside the background task, never raised back
  into the request that triggered it.
- **Rationale**: Directly satisfies "email delivery failure never loses or blocks the underlying
  operation" (FR-038) — the triggering database write has already committed before the background
  email task runs. A single `NotificationService` entry point per event keeps "what to include in
  the email" (FR-037) defined in one place rather than duplicated at each call site.
- **Alternatives considered**: Sending email synchronously in the request path — rejected, since an
  SMTP timeout or error would then risk blocking or failing the task/comment/mention operation
  itself, directly violating FR-038.

## 9. Internal member search

- **Decision**: A simple case-insensitive substring query (SQL `LIKE`) over `employee_name` and
  `employee_id`, scoped to all active users for Attendee search and to a given meeting's Attendees
  for Assignee search — no full-text search engine.
- **Rationale**: Matches the BRD's description of a simple name/ID lookup at internal-workspace
  scale; a dedicated search engine would be disproportionate infrastructure for this data volume,
  conflicting with constitution Principle IX (avoid premature complexity).
- **Alternatives considered**: A dedicated search index (e.g., Elasticsearch) — rejected as
  unjustified complexity at this scale.

## 10. Meeting Owner continuity on deactivation

- **Decision**: The workspace has exactly one configured "default Admin" (a `Settings`/config row
  referencing a `User.id`, set by seed/initial setup rather than through a dedicated UI in this
  scope). Deactivating a user is a single service-layer operation that, if that user owns any
  Meetings, reassigns `Meeting.owner_id` to the configured default Admin for every one of them, in
  the same transaction as the deactivation.
- **Rationale**: The BRD requires automatic ownership transfer "to the workspace's configured
  default Admin" on Meeting-Owner deactivation (FR-040); doing the reassignment in the same
  transaction as the deactivation avoids a window where meetings are ownerless.
- **Alternatives considered**: Leaving `owner_id` null until manually reassigned — rejected, since
  the BRD requires the transfer to be automatic, not a follow-up manual step.

## 11. Activity Log

- **Decision**: An append-only `ActivityLogEntry` table, written by a single `log_activity(actor,
  action, entity_type, entity_id)` service-layer helper called at the end of each significant
  service method (meeting/task create-edit-delete, member add/role-change/password-reset/deactivate,
  notification sent, mention made, Azure DevOps reference detected) — never written directly by a
  router.
- **Rationale**: A single helper, called from the service layer where the business action already
  succeeded, guarantees the log reflects what actually happened without duplicating logging logic
  per endpoint, and keeps routers free of business/audit logic per constitution Principle III.
- **Alternatives considered**: Deriving the Activity Log from a generic request-level middleware —
  rejected, since it cannot easily express "which business action" occurred (e.g., distinguishing a
  role change from a password reset, both `PATCH /users/{id}`) as precisely as an explicit call site.

## 12. Frontend drag-and-drop and calendar

- **Decision**: A hand-built month-grid component (no calendar library) for Calendar/Create Meeting
  date selection, and a lightweight, actively-maintained drag-and-drop library (e.g.,
  `@dnd-kit/core`) for the Task Board/My Tasks columns, paired with an always-available non-drag
  status control on each card.
- **Rationale**: Unchanged from the original MVP research — the calendar and Kanban requirements
  themselves did not change in the full-BRD scope, only who may create/edit meetings and what a task
  carries.
- **Alternatives considered**: See original rationale — a calendar library and `react-beautiful-dnd`
  were both rejected as heavier than needed / unmaintained, respectively.

## 13. Testing approach

- **Decision**: Backend — pytest with FastAPI's `TestClient`, one contract test per endpoint plus
  integration tests per business rule and user story (including Role-gated and Owner-gated access,
  mention/Azure DevOps token disambiguation, and the notification-never-blocks-the-action guarantee,
  simulated by injecting a failing `EmailSender`). Frontend — Vitest + React Testing Library for the
  calendar, task board drag-and-drop, Role-gated navigation/UI, and the `@`-trigger
  mention-vs-Azure-DevOps-suggestion behavior in text inputs.
- **Rationale**: Matches constitution Principle X and the spec's Given/When/Then acceptance
  scenarios, which map directly onto integration tests, including the newly added Role/Owner and
  external-integration-resilience cases.
- **Alternatives considered**: End-to-end browser testing (e.g., Playwright) — not ruled out later,
  not required to satisfy Principle X at this scope.
