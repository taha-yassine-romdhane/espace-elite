import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import {
  Calendar, Clock, CreditCard, Stethoscope, Building2,
  ChevronLeft, ChevronRight,  Activity,
  FileText, Phone, Eye, ExternalLink,
  Hash, CalendarDays, ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import AdminLayout from '../AdminLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ComprehensiveTask {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  type: 'TASK' | 'DIAGNOSTIC_PENDING' | 'RENTAL_EXPIRING' | 'PAYMENT_DUE' | 'APPOINTMENT_REMINDER' | 'CNAM_RENEWAL' | 'MAINTENANCE_DUE' | 'SALE_RAPPEL_2YEARS' | 'SALE_RAPPEL_7YEARS' | 'RENTAL_ALERT' | 'RENTAL_TITRATION' | 'RENTAL_APPOINTMENT' | 'PAYMENT_PERIOD_END';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: string;
  endDate?: string;
  dueDate?: string;

  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };

  client?: {
    id: string;
    name: string;
    type: 'patient' | 'company';
    telephone?: string;
  };

  relatedData?: {
    deviceName?: string;
    amount?: number;
    diagnosticId?: string;
    diagnosticCode?: string;
    rentalId?: string;
    rentalCode?: string;
    appointmentId?: string;
    appointmentCode?: string;
    paymentId?: string;
    paymentCode?: string;
    bonNumber?: string;
    saleCode?: string;
  };

  actionUrl?: string;
  actionLabel?: string;
  canComplete?: boolean;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
}

const taskTypeConfig = {
  TASK: {
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Tâche'
  },
  DIAGNOSTIC_PENDING: {
    icon: Stethoscope,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Diagnostic'
  },
  RENTAL_EXPIRING: {
    icon: Building2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Location'
  },
  PAYMENT_DUE: {
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Paiement'
  },
  APPOINTMENT_REMINDER: {
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'RDV'
  },
  CNAM_RENEWAL: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'CNAM'
  },
  MAINTENANCE_DUE: {
    icon: Activity,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Maintenance'
  },
  SALE_RAPPEL_2YEARS: {
    icon: FileText,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    label: 'Rappel Accessoires'
  },
  SALE_RAPPEL_7YEARS: {
    icon: FileText,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    label: 'Rappel Appareil'
  },
  RENTAL_ALERT: {
    icon: Building2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Rappel Location'
  },
  RENTAL_TITRATION: {
    icon: Activity,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    label: 'Rappel Titration'
  },
  RENTAL_APPOINTMENT: {
    icon: Calendar,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'RDV Location'
  },
  PAYMENT_PERIOD_END: {
    icon: Clock,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    label: 'Fin Période'
  }
};

type ViewMode = 'month' | 'week' | 'day' | 'list';

export default function ModernTasksPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filter, setFilter] = useState('all');
  const [assignedUserId, setAssignedUserId] = useState('all');
  const [selectedTask, setSelectedTask] = useState<ComprehensiveTask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case 'week':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case 'day':
        // Set to start of day (00:00:00) and end of day (23:59:59)
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          start: startOfDay,
          end: endOfDay
        };
      case 'list':
        return {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        };
      default:
        return {
          start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          end: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch comprehensive tasks
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['comprehensive-tasks', selectedDate, viewMode, filter, assignedUserId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        filter,
        ...(assignedUserId !== 'all' && { assignedUserId })
      });

      const response = await fetch(`/api/tasks/comprehensive?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  // Fetch users for filtering
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const response = await fetch('/api/users/list');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Filter tasks based on hideCompleted setting
  const allTasks: ComprehensiveTask[] = data?.tasks || [];
  const tasks = hideCompleted
    ? allTasks.filter(task => task.status !== 'COMPLETED')
    : allTasks;

  // Recalculate stats based on filtered tasks
  const stats = hideCompleted ? {
    total: tasks.length,
    byStatus: {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      COMPLETED: 0, // Hidden
      OVERDUE: tasks.filter(t => t.status === 'OVERDUE').length
    },
    byPriority: data?.stats?.byPriority || {},
    byType: {
      TASK: tasks.filter(t => t.type === 'TASK').length,
      DIAGNOSTIC_PENDING: tasks.filter(t => t.type === 'DIAGNOSTIC_PENDING').length,
      RENTAL_EXPIRING: tasks.filter(t => t.type === 'RENTAL_EXPIRING').length,
      PAYMENT_DUE: tasks.filter(t => t.type === 'PAYMENT_DUE').length,
      APPOINTMENT_REMINDER: tasks.filter(t => t.type === 'APPOINTMENT_REMINDER').length,
      CNAM_RENEWAL: tasks.filter(t => t.type === 'CNAM_RENEWAL').length,
      SALE_RAPPEL_2YEARS: tasks.filter(t => t.type === 'SALE_RAPPEL_2YEARS').length,
      SALE_RAPPEL_7YEARS: tasks.filter(t => t.type === 'SALE_RAPPEL_7YEARS').length,
      RENTAL_ALERT: tasks.filter(t => t.type === 'RENTAL_ALERT').length,
      RENTAL_TITRATION: tasks.filter(t => t.type === 'RENTAL_TITRATION').length,
      RENTAL_APPOINTMENT: tasks.filter(t => t.type === 'RENTAL_APPOINTMENT').length,
      PAYMENT_PERIOD_END: tasks.filter(t => t.type === 'PAYMENT_PERIOD_END').length
    }
  } : (data?.stats || {});

  const handleTaskAction = (task: ComprehensiveTask) => {
    setSelectedTask(task);
    setEditedNotes(task.notes || '');
    setIsDetailsDialogOpen(true);
  };

  const handleRedirectToDetails = () => {
    if (selectedTask?.actionUrl) {
      router.push(selectedTask.actionUrl);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    setIsCompletingTask(true);

    try {
      const response = await fetch('/api/tasks/complete-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          taskType: selectedTask.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the task requires action (like diagnostics, payments), redirect to the action URL
        if (data.requiresAction && selectedTask.actionUrl) {
          toast({
            title: "Action requise",
            description: data.error,
            variant: "default",
          });
          setIsDetailsDialogOpen(false);
          router.push(selectedTask.actionUrl);
          return;
        }

        throw new Error(data.error || 'Erreur lors de la complétion de la tâche');
      }

      // Success
      toast({
        title: "Tâche complétée",
        description: "La tâche a été marquée comme terminée avec succès",
        variant: "default",
      });

      // Close dialog and refresh tasks
      setIsDetailsDialogOpen(false);
      refetch();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la complétion de la tâche",
        variant: "destructive",
      });
    } finally {
      setIsCompletingTask(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTask) return;

    // Only allow note editing for TASK and APPOINTMENT_REMINDER
    if (selectedTask.type !== 'TASK' && selectedTask.type !== 'APPOINTMENT_REMINDER') {
      return;
    }

    setIsSavingNotes(true);

    try {
      const response = await fetch('/api/tasks/update-notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          taskType: selectedTask.type,
          notes: editedNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour des notes');
      }

      // Success
      toast({
        title: "Notes mises à jour",
        description: "Les notes ont été sauvegardées avec succès",
        variant: "default",
      });

      // Update the selected task with new notes
      setSelectedTask({
        ...selectedTask,
        notes: editedNotes
      });

      // Refresh tasks to get updated data
      refetch();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour des notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse">Urgent!</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Haute</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyenne</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Basse</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">En retard</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En cours</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Terminé</Badge>;
      case 'TODO':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">À faire</Badge>;
      default:
        return null;
    }
  };

  const renderTaskCard = (task: ComprehensiveTask, isCompact = false) => {
    const config = taskTypeConfig[task.type];
    const Icon = config.icon;

    if (isCompact) {
      return (
        <div
          key={task.id}
          className={cn(
            "p-1.5 rounded border text-xs cursor-pointer hover:shadow-sm transition-all",
            config.bgColor,
            config.borderColor,
            task.status === 'OVERDUE' && "ring-1 ring-red-300"
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleTaskAction(task);
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Icon className={cn("h-3 w-3", config.color)} />
            <span className="font-medium truncate">{task.title}</span>
          </div>
          {task.client && (
            <div className="text-xs text-gray-600 truncate">
              {task.client.name}
            </div>
          )}
          {task.relatedData?.amount && (
            <div className="text-xs font-medium text-gray-800">
              {task.relatedData.amount.toFixed(2)} TND
            </div>
          )}
        </div>
      );
    }

    return (
      <Card 
        key={task.id}
        className={cn(
          "hover:shadow-md transition-all cursor-pointer group border-l-4",
          config.borderColor,
          task.status === 'OVERDUE' && "ring-1 ring-red-300"
        )}
        onClick={() => handleTaskAction(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.status)}
                </div>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {/* Client */}
                {task.client && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {getClientInitials(task.client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700 truncate">
                      {task.client.name}
                    </span>
                    {task.client.type === 'company' && (
                      <Building2 className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                )}

                {/* Assigned to - More prominent */}
                {task.assignedTo ? (
                  <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs bg-blue-100">
                        {`${task.assignedTo.firstName[0]}${task.assignedTo.lastName[0]}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                      <span className="text-xs text-blue-600">
                        {task.assignedTo.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-800">
                      Non assigné
                    </span>
                  </div>
                )}

                {/* Due date */}
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                )}

                {/* Amount */}
                {task.relatedData?.amount && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-gray-400" />
                    <span className="font-medium text-gray-800">
                      {task.relatedData.amount.toFixed(2)} TND
                    </span>
                  </div>
                )}
              </div>

              {/* Device or additional info */}
              {task.relatedData?.deviceName && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {task.relatedData.deviceName}
                  </Badge>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {task.actionLabel || 'Voir'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStats = () => {
    // Calculate assignment stats
    const assignedTasks = tasks.filter(t => t.assignedTo);
    const unassignedTasks = tasks.filter(t => !t.assignedTo);

    return (
      <div className="mb-6">
        {/* Compact Stats as Badges in a single row */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg border">
          {/* Assignment Info */}
          <div className="flex items-center gap-2 mr-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {assignedTasks.length} assignées • {unassignedTasks.length} non assignées
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Status Stats */}
          {(stats.byStatus?.OVERDUE || 0) > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-300 px-3 py-1.5 text-sm font-medium">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              {stats.byStatus.OVERDUE} En retard
            </Badge>
          )}

          {(stats.byStatus?.IN_PROGRESS || 0) > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1.5 text-sm font-medium">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              {stats.byStatus.IN_PROGRESS} En cours
            </Badge>
          )}

          {(stats.byStatus?.TODO || 0) > 0 && (
            <Badge className="bg-gray-100 text-gray-700 border-gray-300 px-3 py-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {stats.byStatus.TODO} À faire
            </Badge>
          )}

          {(stats.byStatus?.COMPLETED || 0) > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5 text-sm font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {stats.byStatus.COMPLETED} Terminé
            </Badge>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Type Stats */}
          {(stats.byType?.DIAGNOSTIC_PENDING || 0) > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 px-3 py-1.5 text-sm font-medium">
              <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
              {stats.byType.DIAGNOSTIC_PENDING} Diagnostics
            </Badge>
          )}

          {(stats.byType?.RENTAL_EXPIRING || 0) > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-300 px-3 py-1.5 text-sm font-medium">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              {stats.byType.RENTAL_EXPIRING} Locations
            </Badge>
          )}

          {(stats.byType?.PAYMENT_DUE || 0) > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-300 px-3 py-1.5 text-sm font-medium">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              {stats.byType.PAYMENT_DUE} Paiements
            </Badge>
          )}

          {(stats.byType?.APPOINTMENT_REMINDER || 0) > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5 text-sm font-medium">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {stats.byType.APPOINTMENT_REMINDER} RDV
            </Badge>
          )}
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
            const dayTasks = tasks.filter(task => {
              const taskDate = new Date(task.dueDate || task.startDate);
              return taskDate.toDateString() === day.toDateString();
            });

            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIndex}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-gray-100 transition-colors",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isToday && isCurrentMonth && "bg-blue-50"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('day');
                }}
              >
                <div className={cn(
                  "text-sm font-medium mb-2",
                  isToday && isCurrentMonth && "text-blue-600"
                )}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => renderTaskCard(task, true))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 p-1">
                      +{dayTasks.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    });

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((day, index) => {
            const dayTasks = tasks.filter(task => {
              const taskDate = new Date(task.dueDate || task.startDate);
              return taskDate.toDateString() === day.toDateString();
            });

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[400px] p-3 border-r cursor-pointer hover:bg-gray-50 transition-colors",
                  isToday && "bg-blue-50"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('day');
                }}
              >
                <div className="text-center mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={cn(
                    "text-2xl font-bold mt-1",
                    isToday && "text-blue-600"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(day, 'MMMM yyyy', { locale: fr })}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayTasks.length > 0 ? (
                    <>
                      {dayTasks.slice(0, 8).map(task => renderTaskCard(task, true))}
                      {dayTasks.length > 8 && (
                        <div className="text-xs text-center text-gray-500 p-2 bg-gray-50 rounded">
                          +{dayTasks.length - 8} autres tâches
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-center text-gray-400 py-4">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate || task.startDate);
      return taskDate.toDateString() === selectedDate.toDateString();
    });

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Group tasks by status
    const tasksByStatus = {
      OVERDUE: dayTasks.filter(t => t.status === 'OVERDUE'),
      IN_PROGRESS: dayTasks.filter(t => t.status === 'IN_PROGRESS'),
      TODO: dayTasks.filter(t => t.status === 'TODO'),
      COMPLETED: dayTasks.filter(t => t.status === 'COMPLETED')
    };

    return (
      <div className="space-y-4">
        {/* Compact Day Header */}
        <div className={cn(
          "bg-white p-4 rounded-lg border flex items-center justify-between",
          isToday && "border-blue-500 bg-blue-50"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "text-4xl font-bold",
              isToday ? "text-blue-600" : "text-gray-900"
            )}>
              {format(selectedDate, 'd')}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase">
                {format(selectedDate, 'EEEE', { locale: fr })}
              </div>
              <div className="text-sm text-gray-600">
                {format(selectedDate, 'MMMM yyyy', { locale: fr })}
              </div>
            </div>
            {isToday && (
              <Badge className="bg-blue-500">Aujourd'hui</Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{tasksByStatus.OVERDUE.length}</p>
              <p className="text-xs text-gray-600">En retard</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{tasksByStatus.IN_PROGRESS.length}</p>
              <p className="text-xs text-gray-600">En cours</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600">{tasksByStatus.TODO.length}</p>
              <p className="text-xs text-gray-600">À faire</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{tasksByStatus.COMPLETED.length}</p>
              <p className="text-xs text-gray-600">Terminé</p>
            </div>
          </div>
        </div>

        {/* Tasks by Status */}
        {dayTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border text-center">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucune tâche pour ce jour</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overdue Tasks */}
            {tasksByStatus.OVERDUE.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-600">En retard</h3>
                  <Badge variant="outline" className="bg-red-50 text-red-700 text-xs h-5">
                    {tasksByStatus.OVERDUE.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByStatus.OVERDUE.map(task => renderTaskCard(task))}
                </div>
              </div>
            )}

            {/* In Progress Tasks */}
            {tasksByStatus.IN_PROGRESS.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-blue-600">En cours</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs h-5">
                    {tasksByStatus.IN_PROGRESS.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByStatus.IN_PROGRESS.map(task => renderTaskCard(task))}
                </div>
              </div>
            )}

            {/* TODO Tasks */}
            {tasksByStatus.TODO.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-600">À faire</h3>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs h-5">
                    {tasksByStatus.TODO.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByStatus.TODO.map(task => renderTaskCard(task))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {tasksByStatus.COMPLETED.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-green-600">Terminé</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs h-5">
                    {tasksByStatus.COMPLETED.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByStatus.COMPLETED.map(task => renderTaskCard(task))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const groupedTasks = tasks.reduce((acc, task) => {
      if (!acc[task.type]) {
        acc[task.type] = [];
      }
      acc[task.type].push(task);
      return acc;
    }, {} as Record<string, ComprehensiveTask[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([type, typeTasks]) => {
          const config = taskTypeConfig[type as keyof typeof taskTypeConfig];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-4">
                <config.icon className={cn("h-5 w-5", config.color)} />
                <h2 className="text-lg font-semibold">{config.label}</h2>
                <Badge variant="outline">{typeTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {typeTasks.map(task => renderTaskCard(task))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Calendar className="h-12 w-12 animate-spin text-blue-600" />
          <span className="text-slate-600 font-medium">Chargement du calendrier...</span>
        </div>
      </div>
    );
  }

  // Task Details Dialog Component
  const TaskDetailsDialog = () => {
    if (!selectedTask) return null;

    const config = taskTypeConfig[selectedTask.type] || taskTypeConfig.TASK;
    const Icon = config.icon;

    return (
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded", config.bgColor)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-base">{selectedTask.title}</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {config.label} • {format(new Date(selectedTask.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Status and Priority */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Statut:</span>
                {getStatusBadge(selectedTask.status)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Priorité:</span>
                {getPriorityBadge(selectedTask.priority)}
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                {selectedTask.description}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-500 mb-1">Début</div>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(selectedTask.startDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
              {selectedTask.dueDate && (
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-orange-600 mb-1">Échéance</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-orange-500" />
                    <span className="text-gray-700 font-medium">
                      {format(new Date(selectedTask.dueDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Assignment */}
            {selectedTask.assignedTo ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-100 text-xs">
                    {`${selectedTask.assignedTo.firstName[0]}${selectedTask.assignedTo.lastName[0]}`}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedTask.assignedTo.firstName} {selectedTask.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{selectedTask.assignedTo.role}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-800">Non assigné</span>
              </div>
            )}

            {/* Client Information */}
            {selectedTask.client && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gray-200 text-xs">
                    {getClientInitials(selectedTask.client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedTask.client.name}
                    {selectedTask.client.type === 'company' && (
                      <Building2 className="h-3 w-3 text-gray-400 inline-block ml-1" />
                    )}
                  </p>
                  {selectedTask.client.telephone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{selectedTask.client.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Related Data */}
            {selectedTask.relatedData && (
              <div className="grid grid-cols-2 gap-2">
                {selectedTask.relatedData.deviceName && (
                  <div className="flex items-center gap-1.5 bg-purple-50 p-1.5 rounded">
                    <Stethoscope className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-medium text-gray-700 truncate">{selectedTask.relatedData.deviceName}</span>
                  </div>
                )}
                {selectedTask.relatedData.amount && (
                  <div className="flex items-center gap-1.5 bg-green-50 p-1.5 rounded">
                    <CreditCard className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-gray-700">{selectedTask.relatedData.amount.toFixed(2)} TND</span>
                  </div>
                )}
                {selectedTask.relatedData.bonNumber && (
                  <div className="flex items-center gap-1.5 bg-indigo-50 p-1.5 rounded col-span-2">
                    <Hash className="h-3 w-3 text-indigo-500" />
                    <span className="text-xs font-medium text-gray-700">Bon: {selectedTask.relatedData.bonNumber}</span>
                  </div>
                )}
              </div>
            )}

            {/* Codes for reference */}
            {(selectedTask.relatedData?.diagnosticCode || selectedTask.relatedData?.rentalCode ||
              selectedTask.relatedData?.appointmentCode || selectedTask.relatedData?.paymentCode || selectedTask.relatedData?.saleCode) && (
              <div className="flex flex-wrap gap-1">
                {selectedTask.relatedData.diagnosticCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    Diag: {selectedTask.relatedData.diagnosticCode}
                  </Badge>
                )}
                {selectedTask.relatedData.rentalCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    Loc: {selectedTask.relatedData.rentalCode}
                  </Badge>
                )}
                {selectedTask.relatedData.appointmentCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    RDV: {selectedTask.relatedData.appointmentCode}
                  </Badge>
                )}
                {selectedTask.relatedData.paymentCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    Paie: {selectedTask.relatedData.paymentCode}
                  </Badge>
                )}
                {selectedTask.relatedData.saleCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    Vente: {selectedTask.relatedData.saleCode}
                  </Badge>
                )}
              </div>
            )}

            {/* Notes Editor - Only for TASK and APPOINTMENT_REMINDER */}
            {(selectedTask.type === 'TASK' || selectedTask.type === 'APPOINTMENT_REMINDER') && (
              <div className="space-y-2">
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="task-notes" className="text-sm font-medium">
                      Notes
                    </Label>
                    {editedNotes !== (selectedTask.notes || '') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="h-7 text-xs"
                      >
                        {isSavingNotes ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="task-notes"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Ajouter des notes..."
                    className="min-h-[80px] text-sm resize-none"
                    disabled={isSavingNotes}
                  />
                </div>
              </div>
            )}

            {/* Completion Info */}
            {selectedTask.completedAt && (
              <div className="p-2 bg-green-50 rounded">
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    Terminé le {format(new Date(selectedTask.completedAt), 'dd/MM/yyyy', { locale: fr })}
                    {selectedTask.completedBy && ` par ${selectedTask.completedBy}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsDetailsDialogOpen(false)}>
              Fermer
            </Button>
            {/* Show "Marquer comme terminé" only for TASK and APPOINTMENT_REMINDER */}
            {(selectedTask.type === 'TASK' || selectedTask.type === 'APPOINTMENT_REMINDER') &&
             selectedTask.status !== 'COMPLETED' && (
              <Button
                size="sm"
                onClick={handleCompleteTask}
                disabled={isCompletingTask}
                className="gap-1.5 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                {isCompletingTask ? 'En cours...' : 'Marquer comme terminé'}
              </Button>
            )}
            {/* Show "Voir les détails" for all types */}
            {selectedTask.actionUrl && (
              <Button size="sm" onClick={handleRedirectToDetails} className="gap-1.5">
                <Eye className="h-3 w-3" />
                Voir les détails
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Tous les types</span>
                </div>
              </SelectItem>
              <SelectItem value="tasks">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Tâches</span>
                </div>
              </SelectItem>
              <SelectItem value="diagnostics">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span>Diagnostics</span>
                </div>
              </SelectItem>
              <SelectItem value="appointments">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>Rendez-vous</span>
                </div>
              </SelectItem>
              <SelectItem value="rentals">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <span>Locations (Expiration)</span>
                </div>
              </SelectItem>
              <SelectItem value="RENTAL_ALERT">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <span>Rappels Location</span>
                </div>
              </SelectItem>
              <SelectItem value="RENTAL_TITRATION">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-pink-600" />
                  <span>Rappels Titration</span>
                </div>
              </SelectItem>
              <SelectItem value="RENTAL_APPOINTMENT">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>RDV Locations</span>
                </div>
              </SelectItem>
              <SelectItem value="payments">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span>Paiements Dus</span>
                </div>
              </SelectItem>
              <SelectItem value="PAYMENT_PERIOD_END">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <span>Fin Périodes Paiement</span>
                </div>
              </SelectItem>
              <SelectItem value="sales">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span>Ventes (Rappels)</span>
                </div>
              </SelectItem>
              <SelectItem value="SALE_RAPPEL_2YEARS">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span>Rappels Accessoires (2 ans)</span>
                </div>
              </SelectItem>
              <SelectItem value="SALE_RAPPEL_7YEARS">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span>Rappels Appareil (7 ans)</span>
                </div>
              </SelectItem>
              <SelectItem value="cnam">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Renouvellements CNAM</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={assignedUserId} onValueChange={setAssignedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assigné à" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {usersData?.users?.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    <Badge variant="outline" className="text-xs ml-1">
                      {user.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Navigation - Only show for date-based views */}
          {viewMode !== 'list' && (
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (viewMode === 'month') {
                    setSelectedDate(subMonths(selectedDate, 1));
                  } else if (viewMode === 'week') {
                    setSelectedDate(subWeeks(selectedDate, 1));
                  } else if (viewMode === 'day') {
                    setSelectedDate(addDays(selectedDate, -1));
                  }
                }}
                className="hover:bg-gray-100"
                title={
                  viewMode === 'month' ? 'Mois précédent' :
                  viewMode === 'week' ? 'Semaine précédente' :
                  'Jour précédent'
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedDate.toDateString() === new Date().toDateString() ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="min-w-[100px] hover:bg-blue-50"
              >
                {selectedDate.toDateString() === new Date().toDateString() ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Aujourd'hui
                  </span>
                ) : (
                  "Aujourd'hui"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (viewMode === 'month') {
                    setSelectedDate(addMonths(selectedDate, 1));
                  } else if (viewMode === 'week') {
                    setSelectedDate(addWeeks(selectedDate, 1));
                  } else if (viewMode === 'day') {
                    setSelectedDate(addDays(selectedDate, 1));
                  }
                }}
                className="hover:bg-gray-100"
                title={
                  viewMode === 'month' ? 'Mois suivant' :
                  viewMode === 'week' ? 'Semaine suivante' :
                  'Jour suivant'
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* View Mode */}
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Mois</span>
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Semaine</span>
                </div>
              </SelectItem>
              <SelectItem value="day">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Jour</span>
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Liste</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(filter !== 'all' || assignedUserId !== 'all') && (
            <Button
              onClick={() => {
                setFilter('all');
                setAssignedUserId('all');
              }}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Réinitialiser filtres
            </Button>
          )}

          {/* Hide Completed Toggle */}
          <Button
            onClick={() => setHideCompleted(!hideCompleted)}
            variant={hideCompleted ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            {hideCompleted ? 'Afficher terminées' : 'Masquer terminées'}
          </Button>

          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Current Period Info - Simplified */}
      <div className="mb-6">
        <div className="bg-white px-4 py-3 rounded-lg border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'month' && format(selectedDate, 'MMMM yyyy', { locale: fr })}
              {viewMode === 'week' && `Semaine du ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMMM yyyy', { locale: fr })}`}
              {viewMode === 'day' && format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
              {viewMode === 'list' && 'Vue d\'ensemble des tâches'}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50 text-sm">
                {tasks.length} tâche{tasks.length !== 1 ? 's' : ''}
              </Badge>
              {filter !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                  <Filter className="h-3 w-3 mr-1" />
                  {filter === 'tasks' ? 'Tâches' :
                   filter === 'diagnostics' ? 'Diagnostics' :
                   filter === 'appointments' ? 'Rendez-vous' :
                   filter === 'rentals' ? 'Locations' :
                   filter === 'RENTAL_ALERT' ? 'Rappels' :
                   filter === 'RENTAL_TITRATION' ? 'Titration' :
                   filter === 'RENTAL_APPOINTMENT' ? 'RDV Location' :
                   filter === 'payments' ? 'Paiements' :
                   filter === 'PAYMENT_PERIOD_END' ? 'Fin Périodes' :
                   filter === 'sales' ? 'Ventes' :
                   filter === 'SALE_RAPPEL_2YEARS' ? 'Rappels 2 ans' :
                   filter === 'SALE_RAPPEL_7YEARS' ? 'Rappels 7 ans' :
                   filter === 'cnam' ? 'CNAM' : filter}
                </Badge>
              )}
              {assignedUserId !== 'all' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-sm">
                  <Users className="h-3 w-3 mr-1" />
                  {usersData?.users?.find((u: any) => u.id === assignedUserId)?.name || assignedUserId}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'list' && renderListView()}

      {tasks.length === 0 && viewMode !== 'day' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune tâche trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              Modifiez les filtres ou la période pour voir plus de tâches
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task Details Dialog */}
      <TaskDetailsDialog />
    </div>
  );
}

// Add layout wrapper
ModernTasksPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};