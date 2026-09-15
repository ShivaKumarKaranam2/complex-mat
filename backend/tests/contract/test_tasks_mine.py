from app.models.user import Role


def test_my_tasks_returns_only_tasks_assigned_to_caller(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    someone_else, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah, someone_else])
    make_task(meeting, sarah, title="Sarah's task")
    make_task(meeting, someone_else, title="Someone else's task")

    response = client.get("/api/tasks/mine", headers=auth_header(sarah))

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Sarah's task"
    assert body[0]["meetingTitle"] == meeting.title
    assert body[0]["meetingId"] == meeting.id


def test_my_tasks_is_empty_when_caller_has_no_tasks(client, make_user, auth_header):
    user, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.get("/api/tasks/mine", headers=auth_header(user))

    assert response.status_code == 200
    assert response.json() == []


def test_my_tasks_requires_authentication(client):
    response = client.get("/api/tasks/mine")

    assert response.status_code == 401
