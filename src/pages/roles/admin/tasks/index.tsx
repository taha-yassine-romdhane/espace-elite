import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { DayTasksModal } from '@/components/tasks/DayTasksModal';
import { AddTaskButton } from '@/components/tasks/AddTaskButton';
import { TaskFormData, TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  userId: string;
  startDate: string;
  endDate: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'FOLLOW_UP' | 'MAINTENANCE' | 'PAYMENT_DUE' | 'OTHER' | 'APPOINTMENT';
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  dueDate: string;
  patientId?: string;
  patientName?: string;
  companyId?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'month' | 'week' | 'day';

export default function TasksPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case 'week':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case 'day':
        return {
          start: selectedDate,
          end: selectedDate
        };
      default:
        return {
          start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          end: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch tasks
  const { data: tasks, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['tasks', selectedDate, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });
  
  // Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications', selectedDate, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });

  const handleTaskSubmit = async (data: TaskFormData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // userId will be set from the session in the API
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      toast({
        title: "Succès",
        description: "Tâche créée avec succès",
      });

      refetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDayDate(date);
    setIsDayModalOpen(true);
  };

  const getSelectedDayTasks = () => {
    if (!selectedDayDate || !tasks) return [];
    return tasks.filter(task => {
      const taskDate = new Date(task.startDate);
      return taskDate.toDateString() === selectedDayDate.toDateString();
    });
  };

  const renderTaskCard = (task: Task) => {
    const priorityColors = {
      LOW: 'bg-green-100 text-green-800 border-green-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      HIGH: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <div
        key={task.id}
        className={`p-2 rounded border text-xs ${priorityColors[task.priority]} cursor-pointer hover:opacity-80`}
        onClick={() => handleDayClick(new Date(task.startDate))}
      >
        <div className="font-medium truncate">{task.title}</div>
        <div className="text-xs opacity-75">
          {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Non assigné'}
        </div>
      </div>
    );
  };

  const renderNotificationCard = (notification: Notification) => {
    const typeColors = {
      FOLLOW_UP: 'bg-blue-100 text-blue-800 border-blue-200',
      MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
      PAYMENT_DUE: 'bg-purple-100 text-purple-800 border-purple-200',
      APPOINTMENT: 'bg-teal-100 text-teal-800 border-teal-200',
      OTHER: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <div
        key={notification.id}
        className={`p-2 rounded border text-xs ${typeColors[notification.type]} cursor-pointer hover:opacity-80`}
      >
        <div className="font-medium truncate">{notification.title}</div>
        <div className="text-xs opacity-75">
          {notification.patientName || notification.companyName || 'Système'}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = tasks?.filter(task => {
      const taskDate = new Date(task.startDate);
      return taskDate.toDateString() === selectedDate.toDateString();
    }) || [];

    const dayNotifications = notifications?.filter(notification => {
      const notificationDate = new Date(notification.dueDate);
      return notificationDate.toDateString() === selectedDate.toDateString();
    }) || [];

    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Tâches ({dayTasks.length})</h3>
            <div className="space-y-2">
              {dayTasks.length > 0 ? (
                dayTasks.map(task => renderTaskCard(task))
              ) : (
                <p className="text-gray-500 text-sm">Aucune tâche pour cette journée</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Notifications ({dayNotifications.length})</h3>
            <div className="space-y-2">
              {dayNotifications.length > 0 ? (
                dayNotifications.map(notification => renderNotificationCard(notification))
              ) : (
                <p className="text-gray-500 text-sm">Aucune notification pour cette journée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    });

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
            <div key={index} className="bg-gray-50 p-3 text-center font-medium text-sm border-b">
              {day}
            </div>
          ))}
          
          {weekDays.map((day, dayIndex) => {
            const dayTasks = tasks?.filter(task => {
              const taskDate = new Date(task.startDate);
              return taskDate.toDateString() === day.toDateString();
            }) || [];

            const dayNotifications = notifications?.filter(notification => {
              const notificationDate = new Date(notification.dueDate);
              return notificationDate.toDateString() === day.toDateString();
            }) || [];

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIndex}
                className={`min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                  isToday ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map(task => renderTaskCard(task))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} tâches</div>
                  )}
                  
                  {dayNotifications.slice(0, 1).map(notification => renderNotificationCard(notification))}
                  {dayNotifications.length > 1 && (
                    <div className="text-xs text-gray-500">+{dayNotifications.length - 1} notifs</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
            <div key={index} className="bg-gray-50 p-3 text-center font-medium text-sm border-b">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, dayIndex) => {
            const dayTasks = tasks?.filter(task => {
              const taskDate = new Date(task.startDate);
              return taskDate.toDateString() === day.toDateString();
            }) || [];

            const dayNotifications = notifications?.filter(notification => {
              const notificationDate = new Date(notification.dueDate);
              return notificationDate.toDateString() === day.toDateString();
            }) || [];

            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIndex}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-gray-50",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isToday && isCurrentMonth && "bg-blue-50"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && isCurrentMonth && "text-blue-600"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map(task => renderTaskCard(task))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} tâches</div>
                  )}
                  
                  {dayNotifications.slice(0, 1).map(notification => renderNotificationCard(notification))}
                  {dayNotifications.length > 1 && (
                    <div className="text-xs text-gray-500">+{dayNotifications.length - 1} notifs</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Journal des Tâches</h1>
          <div className="text-sm text-gray-600">
            {viewMode === 'month' && format(selectedDate, 'MMMM yyyy', { locale: fr })}
            {viewMode === 'week' && `Semaine ${format(selectedDate, 'w')} - ${format(selectedDate, 'MMMM yyyy', { locale: fr })}`}
            {viewMode === 'day' && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewMode === 'month') {
                  setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
                } else if (viewMode === 'week') {
                  setSelectedDate(subWeeks(selectedDate, 1));
                } else {
                  setSelectedDate(addDays(selectedDate, -1));
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewMode === 'month') {
                  setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
                } else if (viewMode === 'week') {
                  setSelectedDate(addWeeks(selectedDate, 1));
                } else {
                  setSelectedDate(addDays(selectedDate, 1));
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode */}
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Task Button */}
          <AddTaskButton onClick={() => setIsTaskModalOpen(true)} size="sm" />
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Modals */}
      <TaskFormDialog
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        initialDate={selectedDate}
      />
      {selectedDayDate && (
        <DayTasksModal
          open={isDayModalOpen}
          onClose={() => setIsDayModalOpen(false)}
          date={selectedDayDate}
          tasks={getSelectedDayTasks()}
        />
      )}
    </div>
  );
}