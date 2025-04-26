import {  useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import EmployeeLayout from '../EmployeeLayout';
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
import { TaskModal } from '@/components/tasks/TaskModal';
import { DayTasksModal } from '@/components/tasks/DayTasksModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Calendar as  ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskFormData } from '@/components/tasks/TaskFormDialog';
import { Task } from '@/types';


type ViewMode = 'month' | 'week' | 'day';

function TasksPage() {
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
        description: "La tâche a été créée avec succès",
      });

      refetchTasks();
    } catch  {
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
          <div
            className={cn(
              "p-2 rounded-md text-xs cursor-pointer transition-colors",
              {
                'bg-red-100 text-red-800 hover:bg-red-200': task.priority === 'HIGH',
                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': task.priority === 'MEDIUM',
                'bg-blue-100 text-blue-800 hover:bg-blue-200': task.priority === 'LOW'
              }
            )}
          >
            <div className="font-semibold">{task.title}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs opacity-75">
                {format(new Date(task.startDate), 'HH:mm')} - {format(new Date(task.endDate), 'HH:mm')}
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  {task.assignedTo.firstName.charAt(0)}{task.assignedTo.lastName.charAt(0)}
                </span>
              </div>
            </div>
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

  const renderDayView = () => {
    const dayTasks = tasks?.filter(task => {
      const taskDate = new Date(task.startDate);
      return format(taskDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }) || [];

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-xl font-semibold mb-4">
          {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
        <div className="space-y-2">
          {dayTasks.map(task => renderTaskCard(task))}
        </div>
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

          return (
            <div key={day.toISOString()} className="bg-white rounded-lg shadow p-2">
              <div className="text-sm font-semibold mb-2">
                {format(day, 'EEEE d', { locale: fr })}
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => renderTaskCard(task))}
              </div>
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

          return (
            <div
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={cn(
                "min-h-[120px] p-2 rounded-lg transition-colors cursor-pointer",
                isCurrentMonth 
                  ? "bg-white shadow hover:shadow-md" 
                  : "bg-gray-50"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-sm",
                  isCurrentMonth ? "text-gray-900" : "text-gray-400"
                )}>
                  {format(date, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 rounded-full">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => renderTaskCard(task))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
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

          <Button onClick={() => setIsTaskModalOpen(true)}>
            Ajout tâche
          </Button>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
      />
      {selectedDayDate && (
        <DayTasksModal
          open={isDayModalOpen}
          onClose={() => setIsDayModalOpen(false)}
          date={selectedDayDate}
          tasks={getSelectedDayTasks().map(task => ({
            ...task,
            startDate: typeof task.startDate === 'string' ? task.startDate : task.startDate.toISOString(),
            endDate: typeof task.endDate === 'string' ? task.endDate : task.endDate.toISOString(),
          }))}
        />
      )}
    </div>
  );
}

// Use the employee layout for the tasks page
TasksPage.getLayout = function getLayout(page: React.ReactElement) {
  return <EmployeeLayout>{page}</EmployeeLayout>;
};

export default TasksPage;
