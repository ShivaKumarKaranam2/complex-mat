import { describe, expect, it } from "vitest";

import { resolveStatusChangeFromDragEnd } from "../../src/components/tasks/TaskBoard";
import type { TaskWithMeeting } from "../../src/services/tasksApi";

const task: TaskWithMeeting = {
  id: 101,
  meetingId: 12,
  meetingTitle: "Q3 Roadmap Review",
  title: "Prepare onboarding API design doc",
  descriptionNotes: null,
  dueDate: "2026-09-20",
  status: "TODO",
  needsReassignment: false,
};

describe("resolveStatusChangeFromDragEnd", () => {
  it("resolves a status change when a card is dropped on a different column", () => {
    const result = resolveStatusChangeFromDragEnd([task], {
      active: { id: task.id, data: { current: undefined }, rect: { current: { initial: null, translated: null } } } as never,
      over: { id: "IN_PROGRESS", rect: {}, data: { current: undefined }, disabled: false } as never,
    });

    expect(result).toEqual({ taskId: 101, status: "IN_PROGRESS" });
  });

  it("is a no-op when dropped back on its own column", () => {
    const result = resolveStatusChangeFromDragEnd([task], {
      active: { id: task.id } as never,
      over: { id: "TODO" } as never,
    });

    expect(result).toBeNull();
  });

  it("is a no-op when there is no drop target", () => {
    const result = resolveStatusChangeFromDragEnd([task], {
      active: { id: task.id } as never,
      over: null,
    });

    expect(result).toBeNull();
  });

  it("is a no-op for a task id that isn't in the current task list", () => {
    const result = resolveStatusChangeFromDragEnd([task], {
      active: { id: 999 } as never,
      over: { id: "IN_PROGRESS" } as never,
    });

    expect(result).toBeNull();
  });
});
