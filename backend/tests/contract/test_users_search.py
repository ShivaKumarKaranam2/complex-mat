from fastapi.testclient import TestClient

from app.models.user import Role


def test_admin_can_search_users_by_name(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    member, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.get(
        "/api/users", params={"q": member.employee_name}, headers=auth_header(admin)
    )

    assert response.status_code == 200
    ids = {u["id"] for u in response.json()}
    assert member.id in ids


def test_search_excludes_inactive_users_by_default(client: TestClient, make_user, auth_header):
    admin, _ = make_user(role=Role.ADMIN)
    inactive, _ = make_user(role=Role.TEAM_MEMBER, is_active=False)

    response = client.get(
        "/api/users", params={"q": inactive.employee_name}, headers=auth_header(admin)
    )

    assert response.status_code == 200
    ids = {u["id"] for u in response.json()}
    assert inactive.id not in ids


def test_team_member_cannot_search_users(client: TestClient, make_user, auth_header):
    member, _ = make_user(role=Role.TEAM_MEMBER)

    response = client.get("/api/users", headers=auth_header(member))

    assert response.status_code == 403
