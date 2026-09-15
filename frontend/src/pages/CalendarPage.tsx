import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { MonthGrid } from "../components/calendar/MonthGrid";
import { MonthNavigator } from "../components/calendar/MonthNavigator";
import { useAuth } from "../context/AuthContext";
import { useMeetings } from "../hooks/useMeetings";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { meetings, isLoading } = useMeetings({ month, year });
  const isAdmin = user?.role === "ADMIN";

  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  }

  function handleSelectDate(day: number) {
    const isoDate = `${year}-${pad(month)}-${pad(day)}`;
    navigate(`/meetings/new?date=${isoDate}`);
  }

  function handleOpenMeeting(meetingId: number) {
    navigate(`/meetings/${meetingId}`);
  }

  return (
    <div className="card">
      <MonthNavigator month={month} year={year} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />
      {isLoading ? (
        <p className="muted">Loading meetings…</p>
      ) : (
        <MonthGrid
          month={month}
          year={year}
          meetings={meetings}
          canCreate={isAdmin}
          onSelectDate={handleSelectDate}
          onOpenMeeting={handleOpenMeeting}
        />
      )}
      <div className="hint">
        {isAdmin ? (
          <>
            Click any date to open <strong>Create Meeting</strong> prefilled with that date. Click an
            existing meeting pill to open <strong>Meeting Details</strong>.
          </>
        ) : (
          <>
            Only Admins can create meetings. Click an existing meeting pill to open{" "}
            <strong>Meeting Details</strong>. You only see meetings you are invited to.
          </>
        )}
      </div>
    </div>
  );
}
