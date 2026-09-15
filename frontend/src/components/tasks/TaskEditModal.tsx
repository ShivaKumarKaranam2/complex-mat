import { useState } from "react";

import type { MeetingAttendee } from "../../services/meetingsApi";
import type { Task, TaskCreateInput, TaskUpdateInput } from "../../services/tasksApi";
import { AssigneeControl } from "./AssigneeControl";

const STATUS_LABEL: Record<Task["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function TaskEditModal({
  attendees,
  ownerId,
  currentUserId,
  isAdmin,
  task,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  attendees: MeetingAttendee[];
  ownerId: number;
  currentUserId: number;
  isAdmin: boolean;
  task: Task | null;
  onClose: () => void;
  onCreate: (input: TaskCreateInput) => Promise<unknown>;
  onUpdate: (taskId: number, input: TaskUpdateInput) => Promise<unknown>;
  onDelete: (taskId: number) => Promise<unknown>;
}) {
  const isOwner = currentUserId === ownerId;
  const isAssignee = task !== null && currentUserId === task.assigneeId;
  const canEditFixedFields = isOwner || isAdmin;
  const canEditAssignee = isOwner;
  const canEditDescription = isAssignee;
  const canDelete = (isOwner || isAdmin) && task !== null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [descriptionNotes, setDescriptionNotes] = useState(task?.descriptionNotes ?? "");
  const [assigneeId, setAssigneeId] = useState<number | null>(task?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const titleLocked = task !== null && !canEditFixedFields;
  const dueDateLocked = task !== null && !canEditFixedFields;
  const descriptionLocked = task !== null && !canEditDescription;

  async function handleSave() {
    setError(null);
    if (!task) {
      if (!title.trim()) {
        setError("Title is required.");
        return;
      }
      if (assigneeId === null) {
        setError("Please select an Assignee.");
        return;
      }
      setIsSaving(true);
      try {
        await onCreate({
          title: title.trim(),
          assigneeId,
          descriptionNotes: descriptionNotes || undefined,
          dueDate: dueDate || undefined,
        });
        onClose();
      } catch {
        setError("Unable to create task.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const update: TaskUpdateInput = {};
    if (canEditFixedFields) {
      if (title.trim() && title !== task.title) update.title = title.trim();
      if (dueDate !== (task.dueDate ?? "")) update.dueDate = dueDate || undefined;
    }
    if (canEditAssignee && assigneeId !== null && assigneeId !== task.assigneeId) {
      update.assigneeId = assigneeId;
    }
    if (canEditDescription && descriptionNotes !== (task.descriptionNotes ?? "")) {
      update.descriptionNotes = descriptionNotes;
    }

    setIsSaving(true);
    try {
      await onUpdate(task.id, update);
      onClose();
    } catch {
      setError("Unable to update task.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setIsSaving(true);
    setError(null);
    try {
      await onDelete(task.id);
      onClose();
    } catch {
      setError("Unable to delete task.");
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{task ? "Task Details" : "Create Task"}</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {error && <p role="alert" className="login-error">{error}</p>}
          <div className="field-row">
            <label className="field-label" htmlFor="task-title">Task Title</label>
            <input id="task-title" className="text-input" value={title} disabled={titleLocked} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="field-row" style={{ flex: 1 }}>
              <span className="field-label">Assignee</span>
              <AssigneeControl attendees={attendees} value={assigneeId} onChange={setAssigneeId} isOwner={canEditAssignee} currentAssigneeName={task?.assigneeName} />
              {!canEditAssignee && task === null && <div className="hint">Scoped to this Meeting's Attendees only.</div>}
            </div>
            <div className="field-row" style={{ flex: 1 }}>
              <label className="field-label" htmlFor="task-due-date">Due Date</label>
              <input id="task-due-date" className="text-input" type="date" value={dueDate ?? ""} disabled={dueDateLocked} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>
          {task && <div className="field-row"><span className="field-label">Status</span><div className="muted">{STATUS_LABEL[task.status]}</div></div>}
          <div className="field-row">
            <label className="field-label" htmlFor="task-description">Description / Notes</label>
            <textarea id="task-description" className="textarea-input" value={descriptionNotes ?? ""} disabled={descriptionLocked} onChange={(event) => setDescriptionNotes(event.target.value)} />
            {descriptionLocked && <div className="locked-note">Only the Task's Assignee can edit Description/Notes.</div>}
          </div>
        </div>
        <div className="modal-foot">
          {canDelete && <button className="btn btn-secondary" style={{ color: "var(--danger)", marginRight: "auto" }} onClick={handleDelete} disabled={isSaving}>Delete Task</button>}
          <button className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>Save</button>
        </div>
      </div>
    </div>
  );
}
