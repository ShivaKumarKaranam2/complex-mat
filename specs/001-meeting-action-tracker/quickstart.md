# Quickstart Validation Guide: Meeting Action Tracker (MAT)

This guide describes how to run MAT end-to-end and manually validate that each user story from
[spec.md](./spec.md) actually works, once implementation exists. It intentionally does not include
model/service/controller code — see [data-model.md](./data-model.md) and [contracts/](./contracts)
for those details, and `tasks.md` (from `/speckit-tasks`) for the implementation breakdown.

## Prerequisites

- Python 3.11+ and `pip` (backend); Node.js 18+ and `npm` (frontend).
- No external services strictly required to run MAT itself — the backend uses a local SQLite file,
  created automatically on first run. Email notifications and Azure DevOps suggestions degrade
  gracefully (logged/empty-result, respectively) without a configured SMTP server or Azure DevOps
  connection, per FR-033/FR-038 — configure both for full end-to-end validation of scenarios 5 and
  6 below.
- A seed step creates the first Admin account and designates it as the workspace's configured
  default Admin (see [data-model.md](./data-model.md) `WorkspaceSettings`), since there is no
  self-registration.

## Setup

```bash
# Backend
cd backend
python -m venv .venv && . .venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python -m app.seed   # creates the first Admin (e.g., john@example.com) as the default Admin
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open the frontend's dev URL (e.g., `http://localhost:5173`) in two different browser profiles or
windows (private/incognito for the second) to simulate two different people/sessions.

## Validation scenarios

### 1. Sign in and Role-based access (User Story 1)

1. Open Window A. Sign in as the seeded Admin (`john@example.com`) via either sign-in option.
2. Confirm Calendar, My Tasks, Previous Meetings, People, and Activity Log are all reachable.
3. In Window B, sign in as a Team Member account (created in scenario 8 below) and confirm People
   and Activity Log are not reachable, regardless of which sign-in option was used.

**Expected outcome**: Access matches the account's actual Role, not the sign-in option clicked
(SC-001, FR-002).

### 2. Admin creates a meeting and becomes its Owner (User Story 2)

1. In Window A (Admin `John`), click a date on Calendar — confirm Create Meeting opens with that
   date prefilled (FR-008).
2. Complete Title `Q3 Roadmap Review`, Time, Attendees (search and add `Sarah`), Agenda/Notes, and
   save.
3. Try saving with the title blank on a fresh attempt — confirm it is rejected (FR-009).
4. Open the saved meeting's details and confirm `John` is shown as Meeting Owner.

**Expected outcome**: Only Admins can create meetings; the creator becomes Meeting Owner; the
meeting is immediately visible in another permitted session (SC-002, SC-003, FR-007, FR-010,
FR-043).

### 3. Meeting Owner assigns and manages tasks (User Story 3)

1. Still as `John` (this meeting's Owner), add a task titled `Prepare onboarding API design doc`,
   assigned to `Sarah`, with a Due Date.
2. Confirm it appears in "To Do" (FR-019).
3. As a **different** Admin (not the Owner), open the same meeting and confirm the Assignee field
   on a task cannot be set/changed, even though other meeting fields remain editable (FR-016).
4. Attempt to assign a task to someone who is not an attendee — confirm it is rejected (FR-017).
5. Deactivate `Sarah` from People (see scenario 8) and confirm her existing task keeps its
   assignment but is flagged as needing reassignment (FR-024).

**Expected outcome**: Only the Meeting Owner controls task assignment; assignment is restricted to
attendees; deactivation flags rather than silently reassigns.

### 4. Team Member works their own tasks (User Story 4)

1. Sign in as `Sarah` (Team Member) in Window B; open My Tasks.
2. Confirm only tasks assigned to her appear, each labelled with its meeting's name (FR-025).
3. Drag her task from "To Do" to "In Progress"; confirm the change is visible from Window A's view
   of the same meeting's Task Board (FR-021, FR-043).
4. Edit the task's Description/Notes as `Sarah` — confirm it saves, but Title/Due Date/Assignee
   remain unchanged and there is no delete control available to her (FR-022, FR-023).
5. From Window A, attempt to change the status of Sarah's task — confirm it is rejected (FR-021).

**Expected outcome**: My Tasks is scoped to the signed-in user; both drag-and-drop and a direct
status control work; only the Assignee can change status or edit Description/Notes.

### 5. Comments, @mentions, and Azure DevOps references (User Story 5)

1. On the task from scenario 3, as `John` (Owner) post a comment: `Can @Sarah confirm this lines up
   with @1234?`
2. Confirm `@Sarah` renders as a member mention (resolved against this meeting's attendees) and
   `@1234` renders as a distinct Linked Azure DevOps Item, `ADO #1234 — <title>`, with its own "Open
   in Azure DevOps" action (FR-028, FR-029, FR-030).
3. As someone who is neither the Owner, the Assignee, nor an Admin, attempt to post a comment on
   this task — confirm it is rejected (FR-027).
4. Simulate the referenced work item becoming unavailable (delete/rename it in Azure DevOps, or
   point at a nonexistent ID) and reload the task — confirm the reference still shows with an
   "unavailable" indicator and a disabled Open action (FR-032).

**Expected outcome**: Mentions and Azure DevOps references are correctly disambiguated and
displayed; posting is permission-gated; unavailable references degrade gracefully.

### 6. Email notifications (User Story 6)

1. With a configured (or test/log-capturing) SMTP setup, repeat the task assignment from scenario 3
   — confirm `Sarah` receives an assignment email (FR-034).
2. Repeat the comment from scenario 5 (posted by `John`, who is not the Assignee) — confirm `Sarah`
   (the Assignee) receives a comment email containing task, meeting, sender, due date, and comment
   content (FR-035, FR-037), and confirm the mentioned member (if different from the Assignee)
   separately receives a mention email (FR-036).
3. Have `Sarah` post a comment on her own task — confirm she does **not** receive a
   comment-notification email for her own comment.
4. Temporarily point the email configuration at an unreachable server and repeat step 1 — confirm
   the task assignment itself still succeeds (FR-038).

**Expected outcome**: The right recipients are notified for the right reasons, self-authored
comments don't self-notify, and email failures never block the underlying action.

### 7. Admin edits or deletes a meeting (User Story 7)

1. As an Admin who is **not** this meeting's Owner, open Edit Meeting and change the Agenda/Notes
   and Time — confirm it saves (FR-012).
2. Remove `Sarah` as an attendee via Edit Meeting while she still has an assigned task — confirm
   that task is flagged as needing reassignment rather than silently reassigned (FR-024 via edit).
3. Delete the meeting — confirm all of its tasks (and their comments/references) are gone, including
   from Sarah's My Tasks, and that the deletion appears once in the Activity Log (FR-013, scenario
   10 below).

**Expected outcome**: Any Admin can edit/delete any meeting; deletion cascades; attendee removal
flags rather than reassigns.

### 8. Browse Previous Meetings, scoped by Role (User Story 8)

1. Create a second meeting that does **not** include `Sarah` as an attendee.
2. As `Sarah` (Team Member), open Previous Meetings — confirm only meetings she's invited to appear
   (FR-014, FR-039).
3. As an Admin, open Previous Meetings — confirm every meeting appears, each with an accurate,
   live task count (SC-009, FR-039).

**Expected outcome**: Previous Meetings is Role-scoped and its task counts stay accurate.

### 9. Admin manages People (User Story 9)

1. As an Admin, open People and add a new member (`Priya`, Team Member Role).
2. Sign in as `Priya` with the given credentials — confirm she has Team-Member-level access
   (FR-004).
3. As the Admin, change `Priya`'s Role to Admin — confirm she has Admin-level access on her next
   sign-in (FR-005).
4. Reset `Priya`'s password and confirm she must use the new password to sign in.
5. Deactivate `Priya` and confirm she can no longer sign in and no longer appears in attendee/
   assignee search (FR-006).
6. Make `Priya` (while still active) the Owner of a meeting, then deactivate her — confirm that
   meeting's ownership transfers automatically to the configured default Admin (FR-040, SC-010).

**Expected outcome**: Only Admins reach People; role/password/active changes take effect
immediately; Owner deactivation transfers ownership automatically.

### 10. Admin reviews the Activity Log (User Story 10)

1. As a Team Member, confirm Activity Log is not reachable (FR-042).
2. As an Admin, open Activity Log after performing the actions above (meeting create/edit/delete,
   task assignment, member add/role-change/deactivate) — confirm each appears with actor and
   timestamp (FR-041).

**Expected outcome**: The Activity Log is Admin-only and reflects the business actions performed.

### 11. Responsive layout

1. Resize the browser (or use device emulation) to a common mobile width (e.g., 375px) and a common
   desktop width (e.g., 1280px+).
2. Repeat scenarios 1–5 at both widths.

**Expected outcome**: All controls remain reachable and usable at both widths, with no horizontal
scrolling required to access primary content (SC-008, FR-044).

## Automated coverage

The scenarios above correspond directly to the acceptance scenarios in spec.md and should be backed
by:
- Backend contract tests (one per endpoint in `contracts/`) and integration tests per business rule
  (Role-gated actions, Owner-only assignment, Assignee-only status/description edits, mention/ADO
  disambiguation, notification-never-blocks-the-action, Owner-deactivation transfer, cascading
  deletes).
- Frontend tests for the calendar grid/navigation, Role-gated navigation and forms, the task board's
  drag-and-drop plus direct status control, and the `@`-trigger mention-vs-Azure-DevOps-suggestion
  behavior in text inputs.
