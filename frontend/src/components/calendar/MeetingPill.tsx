import type { MeetingSummary } from "../../services/meetingsApi";

export function MeetingPill({
  meeting,
  onClick,
}: {
  meeting: MeetingSummary;
  onClick: (meetingId: number) => void;
}) {
  return (
    <button
      type="button"
      className="cal-meeting-pill"
      onClick={(event) => {
        event.stopPropagation();
        onClick(meeting.id);
      }}
    >
      {meeting.title}
    </button>
  );
}
