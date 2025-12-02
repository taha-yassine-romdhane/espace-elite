import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, ChevronLeft, ChevronRight, ClipboardCheck, CheckCircle, Calendar, User, Filter, ChevronDown, Phone } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Textarea } from "@/components/ui/textarea";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
}

interface ManualTask {
  id: string;
  taskCode?: string;
  taskType: string;
  patientId: string;
  patient?: Patient;
  assignedToId: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  adminNotes?: string;
  employeeNotes?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  completedAt?: Date | string;
  createdAt: Date | string;
}

const TASK_TYPES = [
  { value: 'POLYGRAPHIE', label: 'Polygraphie' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RECUPERATION', label: 'Récupération' }
];

const TASK_TYPES_LABELS: Record<string, string> = {
  POLYGRAPHIE: 'Polygraphie',
  CONSULTATION: 'Consultation',
  LOCATION: 'Location',
  VENTE: 'Vente',
  MAINTENANCE: 'Maintenance',
  RECUPERATION: 'Récupération'
};

const PRIORITIES = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' }
];

const STATUSES = ['PENDING', 'COMPLETED'];

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: 'En attente',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé'
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getTaskTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    POLYGRAPHIE: 'bg-purple-100 text-purple-800 border-purple-200',
    CONSULTATION: 'bg-blue-100 text-blue-800 border-blue-200',
    LOCATION: 'bg-green-100 text-green-800 border-green-200',
    VENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
    RECUPERATION: 'bg-teal-100 text-teal-800 border-teal-200'
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    LOW: 'Faible',
    MEDIUM: 'Moyenne',
    HIGH: 'Haute'
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-300',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-300',
    HIGH: 'bg-red-100 text-red-700 border-red-300'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function EmployeeManualTasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [employeeNotes, setEmployeeNotes] = useState<string>('');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentTask, setAppointmentTask] = useState<ManualTask | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    scheduledDate: '',
    location: '',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    notes: '',
  });

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING'); // Default to pending tasks
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false); // Mobile filter toggle

  // Fetch manual tasks (only assigned to this employee)
  const { data: tasks = [] } = useQuery({
    queryKey: ["manualTasks"],
    queryFn: async () => {
      const response = await fetch("/api/manual-tasks");
      if (!response.ok) throw new Error("Failed to fetch manual tasks");
      return response.json();
    },
  });

  // Apply filters
  const filteredTasks = tasks.filter((task: ManualTask) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const patientName = task.patient ? `${task.patient.firstName} ${task.patient.lastName}`.toLowerCase() : '';
      const patientPhone = task.patient?.telephone?.toLowerCase() || '';

      if (!patientName.includes(search) && !patientPhone.includes(search)) {
        return false;
      }
    }

    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && task.taskType !== typeFilter) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; employeeNotes: string; status: string }) => {
      const response = await fetch(`/api/manual-tasks/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualTasks"] });
      toast({ title: "Succès", description: "Tâche marquée comme terminée" });
      setCompletingId(null);
      setEmployeeNotes('');
    },
    onError: () => {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointment: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualTasks"] });
      toast({ title: "Succès", description: "Rendez-vous créé avec succès" });
      setAppointmentDialogOpen(false);
      setAppointmentTask(null);
      setAppointmentData({
        scheduledDate: '',
        location: '',
        priority: 'NORMAL',
        status: 'SCHEDULED',
        notes: '',
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleStartComplete = (task: ManualTask) => {
    setCompletingId(task.id);
    setEmployeeNotes(task.employeeNotes || '');
  };

  const handleCancelComplete = () => {
    setCompletingId(null);
    setEmployeeNotes('');
  };

  const handleCompleteTask = async (task: ManualTask) => {
    await updateMutation.mutateAsync({
      id: task.id,
      employeeNotes,
      status: 'COMPLETED',
    });
  };

  const handleOpenAppointmentDialog = (task: ManualTask) => {
    // Pre-fill the appointment with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9:00 AM

    setAppointmentTask(task);
    setAppointmentData({
      scheduledDate: tomorrow.toISOString().slice(0, 16), // Format for datetime-local input
      location: '',
      priority: 'NORMAL',
      status: 'SCHEDULED',
      notes: `Rendez-vous pour ${TASK_TYPES_LABELS[task.taskType] || task.taskType}`,
    });
    setAppointmentDialogOpen(true);
  };

  const handleCreateAppointment = () => {
    if (!appointmentTask) return;

    if (!appointmentData.scheduledDate || !appointmentData.location) {
      toast({
        title: "Erreur",
        description: "Date et lieu sont requis",
        variant: "destructive"
      });
      return;
    }

    createAppointmentMutation.mutate({
      patientId: appointmentTask.patientId,
      appointmentType: appointmentTask.taskType,
      scheduledDate: new Date(appointmentData.scheduledDate),
      location: appointmentData.location,
      priority: appointmentData.priority,
      status: appointmentData.status,
      notes: appointmentData.notes,
    });
  };

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'PENDING' || typeFilter !== 'ALL' || priorityFilter !== 'ALL' || searchTerm;

  return (
    <div className="px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 md:h-8 md:w-8" />
            Mes Tâches
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} assignée{filteredTasks.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 self-start"
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {hasActiveFilters && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white text-xs">
              !
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Filters - Collapsible on mobile */}
      <div className={`space-y-3 bg-gray-50 p-3 md:p-4 rounded-lg border ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par patient, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filter dropdowns - Grid on mobile */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              {STATUSES.map(status => (
                <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous types</SelectItem>
              {TASK_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes</SelectItem>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('PENDING');
                setTypeFilter('ALL');
                setPriorityFilter('ALL');
                setSearchTerm('');
              }}
              className="h-9 text-xs md:text-sm col-span-1"
            >
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedTasks.map((task: ManualTask) => {
          const isCompleting = completingId === task.id;
          return (
            <div
              key={task.id}
              className={`bg-white border rounded-lg p-3 space-y-3 ${isCompleting ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${getTaskTypeColor(task.taskType)}`}>
                    {TASK_TYPES_LABELS[task.taskType] || task.taskType}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                  {getStatusLabel(task.status)}
                </Badge>
              </div>

              {/* Patient Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {task.patient ? (
                    <Link
                      href={`/roles/employee/renseignement/patient/${task.patientId}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {`${task.patient.firstName} ${task.patient.lastName}`}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
                {task.patient?.telephone && (
                  <a href={`tel:${task.patient.telephone}`} className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {task.patient.telephone}
                  </a>
                )}
              </div>

              {/* Notes */}
              {task.adminNotes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">Note admin:</span> {task.adminNotes}
                </div>
              )}

              {/* Employee Notes Input (when completing) */}
              {isCompleting && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Mes notes:</label>
                  <Textarea
                    value={employeeNotes}
                    onChange={(e) => setEmployeeNotes(e.target.value)}
                    placeholder="Ajouter vos notes..."
                    className="h-16 text-sm"
                  />
                </div>
              )}

              {/* Footer with date and actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-gray-400">
                  {format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenAppointmentDialog(task)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-blue-600 border-blue-200"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    RDV
                  </Button>

                  {task.status === 'PENDING' && (
                    <>
                      {isCompleting ? (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleCompleteTask(task)}
                            size="sm"
                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Valider
                          </Button>
                          <Button
                            onClick={handleCancelComplete}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartComplete(task)}
                          size="sm"
                          className="h-8 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Terminer
                        </Button>
                      )}
                    </>
                  )}
                  {task.status === 'COMPLETED' && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2">
                      <CheckCircle className="h-3 w-3" />
                      Terminé
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="px-2 py-3 text-left font-medium text-xs">Code</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Type</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Patient</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Téléphone</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Priorité</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Notes Admin</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Mes Notes</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Statut</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Date création</th>
                <th className="px-2 py-3 text-left font-medium text-xs">Date terminé</th>
                <th className="px-2 py-3 text-center font-medium text-xs sticky right-0 bg-gray-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task: ManualTask) => {
                const isCompleting = completingId === task.id;
                return (
                  <tr key={task.id} className={`border-b ${isCompleting ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                        {task.taskCode || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className={`text-xs ${getTaskTypeColor(task.taskType)}`}>
                        {TASK_TYPES_LABELS[task.taskType] || task.taskType}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      {task.patient ? (
                        <Link
                          href={`/roles/employee/renseignement/patient/${task.patientId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {`${task.patient.firstName} ${task.patient.lastName}`}
                        </Link>
                      ) : (
                        <span className="text-xs">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs">{task.patient?.telephone || '-'}</span>
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs">{task.adminNotes || '-'}</span>
                    </td>
                    <td className="px-2 py-2">
                      {isCompleting ? (
                        <Textarea
                          value={employeeNotes}
                          onChange={(e) => setEmployeeNotes(e.target.value)}
                          placeholder="Ajouter vos notes..."
                          className="h-16 text-xs"
                        />
                      ) : (
                        <span className="text-xs">{task.employeeNotes || '-'}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs">
                        {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs">
                        {task.completedAt ? format(new Date(task.completedAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 sticky right-0 bg-white">
                      <div className="flex gap-1 justify-center">
                        {/* RDV Button - Always visible */}
                        <Button
                          onClick={() => handleOpenAppointmentDialog(task)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          title="Créer un rendez-vous"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>

                        {/* Complete Task Actions */}
                        {task.status === 'PENDING' && (
                          <>
                            {isCompleting ? (
                              <>
                                <Button
                                  onClick={() => handleCompleteTask(task)}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600 hover:bg-green-50"
                                  title="Marquer comme terminé"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={handleCancelComplete}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleStartComplete(task)}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Terminer
                              </Button>
                            )}
                          </>
                        )}
                        {task.status === 'COMPLETED' && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Terminé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {paginatedTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune tâche trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {filteredTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground hidden sm:inline">Afficher</span>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
              <SelectTrigger className="w-[70px] sm:w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} / {filteredTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm min-w-[80px] text-center">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Appointment Creation Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-blue-600 text-base">
              <Calendar className="h-4 w-4" />
              Créer un Rendez-vous
            </DialogTitle>
          </DialogHeader>
          {appointmentTask && (
            <div className="space-y-3 py-2">
              {/* Patient Info - Compact */}
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">
                      {appointmentTask.patient ? `${appointmentTask.patient.firstName} ${appointmentTask.patient.lastName}` : 'N/A'}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getTaskTypeColor(appointmentTask.taskType)}`}>
                    {TASK_TYPES_LABELS[appointmentTask.taskType] || appointmentTask.taskType}
                  </Badge>
                </div>
              </div>

              {/* Date and Location - Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Date et heure *</label>
                  <Input
                    type="datetime-local"
                    value={appointmentData.scheduledDate}
                    onChange={(e) => setAppointmentData({ ...appointmentData, scheduledDate: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Lieu *</label>
                  <Input
                    type="text"
                    value={appointmentData.location}
                    onChange={(e) => setAppointmentData({ ...appointmentData, location: e.target.value })}
                    placeholder="Cabinet, Domicile..."
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Priority and Status - Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Priorité</label>
                  <Select
                    value={appointmentData.priority}
                    onValueChange={(value) => setAppointmentData({ ...appointmentData, priority: value })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Faible</SelectItem>
                      <SelectItem value="NORMAL">Normale</SelectItem>
                      <SelectItem value="HIGH">Élevée</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Statut</label>
                  <Select
                    value={appointmentData.status}
                    onValueChange={(value) => setAppointmentData({ ...appointmentData, status: value })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Planifié</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes - Compact */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Notes</label>
                <Textarea
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setAppointmentDialogOpen(false)}
              disabled={createAppointmentMutation.isPending}
              className="h-8 text-xs"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {createAppointmentMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
