import { TaskStatus, TaskPriority } from '../enums';
import { User } from './User';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date;
  endDate: Date;
  assignedTo: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
