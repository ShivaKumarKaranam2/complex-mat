# API Contract: Azure DevOps References

Base path: `/api/azure-devops`. Requires `Authorization: Bearer <token>`. All calls proxy through
the backend's `AzureDevOpsClient` ([research.md](../research.md) item 7) — the frontend never calls
Azure DevOps directly, so the "scoped to the current user's own access" rule (FR-029) is enforced
server-side using the caller's own linked Azure DevOps identity/permissions.

## `GET /api/azure-devops/suggestions` — Work Item Suggestions (User Story 5)

Backs the "@" + digits dropdown while typing in a Task's Title, Description/Notes, or a Comment.

**Query parameters**: `q` (string, required) — the digits typed after `@` (a work item ID prefix).

**Response** `200 OK` → `AdoSuggestionResponse[]`, each with enough information to distinguish items
(FR-029):

```json
[{ "adoWorkItemId": 1234, "title": "Implement customer onboarding API", "type": "Story" }]
```

- Results are limited to Stories and Features, scoped to the current user's own Azure DevOps access
  (spec Assumptions: other work item types are out of scope).
- If Azure DevOps is unreachable or the call fails, this endpoint returns `200 OK` with an empty
  array rather than an error — MAT stays usable, only lookups are affected (FR-033).

## `GET /api/tasks/{task_id}/ado-references` — Linked Azure DevOps Items (User Story 5)

Returns every `TaskAdoReference` for a Task, with `isAvailable` refreshed against Azure DevOps at
read time (subject to a short cache, per [research.md](../research.md) item 6).

**Response** `200 OK` → `AdoReferenceResponse[]`:

```json
[
  { "adoWorkItemId": 1234, "title": "Implement customer onboarding API", "type": "Story", "isAvailable": true, "openUrl": "https://dev.azure.com/.../workitems/edit/1234" }
]
```

- `isAvailable: false` (item deleted, inaccessible, or invalid) → `openUrl` is `null` and the
  frontend disables "Open in Azure DevOps," while `title`/`type` continue to show their last-known
  cached values (FR-032).

## Out of scope for this contract

There is no endpoint to create, edit, or delete an Azure DevOps work item from MAT (FR-031) — every
route above is read-only.
