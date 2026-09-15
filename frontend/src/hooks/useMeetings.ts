import { useCallback, useEffect, useState } from "react";

import * as meetingsApi from "../services/meetingsApi";
import type {
  MeetingCreateInput,
  MeetingDetail,
  MeetingSummary,
} from "../services/meetingsApi";

export function useMeetings(params?: { month?: number; year?: number }) {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await meetingsApi.listMeetings(params);
      setMeetings(result);
    } catch {
      setError("Unable to load meetings.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.month, params?.year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createMeeting = useCallback(
    async (input: MeetingCreateInput) => {
      const created = await meetingsApi.createMeeting(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  return { meetings, isLoading, error, refresh, createMeeting };
}

export function useMeetingDetail(meetingId: number | null) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (meetingId === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await meetingsApi.getMeetingDetail(meetingId);
      setMeeting(result);
    } catch {
      setError("Unable to load this meeting.");
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { meeting, isLoading, error, refresh };
}
