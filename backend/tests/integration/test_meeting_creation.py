from fastapi.testclient import TestClient

from app.models.user import Role


def test_created_meeting_appears_in_calendar_and_previous_meetings_with_correct_owner(
    client: TestClient, make_user, auth_header
):
    admin, _ = make_user(role=Role.ADMIN)
    attendee, _ = make_user(role=Role.TEAM_MEMBER)

    create_response = client.post(
        "/api/meetings",
        json={
            "title": "Sprint Planning",
            "date": "2026-09-15",
            "time": "09:00",
            "agendaNotes": "Plan next sprint.",
            "attendeeIds": [attendee.id],
        },
        headers=auth_header(admin),
    )
    assert create_response.status_code == 201
    meeting_id = create_response.json()["id"]

    list_response = client.get("/api/meetings", headers=auth_header(admin))
    assert any(m["id"] == meeting_id and m["ownerId"] == admin.id for m in list_response.json())

    detail_response = client.get(f"/api/meetings/{meeting_id}", headers=auth_header(admin))
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["ownerId"] == admin.id
    assert detail["ownerName"] == admin.employee_name


def test_only_admin_can_create_a_meeting_and_owner_is_the_creating_admin(
    client: TestClient, make_user, auth_header
):
    team_member, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.post(
        "/api/meetings",
        json={"title": "Unauthorized Meeting", "date": "2026-09-15", "time": "09:00", "attendeeIds": []},
        headers=auth_header(team_member),
    )

    assert response.status_code == 403
