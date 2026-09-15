import type { MeetingSummary } from "../../services/meetingsApi";
import { DayCell } from "./DayCell";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayOfMonth(isoDate: string): number {
  return Number(isoDate.split("-")[2]);
}

export function MonthGrid({
  month,
  year,
  meetings,
  canCreate,
  onSelectDate,
  onOpenMeeting,
}: {
  month: number;
  year: number;
  meetings: MeetingSummary[];
  canCreate: boolean;
  onSelectDate: (day: number) => void;
  onOpenMeeting: (meetingId: number) => void;
}) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const meetingsByDay = new Map<number, MeetingSummary[]>();
  meetings.forEach((meeting) => {
    const day = dayOfMonth(meeting.date);
    const existing = meetingsByDay.get(day) ?? [];
    existing.push(meeting);
    meetingsByDay.set(day, existing);
  });

  const leadingEmptyCells = Array.from({ length: firstDow }, (_, index) => (
    <div className="cal-day empty" key={`empty-${index}`} />
  ));

  const dayCells = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return (
      <DayCell
        key={day}
        day={day}
        meetings={meetingsByDay.get(day) ?? []}
        canCreate={canCreate}
        onSelectDate={onSelectDate}
        onOpenMeeting={onOpenMeeting}
      />
    );
  });

  return (
    <div className="cal-grid">
      {DAY_LABELS.map((label) => (
        <div className="cal-dow" key={label}>
          {label}
        </div>
      ))}
      {leadingEmptyCells}
      {dayCells}
    </div>
  );
}
