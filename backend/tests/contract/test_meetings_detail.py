from fastapi.testclient import TestClient

from app.models.user import Role


def _create_meeting(client, headers, attendee_ids):
    response = client.post(
        "/api/meetings",
        json={
            "title": "Q3 Roadmap Review",
            "date": "2026-09-15",
            "time": "14:00",
            "agendaNotes": "Discuss roadmap.",
            "attendeeIds": attendee_ids,
        },
        headers=headers,
    )
    return response.json()["id"]


def test_get_meeting_detail_returns_full_meeting(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    member, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(admin), [member.id])

    response = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(admin))

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Q3 Roadmap Review"
    assert body["agendaNotes"] == "Discuss roadmap."
    attendee_ids = {a["id"] for a in body["attendees"]}
    assert member.id in attendee_ids
    assert admin.id in attendee_ids


def test_non_attendee_team_member_is_forbidden(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    outsider, _ = make_user(role=Role.TEAM_MEMBER)
    meeting_id = _create_meeting(client, auth_header(admin), [])

    response = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(outsider))

    assert response.status_code == 403


def test_unknown_meeting_returns_404(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)

    response = client.get("/api/meetings/999999", headers=auth_header(admin))

    assert response.status_code == 404
