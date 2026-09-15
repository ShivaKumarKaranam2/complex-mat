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


def test_owner_assigns_task_and_it_defaults_to_todo(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee.id])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Prepare notes", "assigneeId": attendee.id, "status": "COMPLETED"},
        headers=auth_header(owner),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["assigneeId"] == attendee.id
    assert body["status"] == "TODO"

    detail = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(owner)).json()
    assert any(task["id"] == body["id"] and task["status"] == "TODO" for task in detail["tasks"])


def test_a_different_admin_cannot_change_the_assignee_of_the_owners_task(
    client: TestClient, make_user, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    other_admin, _ = make_user(role=Role.ADMIN)
    attendee_a, _ = make_user(role=Role.TEAM_MEMBER)
    attendee_b, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [attendee_a.id, attendee_b.id])

    created = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Prepare notes", "assigneeId": attendee_a.id},
        headers=auth_header(owner),
    ).json()

    forbidden = client.patch(
        f"/api/tasks/{created['id']}",
        json={"assigneeId": attendee_b.id},
        headers=auth_header(other_admin),
    )
    assert forbidden.status_code == 403

    unchanged = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(owner)).json()
    assert any(
        task["id"] == created["id"] and task["assigneeId"] == attendee_a.id
        for task in unchanged["tasks"]
    )


def test_assignment_is_rejected_for_a_non_attendee(client: TestClient, make_user, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    outsider, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(owner), [])

    response = client.post(
        f"/api/meetings/{meeting_id}/tasks",
        json={"title": "Prepare notes", "assigneeId": outsider.id},
        headers=auth_header(owner),
    )

    assert response.status_code == 422
