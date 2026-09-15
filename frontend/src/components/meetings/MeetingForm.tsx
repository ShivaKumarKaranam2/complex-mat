import { useState, type FormEvent } from "react";

import type { UserSummary } from "../../services/usersApi";
import { AttendeeSearchInput } from "./AttendeeSearchInput";

export interface MeetingFormValues {
  title: string;
  date: string;
  time: string;
  agendaNotes: string;
  attendeeIds: number[];
}

export function MeetingForm({
  initialTitle = "",
  initialDate,
  initialTime = "",
  initialAgendaNotes = "",
  initialAttendees,
  ownerId,
  dateEditable = false,
  submitLabel = "Save Meeting",
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialDate: string;
  initialTime?: string;
  initialAgendaNotes?: string;
  initialAttendees: UserSummary[];
  ownerId: number;
  dateEditable?: boolean;
  submitLabel?: string;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [agendaNotes, setAgendaNotes] = useState(initialAgendaNotes);
  const [attendees, setAttendees] = useState<UserSummary[]>(initialAttendees);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setTitleError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        date,
        time,
        agendaNotes: agendaNotes.trim(),
        attendeeIds: attendees.map((user) => user.id),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form aria-label="Meeting form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label className="field-label" htmlFor="meeting-title">
          Title
        </label>
        <input
          id="meeting-title"
          className="text-input"
          placeholder="e.g. Weekly Sync"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {titleError && (
          <p role="alert" className="login-error">
            {titleError}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div className="field-row" style={{ flex: 1 }}>
          <label className="field-label" htmlFor="meeting-date">
            Date
          </label>
          <input
            id="meeting-date"
            className="text-input"
            value={date}
            readOnly={dateEditable === false}
            onChange={(event) => setDate(event.target.value)}
            type={dateEditable ? "date" : "text"}
          />
          {!dateEditable && <div className="hint">Prefilled from the Calendar date you selected.</div>}
        </div>
        <div className="field-row" style={{ flex: 1 }}>
          <label className="field-label" htmlFor="meeting-time">
            Time
          </label>
          <input
            id="meeting-time"
            className="text-input"
            placeholder="e.g. 14:00"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <span className="field-label">Attendees</span>
        <AttendeeSearchInput
          selected={attendees}
          lockedIds={[ownerId]}
          onAdd={(user) => setAttendees((prev) => [...prev, user])}
          onRemove={(userId) => setAttendees((prev) => prev.filter((user) => user.id !== userId))}
        />
        <div className="hint">Attendee search covers all internal workspace members.</div>
      </div>

      <div className="field-row">
        <label className="field-label" htmlFor="meeting-agenda">
          Agenda / Notes
        </label>
        <textarea
          id="meeting-agenda"
          className="textarea-input"
          placeholder="Agenda or notes for this meeting…"
          value={agendaNotes}
          onChange={(event) => setAgendaNotes(event.target.value)}
        />
      </div>

      <div className="modal-foot" style={{ padding: 0, border: "none" }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
