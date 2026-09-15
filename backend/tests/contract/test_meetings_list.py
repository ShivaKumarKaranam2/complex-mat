from fastapi.testclient import TestClient

from app.models.user import Role


def _create_meeting(client, headers, title, date, attendee_ids):
    return client.post(
        "/api/meetings",
        json={"title": title, "date": date, "time": "14:00", "attendeeIds": attendee_ids},
        headers=headers,
    )


def test_admin_sees_all_meetings(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    member, _ = make_user(role=Role.TEAM_MEMBER)
    _create_meeting(client, auth_header(admin), "Meeting A", "2026-09-10", [member.id])
    _create_meeting(client, auth_header(admin), "Meeting B", "2026-09-11", [])

    response = client.get("/api/meetings", headers=auth_header(admin))

    assert response.status_code == 200
    titles = {m["title"] for m in response.json()}
    assert titles == {"Meeting A", "Meeting B"}


def test_team_member_only_sees_meetings_they_attend(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    member, _ = make_user(role=Role.TEAM_MEMBER)
    other_member, _ = make_user(role=Role.TEAM_MEMBER)
    _create_meeting(client, auth_header(admin), "Invited", "2026-09-10", [member.id])
    _create_meeting(client, auth_header(admin), "Not Invited", "2026-09-11", [other_member.id])

    response = client.get("/api/meetings", headers=auth_header(member))

    assert response.status_code == 200
    titles = [m["title"] for m in response.json()]
    assert titles == ["Invited"]
