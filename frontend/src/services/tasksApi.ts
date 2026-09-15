import { apiRequest } from "./apiClient";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface TaskWithMeeting {
  id: number;
  meetingId: number;
  meetingTitle?: string;
  title: string;
  descriptionNotes: string | null;
  dueDate: string | null;
  status: TaskStatus;
  needsReassignment: boolean;
  assigneeId?: number;
  assigneeName?: string;
}

export type Task = TaskWithMeeting;

export interface TaskCreateInput {
  title: string;
  assigneeId: number;
  descriptionNotes?: string;
  dueDate?: string;
}

export interface TaskUpdateInput {
  title?: string;
  descriptionNotes?: string;
  assigneeId?: number;
  dueDate?: string;
}

export function createTask(meetingId: number, input: TaskCreateInput): Promise<Task> {
  return apiRequest<Task>(`/api/meetings/${meetingId}/tasks`, { method: "POST", body: input });
}

export function updateTask(taskId: number, input: TaskUpdateInput): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}`, { method: "PATCH", body: input });
}

export function deleteTask(taskId: number): Promise<void> {
  return apiRequest<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export function listMyTasks(): Promise<TaskWithMeeting[]> {
  return apiRequest<TaskWithMeeting[]>("/api/tasks/mine");
}

export function updateTaskStatus(taskId: number, status: TaskStatus): Promise<TaskWithMeeting> {
  return apiRequest<TaskWithMeeting>(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function updateTaskDescription(
  taskId: number,
  descriptionNotes: string,
): Promise<TaskWithMeeting> {
  return apiRequest<TaskWithMeeting>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: { descriptionNotes },
  });
}
