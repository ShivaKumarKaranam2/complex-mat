from fastapi.testclient import TestClient

from app.models.user import Role


def _create_meeting(client, headers, attendee_ids):
    response = client.post(
        "/api/meetings",
        json={
            "title": "Q3 Roadmap Review",
            "date": "2026-09-15",
            "time": "14:00",
            "attendeeIds": attendee_ids,
        },
        headers=headers,
    )
    return response.json()["id"]


def test_owner_can_create_task_assigned_to_attendee(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={
            "title": "Prepare onboarding design doc",
            "assigneeId": attendee.id,
            "descriptionNotes": "See related notes.",
            "dueDate": "2026-09-20",
        },
        headers=auth_header(owner),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Prepare onboarding design doc"
    assert body["assigneeId"] == attendee.id
    assert body["status"] == "TODO"


def test_non_owner_admin_cannot_create_task(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    other_admin, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Some task", "assigneeId": attendee.id},
        headers=auth_header(other_admin),
    )

    assert response.status_code == 403


def test_create_task_missing_title_is_rejected(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"assigneeId": attendee.id},
        headers=auth_header(owner),
    )

    assert response.status_code == 422


def test_create_task_with_non_attendee_assignee_is_rejected(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    outsider, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Some task", "assigneeId": outsider.id},
        headers=auth_header(owner),
    )

    assert response.status_code == 422


def test_create_task_on_unknown_meeting_returns_404(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)

    response = client.post(
        "/api/meetings/999999/tasks",
        json={"title": "Some task", "assigneeId": owner.id},
        headers=auth_header(owner),
    )

    assert response.status_code == 404
