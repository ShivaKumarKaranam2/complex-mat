from app.models.user import Role


def test_team_member_tracks_and_updates_their_own_tasks(
    client, make_user, make_meeting, make_task, auth_header
):
    owner, _ = make_user(role=Role.ADMIN)
    sarah, _ = make_user(role=Role.TEAM_MEMBER)
    meeting = make_meeting(owner, [sarah])
    task = make_task(meeting, sarah, description_notes="Initial notes")

    # My Tasks is scoped to the signed-in user, labelled with the meeting name (AC1)
    mine = client.get("/api/tasks/mine", headers=auth_header(sarah))
    assert mine.status_code == 200
    assert len(mine.json()) == 1
    assert mine.json()[0]["meetingTitle"] == meeting.title

    # Sarah moves her task to In Progress via the status endpoint (AC3)
    status_update = client.patch(
        f"/api/tasks/{task.id}/status",
        json={"status": "IN_PROGRESS"},
        headers=auth_header(sarah),
    )
    assert status_update.status_code == 200
    assert status_update.json()["status"] == "IN_PROGRESS"

    # Sarah edits her task's Description/Notes (AC5)
    description_update = client.patch(
        f"/api/tasks/{task.id}",
        json={"descriptionNotes": "Updated by Sarah"},
        headers=auth_header(sarah),
    )
    assert description_update.status_code == 200
    assert description_update.json()["descriptionNotes"] == "Updated by Sarah"

    # Title/Due Date remain unchanged throughout (AC5)
    assert description_update.json()["title"] == task.title

    # A different Admin cannot change Sarah's task status (AC4)
    forbidden = client.patch(
        f"/api/tasks/{task.id}/status",
        json={"status": "COMPLETED"},
        headers=auth_header(owner),
    )
    assert forbidden.status_code == 403

    # Sarah completes her task and it remains visible in Completed afterward (AC6)
    completed = client.patch(
        f"/api/tasks/{task.id}/status",
        json={"status": "COMPLETED"},
        headers=auth_header(sarah),
    )
    assert completed.status_code == 200

    mine_after = client.get("/api/tasks/mine", headers=auth_header(sarah))
    assert mine_after.status_code == 200
    assert mine_after.json()[0]["status"] == "COMPLETED"
