from app.models.user import Role


def test_assignee_can_update_status_through_all_values(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah)

    for status in ["IN_PROGRESS", "COMPLETED", "TODO"]:
        response = client.patch(
            f"/api/tasks/{task.id}/status",
            json={"status": status},
            headers=auth_header(sarah),
        )
        assert response.status_code == 200
        assert response.json()["status"] == status


def test_non_assignee_cannot_update_status(client, make_user, make_meeting, make_task, auth_header):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah)

    response = client.patch(
        f"/api/tasks/{task.id}/status",
        json={"status": "IN_PROGRESS"},
        headers=auth_header(owner),
    )

    assert response.status_code == 403


def test_invalid_status_value_is_rejected(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah)

    response = client.patch(
        f"/api/tasks/{task.id}/status",
        json={"status": "DONE"},
        headers=auth_header(sarah),
    )

    assert response.status_code == 422


def test_status_update_on_missing_task_returns_404(client, make_user, auth_header):
    sarah, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.patch(
        "/api/tasks/999999/status",
        json={"status": "IN_PROGRESS"},
        headers=auth_header(sarah),
    )

    assert response.status_code == 404
