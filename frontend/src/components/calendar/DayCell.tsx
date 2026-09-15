import type { MeetingSummary } from "../../services/meetingsApi";
import { MeetingPill } from "./MeetingPill";

export function DayCell({
  day,
  meetings,
  canCreate,
  onSelectDate,
  onOpenMeeting,
}: {
  day: number;
  meetings: MeetingSummary[];
  canCreate: boolean;
  onSelectDate: (day: number) => void;
  onOpenMeeting: (meetingId: number) => void;
}) {
  return (
    <div
      className="cal-day"
      role={canCreate ? "button" : undefined}
      tabIndex={canCreate ? 0 : undefined}
      onClick={canCreate ? () => onSelectDate(day) : undefined}
    >
      <div className="daynum">{day}</div>
      {meetings.map((meeting) => (
        <MeetingPill key={meeting.id} meeting={meeting} onClick={onOpenMeeting} />
      ))}
    </div>
  );
}
