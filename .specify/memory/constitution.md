<!--
Sync Impact Report
===================
Version change: 1.0.0 → 2.0.0
Rationale for MAJOR: Principle V is redefined in a backward-incompatible way. It previously
PROHIBITED login, password authentication, sessions/tokens, and Admin/User role-based access
control for the MVP. It now REQUIRES all of them, per the project's Business Requirements
Document (BRD), which is adopted here as the authoritative scope for this project — the earlier
MVP identity simplification is superseded.

Modified principles:
  - V. Simplified Identity for MVP → V. Authenticated, Role-Based Identity (BRD-Aligned)

Added sections: None (existing section structure retained).

Removed sections: None.

Deviation from user-supplied source text: None for this amendment.

Deferred / TODO placeholders: None. All bracketed template tokens have been replaced.

Templates requiring follow-up review (not modified by this command; read constitution at runtime):
  - .specify/templates/plan-template.md — verify Constitution Check references reflect the new
    Principle V (auth/RBAC now required, not prohibited).
  - .specify/templates/spec-template.md — no direct dependency expected.
  - .specify/templates/tasks-template.md — verify task categorization accounts for an auth/RBAC
    layer, People/Admin screens, and Meeting Owner enforcement.
  - specs/001-meeting-action-tracker/spec.md, plan.md, data-model.md, contracts/, research.md,
    quickstart.md — written against the superseded MVP identity model; require regeneration
    against the full BRD scope now that Principle V permits/requires auth and roles.
-->

# Meeting Action Tracker (MAT) Constitution

## Core Principles

### I. Frontend-Backend Separation
The React frontend and the Python FastAPI backend MUST be developed, deployed, and versioned as
independent applications. They MUST communicate exclusively over well-defined REST APIs — no
direct database access, shared in-process modules, or shared runtime state between the two.
**Rationale**: Independent deployability and a clear contract boundary keep the two codebases
testable in isolation and prevent hidden coupling that makes changes on one side silently break
the other.

### II. React Component-Based Frontend Architecture
Frontend code MUST be organized as small, composable, reusable React components. All API
communication MUST be isolated into dedicated service modules or custom hooks (e.g.,
`src/services/*`, `src/hooks/use*`) — components MUST NOT call `fetch`/HTTP clients directly, and
MUST NOT contain business logic that belongs in the backend. Presentation, state management, and
API-access concerns MUST be separated within the component tree.
**Rationale**: A component-based structure with isolated API-access services keeps the UI
testable, makes API changes low-blast-radius, and prevents business logic from leaking into the
presentation layer.

### III. FastAPI Layered Backend Architecture
Backend code MUST follow a strict layered architecture: **Router (API endpoint) → Service
(business logic) → Repository (data access) → Database**. Each layer MUST depend only on the
layer directly beneath it — routers MUST NOT contain business logic or direct data-access code,
and repositories MUST NOT contain business rules. Cross-layer shortcuts (e.g., a router calling
the repository directly) are NOT permitted.
**Rationale**: A layered structure isolates concerns, makes business rules independently
testable without a database or HTTP layer, and keeps data-access details swappable.

### IV. Centralized Data Ownership
All shared application data (meetings, participants, action items, statuses, and any other data
visible to more than one user or session) MUST be persisted in the central backend database.
Browser-only storage (`localStorage`, `sessionStorage`, `IndexedDB`, cookies) MUST NOT be used as
the primary or source-of-truth store for application data — it MAY only be used for transient,
per-device UI convenience (e.g., a collapsed sidebar state) that has no effect on shared data
correctness.
**Rationale**: Centralized storage guarantees every user and session sees consistent, durable
data and avoids divergent, unrecoverable client-side state.

### V. Authenticated, Role-Based Identity (BRD-Aligned)
The system MUST require Employee Mail ID and Password authentication before any workspace access.
There MUST be no self-registration: a user account (Employee Name, Employee Mail ID, Employee ID,
Password, Role) MUST be created only by an Admin, from the People screen. Every user MUST have
exactly one of exactly two roles — Admin or Team Member — set at registration and changeable only
by an Admin afterward. The Login screen MAY present Team Member and Admin sign-in as visually
separate options, but both MUST validate the same Employee Mail ID/Password pair, and the
resulting access MUST be determined solely by the account's actual Role, never by which option was
clicked. Role-based access control MUST be enforced in the backend (per Principle VII), such that
each role can only perform the actions the BRD permits for it. Independently of Role, a Meeting's
creator MUST be recorded as that meeting's Meeting Owner, and only that Meeting Owner MUST be
permitted to assign or reassign the meeting's Task assignees — this authority MUST NOT be granted
by Admin role alone.
**Rationale**: The BRD is the authoritative scope for this project and requires controlled account
provisioning, two-tier role separation, and a distinct per-meeting ownership right so that
accountability for a meeting's task assignments is unambiguous. This supersedes the earlier MVP
simplification, which deliberately deferred auth/RBAC; that deferral is no longer in effect.

### VI. RESTful API Contracts
All backend endpoints MUST follow REST conventions (resource-oriented URLs, correct HTTP verbs
and status codes). Every endpoint MUST define explicit request and response DTOs (Pydantic
models) — handlers MUST NOT accept or return raw dicts or ORM/database models directly across the
API boundary.
**Rationale**: Explicit DTOs give the frontend a stable, self-documenting contract and let the
backend evolve its internal data model without breaking API consumers.

### VII. Backend-Enforced Business Rules
All business rules and validation (e.g., required fields, status transitions, ownership checks,
uniqueness constraints) MUST be enforced in the backend service layer. The frontend MAY duplicate
validation for UX responsiveness, but MUST NOT be relied upon as the sole enforcement point.
New features MUST NOT introduce behavior that violates existing, documented business rules
without an explicit constitution or spec amendment.
**Rationale**: Client-side-only validation can be bypassed (direct API calls, browser tools);
correctness and data integrity must not depend on client behavior.

### VIII. Responsive UI
The application MUST render correctly and remain fully usable on both desktop and mobile viewport
sizes. Layouts MUST use responsive techniques (fluid grids, breakpoints, flexible components)
rather than device-specific forks of the UI.
**Rationale**: Meeting participants need to record and review action items from whatever device
they have at hand.

### IX. Code Quality & Maintainability
Code on both frontend and backend MUST be modular, readable, and maintainable: functions and
components MUST have a single clear responsibility, naming MUST be descriptive, and duplication
MUST be refactored into shared utilities/services once it appears more than once with the same
intent. Code MUST be structured to be independently testable (no hidden global state, no
hard-to-mock direct external calls inside business logic).
**Rationale**: A small MVP team benefits far more from consistently readable, testable code than
from clever or premature abstraction.

### X. Testing Discipline
Automated tests MUST cover critical business workflows (e.g., creating a meeting, assigning and
completing action items, status transitions) and MUST cover API behavior (request validation,
success responses, error responses) at the endpoint level. A feature MUST NOT be considered done
until its critical-path behavior and the business rules it touches are covered by tests.
**Rationale**: Test coverage of business workflows and API contracts is what allows the team to
change code confidently without manually re-verifying the whole application.

## Technology Stack & Constraints

- **Frontend**: React (component-based SPA).
- **Backend**: Python, FastAPI, following the layered architecture in Principle III.
- **Database**: A local, file-based database (e.g., SQLite or an equivalent local database
  engine) serves as the single source of truth for all shared application data, per Principle IV.
- **Communication**: REST APIs over HTTP(S) only, per Principles I and VI; no GraphQL, gRPC, or
  direct DB access from the frontend.
- **Identity**: Employee Mail ID/Password authentication with Admin-provisioned accounts and a
  two-role (Admin, Team Member) access model, per Principle V. Session/token mechanics are an
  implementation detail of this requirement, not a separate opt-in.

## Development Workflow & Quality Gates

- Every pull request MUST be checked against the Core Principles above before merge; a reviewer
  MUST reject changes that put business logic in the frontend, bypass the layered backend
  architecture, or introduce browser-storage-as-source-of-truth patterns.
- Every new or changed API endpoint MUST include/update its request and response DTOs and MUST
  include endpoint-level tests (success and validation/error paths) before merge.
- Every new or changed business workflow MUST include/update tests covering its critical path
  before merge.
- UI changes MUST be checked at both a desktop and a mobile viewport width before merge.
- Complexity that appears to conflict with a principle (e.g., a proposed exception to the layered
  architecture) MUST be explicitly justified in the PR description or spec, or MUST instead be
  resolved through a constitution amendment.

## Governance

This constitution supersedes any conflicting team practice, spec, or plan for the MAT project.
Where a spec, plan, or task list conflicts with a principle in this document, the constitution
governs unless the constitution itself is first amended.

**Amendment procedure**: Amendments are proposed by editing this file (via `/speckit-constitution`
or an equivalent reviewed change), describing the change and rationale, and securing agreement
from the project's maintainer(s) before merge. Every amendment MUST update the Sync Impact Report
at the top of this file and the version/date footer below.

**Versioning policy**: This constitution follows semantic versioning:
- **MAJOR** — backward-incompatible governance changes, or removal/redefinition of a principle.
- **MINOR** — a new principle or section added, or an existing principle materially expanded.
- **PATCH** — clarifications, wording fixes, or non-semantic refinements.

**Compliance review**: All feature plans and pull requests MUST verify compliance with this
constitution (see Development Workflow & Quality Gates above). Any exception MUST be documented
with its justification at the point of use; undocumented deviations MUST be treated as defects.

**Version**: 2.0.0 | **Ratified**: 2026-09-13 | **Last Amended**: 2026-09-13
