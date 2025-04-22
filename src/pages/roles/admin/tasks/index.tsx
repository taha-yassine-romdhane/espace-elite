import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

type ViewMode = 'month' | 'week' | 'day';

export default function TasksPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Fetch users for filters
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users/formatted');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Filter users by role
  const managers = users?.filter(user => user.role === 'MANAGER') || [];
  const technicians = users?.filter(user => user.role === 'TECHNICIAN') || [];

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
  const { data: notifications, refetch: refetchNotifications } = useQuery<Notification[]>({
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

  const handleTaskSubmit = async (data: any) => {
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
        description: "La tâche a été créée avec succès",
      });

      refetchTasks();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la tâche",
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
    return tasks.filter(task => 
      format(new Date(task.startDate), 'yyyy-MM-dd') === format(selectedDayDate, 'yyyy-MM-dd')
    );
  };

  const renderTaskCard = (task: Task) => (
    <TooltipProvider key={task.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "text-xs p-1 rounded truncate",
            task.priority === 'HIGH' ? "bg-red-100 text-red-800" :
            task.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-800" :
            "bg-green-100 text-green-800"
          )}>
            {task.title}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-2">
          <div className="space-y-2">
            <div className="font-semibold">{task.title}</div>
            <div className="text-sm">{task.description}</div>
            <div className="text-xs">
              <div>Début: {format(new Date(task.startDate), 'dd/MM/yyyy HH:mm')}</div>
              <div>Fin: {format(new Date(task.endDate), 'dd/MM/yyyy HH:mm')}</div>
              <div>Assigné à: {task.assignedTo.firstName} {task.assignedTo.lastName}</div>
              <div>Statut: {task.status}</div>
              <div>Priorité: {task.priority}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  
  const renderNotificationCard = (notification: Notification) => (
    <TooltipProvider key={notification.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "text-xs p-1 rounded truncate mt-1 border-l-2",
            notification.type === 'FOLLOW_UP' ? "bg-blue-50 text-blue-800 border-blue-600" :
            notification.type === 'MAINTENANCE' ? "bg-purple-50 text-purple-800 border-purple-600" :
            notification.type === 'PAYMENT_DUE' ? "bg-amber-50 text-amber-800 border-amber-600" :
            notification.type === 'APPOINTMENT' ? "bg-emerald-50 text-emerald-800 border-emerald-600" :
            "bg-gray-50 text-gray-800 border-gray-500"
          )}>
            {notification.title}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-2">
          <div className="space-y-2">
            <div className="font-semibold">{notification.title}</div>
            <div className="text-sm">{notification.description}</div>
            {notification.patientName && (
              <div className="text-xs">
                <div>Patient: {notification.patientName}</div>
              </div>
            )}
            {notification.companyName && (
              <div className="text-xs">
                <div>Société: {notification.companyName}</div>
              </div>
            )}
            {notification.dueDate && (
              <div className="text-xs">
                <div>Date d'échéance: {format(new Date(notification.dueDate), 'dd/MM/yyyy')}</div>
              </div>
            )}
            <div className="text-xs">
              <div>Statut: {notification.status}</div>
              <div>Type: {notification.type}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderDayView = () => {
    const dayTasks = tasks?.filter(task => {
      const taskDate = new Date(task.startDate);
      return format(taskDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }) || [];
    
    const dayNotifications = notifications?.filter(notification => {
      if (!notification.dueDate) return false;
      const notificationDate = new Date(notification.dueDate);
      return format(notificationDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }) || [];

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-xl font-semibold mb-4">
          {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
        
        {dayTasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tâches</h3>
            <div className="space-y-2">
              {dayTasks.map(task => renderTaskCard(task))}
            </div>
          </div>
        )}
        
        {dayNotifications.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notifications</h3>
            <div className="space-y-2">
              {dayNotifications.map(notification => renderNotificationCard(notification))}
            </div>
          </div>
        )}
        
        {dayTasks.length === 0 && dayNotifications.length === 0 && (
          <div className="text-gray-500 italic">Aucune tâche ou notification pour ce jour</div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    });

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map(day => {
          const dayTasks = tasks?.filter(task => {
            const taskDate = new Date(task.startDate);
            return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          }) || [];
          
          const dayNotifications = notifications?.filter(notification => {
            if (!notification.dueDate) return false;
            const notificationDate = new Date(notification.dueDate);
            return format(notificationDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          }) || [];

          return (
            <div 
              key={day.toISOString()} 
              className="bg-white rounded-lg shadow p-2 overflow-y-auto"
              style={{ maxHeight: '200px' }}
              onClick={() => handleDayClick(day)}
            >
              <div className="text-sm font-semibold mb-2">
                {format(day, 'EEEE d', { locale: fr })}
              </div>
              
              {dayTasks.length > 0 && (
                <div className="mb-2">
                  {dayTasks.map(task => renderTaskCard(task))}
                </div>
              )}
              
              {dayNotifications.length > 0 && (
                <div>
                  {dayNotifications.map(notification => renderNotificationCard(notification))}
                </div>
              )}
              
              {dayTasks.length + dayNotifications.length > 0 && (
                <div className="text-xs text-right mt-1 text-blue-600 hover:underline cursor-pointer">
                  Voir tout ({dayTasks.length + dayNotifications.length})
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const days = Array.from({ length: 35 }, (_, i) => {
      const date = new Date(startOfMonth);
      date.setDate(i - startOfMonth.getDay() + 1);
      return date;
    });

    return (
      <div className="grid grid-cols-7 gap-4">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="text-center font-semibold p-2 text-gray-600">
            {day}
          </div>
        ))}
        {days.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
          const dayTasks = tasks?.filter(task => 
            format(new Date(task.startDate), 'yyyy-MM-dd') === dateStr
          ) || [];
          
          const dayNotifications = notifications?.filter(notification => {
            if (!notification.dueDate) return false;
            const notificationDate = new Date(notification.dueDate);
            return format(notificationDate, 'yyyy-MM-dd') === dateStr;
          }) || [];
          
          const totalItems = dayTasks.length + dayNotifications.length;

          return (
            <div
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={cn(
                "min-h-[120px] p-2 rounded-lg transition-colors cursor-pointer overflow-y-auto",
                isCurrentMonth 
                  ? "bg-white shadow hover:shadow-md" 
                  : "bg-gray-50"
              )}
              style={{ maxHeight: '150px' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-sm",
                  isCurrentMonth ? "text-gray-900" : "text-gray-400"
                )}>
                  {format(date, 'd')}
                </span>
                {totalItems > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              
              {/* Display tasks first */}
              {dayTasks.length > 0 && (
                <div className="space-y-1 mb-1">
                  {dayTasks.slice(0, 2).map(task => renderTaskCard(task))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} tâches</div>
                  )}
                </div>
              )}
              
              {/* Display notifications */}
              {dayNotifications.length > 0 && (
                <div className="space-y-1">
                  {dayNotifications.slice(0, 2).map(notification => renderNotificationCard(notification))}
                  {dayNotifications.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayNotifications.length - 2} notifications</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Journal des Taches</h1>
          <div className="text-lg text-gray-600">
            {viewMode === 'month' && (
              format(selectedDate, 'MMMM yyyy', { locale: fr })
            )}
            {viewMode === 'week' && (
              `Semaine ${format(selectedDate, 'w')} - ${format(selectedDate, 'MMMM yyyy', { locale: fr })}`
            )}
            {viewMode === 'day' && (
              format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
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
              size="icon"
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

          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>

          <AddTaskButton onClick={() => setIsTaskModalOpen(true)} />
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

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