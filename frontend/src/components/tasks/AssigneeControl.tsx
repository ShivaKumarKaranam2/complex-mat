import type { MeetingAttendee } from "../../services/meetingsApi";

export function AssigneeControl({
  attendees,
  value,
  onChange,
  isOwner,
  currentAssigneeName,
}: {
  attendees: MeetingAttendee[];
  value: number | null;
  onChange: (userId: number) => void;
  isOwner: boolean;
  currentAssigneeName?: string;
}) {
  if (!isOwner) {
    return (
      <div>
        <input
          className="text-input"
          aria-label="Assignee"
          value={currentAssigneeName ?? ""}
          disabled
          readOnly
        />
        <div className="locked-note">Only the Meeting Owner can assign or reassign this task.</div>
      </div>
    );
  }

  return (
    <select
      className="select-input"
      aria-label="Assignee"
      value={value ?? ""}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      <option value="" disabled>
        Select an attendee…
      </option>
      {attendees.map((attendee) => (
        <option key={attendee.id} value={attendee.id}>
          {attendee.employeeName}
        </option>
      ))}
    </select>
  );
}
