import { useNavigate, useSearchParams } from "react-router-dom";

import { MeetingForm, type MeetingFormValues } from "../components/meetings/MeetingForm";
import { useAuth } from "../context/AuthContext";
import { useMeetings } from "../hooks/useMeetings";

export function CreateMeetingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const { createMeeting } = useMeetings();

  if (!user) return null;

  async function handleSubmit(values: MeetingFormValues) {
    const meeting = await createMeeting({
      title: values.title,
      date: values.date,
      time: values.time,
      agendaNotes: values.agendaNotes || undefined,
      attendeeIds: values.attendeeIds,
    });
    navigate(`/meetings/${meeting.id}`, { replace: true });
  }

  return (
    <div className="card">
      <h3>Create Meeting</h3>
      <MeetingForm
        initialDate={selectedDate}
        initialAttendees={[
          {
            id: user.id,
            employeeName: user.employeeName,
            employeeMailId: user.employeeMailId,
            employeeId: user.employeeId,
            role: user.role,
            isActive: user.isActive,
          },
        ]}
        ownerId={user.id}
        submitLabel="Save Meeting"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/calendar")}
      />
    </div>
  );
}
