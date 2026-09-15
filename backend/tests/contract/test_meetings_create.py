from fastapi.testclient import TestClient

from app.models.user import Role


def test_admin_can_create_meeting_and_becomes_owner(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.post(
        "/api/meetings",
        json={
            "title": "Q3 Roadmap Review",
            "date": "2026-09-15",
            "time": "14:00",
            "agendaNotes": "Review Q3 milestones.",
            "attendeeIds": [attendee.id],
        },
        headers=auth_header(admin),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Q3 Roadmap Review"
    assert body["ownerId"] == admin.id
    assert body["ownerName"] == admin.employee_name


def test_team_member_cannot_create_meeting(client: TestClient, make_user, auth_header):
    member, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.post(
        "/api/meetings",
        json={
            "title": "Weekly Sync",
            "date": "2026-09-15",
            "time": "14:00",
            "attendeeIds": [],
        },
        headers=auth_header(member),
    )

    assert response.status_code == 403


def test_create_meeting_missing_title_is_rejected(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)

    response = client.post(
        "/api/meetings",
        json={"date": "2026-09-15", "time": "14:00", "attendeeIds": []},
        headers=auth_header(admin),
    )

    assert response.status_code == 422


def test_create_meeting_with_inactive_attendee_is_rejected(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    inactive_attendee, _ = make_user(role=Role.TEAM_MEMBER, is_active=False)

    response = client.post(
        "/api/meetings",
        json={
            "title": "Weekly Sync",
            "date": "2026-09-15",
            "time": "14:00",
            "attendeeIds": [inactive_attendee.id],
        },
        headers=auth_header(admin),
    )

    assert response.status_code == 422
