import { useState, type FormEvent } from "react";

import type { TaskWithMeeting } from "../../services/tasksApi";

export function MyTaskEditModal({
  task,
  onSave,
  onClose,
}: {
  task: TaskWithMeeting;
  onSave: (descriptionNotes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [descriptionNotes, setDescriptionNotes] = useState(task.descriptionNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(descriptionNotes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="modal-panel card">
        <h3>{task.title}</h3>
        <div className="muted">{task.meetingTitle}</div>
        <div className="field-row" style={{ marginTop: "12px" }}>
          <span className="field-label">Due Date</span>
          <div className="muted">{task.dueDate ?? "No due date"}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label" htmlFor="my-task-description-notes">Description / Notes</label>
            <textarea id="my-task-description-notes" className="textarea-input" value={descriptionNotes} onChange={(event) => setDescriptionNotes(event.target.value)} />
            <div className="hint">Only Description/Notes can be edited here.</div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
