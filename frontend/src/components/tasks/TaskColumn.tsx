import { useDroppable } from "@dnd-kit/core";

import type { Task, TaskStatus, TaskWithMeeting } from "../../services/tasksApi";
import { TaskCard } from "./TaskCard";

export function TaskColumn({
  status,
  label,
  tasks,
  onStatusChange,
  onEdit,
  onOpenTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: TaskWithMeeting[];
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: TaskWithMeeting) => void;
  onOpenTask?: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className="task-column" data-over={isOver || undefined}>
      <div className="task-column-header">
        <span>{label}</span>
        <span className="pill">{tasks.length}</span>
      </div>
      <div className="task-column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={(nextStatus) => onStatusChange?.(task.id, nextStatus)}
            onEdit={() => onEdit?.(task)}
            onOpen={() => onOpenTask?.(task)}
          />
        ))}
        {tasks.length === 0 && <p className="muted">No tasks here.</p>}
      </div>
    </div>
  );
}
