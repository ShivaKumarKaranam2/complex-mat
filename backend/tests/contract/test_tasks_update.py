from app.models.user import Role


def test_assignee_can_update_description_notes(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah, description_notes="Original notes")

    response = client.patch(
        f"/api/tasks/{task.id}",
        json={"descriptionNotes": "Updated notes"},
        headers=auth_header(sarah),
    )

    assert response.status_code == 200
    assert response.json()["descriptionNotes"] == "Updated notes"


def test_assignee_cannot_change_title_due_date_or_assignee(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    other, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah, other])
    task = make_task(meeting, sarah, title="Original title")

    response = client.patch(
        f"/api/tasks/{task.id}",
        json={"title": "New title", "descriptionNotes": "Updated notes"},
        headers=auth_header(sarah),
    )

    assert response.status_code == 403


def test_non_assignee_cannot_update_description(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah)

    response = client.patch(
        f"/api/tasks/{task.id}",
        json={"descriptionNotes": "Sneaky edit"},
        headers=auth_header(owner),
    )

    assert response.status_code == 403
