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


def _create_task(client, headers, meeting_id, assignee_id):
    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Task to delete", "assigneeId": assignee_id},
        headers=headers,
    )
    return response.json()["id"]


def test_admin_can_delete_task(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    other_admin, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])
    task_id = _create_task(client, auth_header(owner), meeting_id, attendee.id)

    response = client.delete(f"/api/tasks/{task_id}", headers=auth_header(other_admin))

    assert response.status_code == 204

    detail = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(owner)).json()
    assert all(task["id"] != task_id for task in detail["tasks"])


def test_assignee_cannot_delete_task(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])
    task_id = _create_task(client, auth_header(owner), meeting_id, attendee.id)

    response = client.delete(f"/api/tasks/{task_id}", headers=auth_header(attendee))

    assert response.status_code == 403


def test_delete_unknown_task_returns_404(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)

    response = client.delete("/api/tasks/999999", headers=auth_header(admin))

    assert response.status_code == 404
