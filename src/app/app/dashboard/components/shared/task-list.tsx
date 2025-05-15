"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react";

export interface Task {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  commitment_type: 'PROMISED_AVAILABILITY' | 'ASSIGNED_TASK';
  seva_category_id: number | null;
  task_notes: string | null;
  is_checked_in?: boolean;
  volunteer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    description: string | null;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    id: number;
    category_name: string;
  } | null;
}

export interface TaskListProps {
  tasks: Task[];
  viewMode: "volunteer" | "team_lead" | "admin";
  onCheckIn?: (taskId: number, isCheckedIn: boolean) => Promise<void>;
  onRemove?: (taskId: number) => Promise<void>;
  onView?: (taskId: number) => void;
  onEdit?: (task: Task) => void;
}

export function TaskList({
  tasks,
  viewMode,
  onCheckIn,
  onRemove,
  onView,
  onEdit
}: TaskListProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const handleCheckIn = async (taskId: number, isCheckedIn: boolean) => {
    if (!onCheckIn) return;

    setLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      await onCheckIn(taskId, isCheckedIn);
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleRemove = async (taskId: number) => {
    if (!onRemove) return;

    setLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      await onRemove(taskId);
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getStatusBadge = (task: Task) => {
    if (task.is_checked_in) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Checked In
        </Badge>
      );
    }

    const now = new Date();
    const startTime = new Date(task.time_slot.start_time);

    if (now > startTime) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Missed
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-amber-500 text-amber-500">
        <Clock className="mr-1 h-3 w-3" />
        Upcoming
      </Badge>
    );
  };

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {viewMode !== "volunteer" && <TableHead>Volunteer</TableHead>}
            <TableHead>Task</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={viewMode !== "volunteer" ? 5 : 4}
                className="h-24 text-center"
              >
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                {viewMode !== "volunteer" && (
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.volunteer.first_name} {task.volunteer.last_name}</p>
                      <p className="text-xs text-muted-foreground">{task.volunteer.email}</p>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  {task.seva_category?.category_name || "Unassigned"}
                </TableCell>
                <TableCell>
                  <div>
                    <p>{task.time_slot.slot_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(task.time_slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(task)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {viewMode === "team_lead" && onCheckIn && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`checkin-${task.id}`}
                          checked={!!task.is_checked_in}
                          onCheckedChange={(checked) =>
                            handleCheckIn(task.id, !!checked)
                          }
                          disabled={loading[task.id]}
                        />
                        <label
                          htmlFor={`checkin-${task.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {task.is_checked_in ? "Checked In" : "Not Present"}
                        </label>
                      </div>
                    )}

                    {onView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(task.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {viewMode === "admin" && onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {viewMode === "admin" && onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(task.id)}
                        disabled={loading[task.id]}
                      >
                        {loading[task.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
