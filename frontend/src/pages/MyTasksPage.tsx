import { useState } from "react";

import { TaskBoard } from "../components/tasks/TaskBoard";
import { MyTaskEditModal } from "../components/tasks/MyTaskEditModal";
import { useMyTasks } from "../hooks/useTasks";
import type { TaskWithMeeting } from "../services/tasksApi";

export function MyTasksPage() {
  const { tasks, isLoading, error, updateStatus, updateDescription } = useMyTasks();
  const [editingTask, setEditingTask] = useState<TaskWithMeeting | null>(null);

  if (isLoading) return <p className="muted">Loading your tasks…</p>;
  if (error) return <p className="muted">{error}</p>;

  return (
    <div>
      {tasks.length === 0 ? (
        <div className="card">
          <p className="muted">No tasks are assigned to you yet.</p>
        </div>
      ) : (
        <TaskBoard
          tasks={tasks}
          onStatusChange={(taskId, status) => updateStatus(taskId, status)}
          onEdit={(task) => setEditingTask(task)}
        />
      )}

      {editingTask && (
        <MyTaskEditModal
          task={editingTask}
          onSave={(descriptionNotes) => updateDescription(editingTask.id, descriptionNotes)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
