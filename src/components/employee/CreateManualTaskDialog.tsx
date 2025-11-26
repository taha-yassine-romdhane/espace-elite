import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, User, Phone, Search } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  patientCode?: string;
}

interface ManualTask {
  taskType: string;
  patientId: string;
  assignedToId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  adminNotes?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

const TASK_TYPES = [
  { value: 'POLYGRAPHIE', label: 'Polygraphie' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RECUPERATION', label: 'Récupération' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' }
];

interface PatientSelectionDialogProps {
  patients: Patient[];
  selectedPatientId: string | undefined;
  onSelect: (patientId: string) => void;
}

function PatientSelectionDialog({ patients, selectedPatientId, onSelect }: PatientSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const telephone = patient.telephone?.toLowerCase() || '';
    return fullName.includes(searchLower) || telephone.includes(searchLower);
  });

  const handleSelect = (patientId: string) => {
    onSelect(patientId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <User className="h-4 w-4 mr-2" />
        {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Sélectionner un patient"}
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner un patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-2">
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun patient trouvé</p>
              ) : (
                filteredPatients.map((patient) => (
                  <Button
                    key={patient.id}
                    type="button"
                    variant={selectedPatientId === patient.id ? "default" : "outline"}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleSelect(patient.id)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                      {patient.telephone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{patient.telephone}</span>
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateManualTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateManualTaskDialog({ open, onOpenChange }: CreateManualTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [taskData, setTaskData] = useState<Partial<ManualTask>>({
    taskType: 'CONSULTATION',
    priority: 'MEDIUM',
    status: 'PENDING',
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/users/employees-stats");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await fetch("/api/patients");
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<ManualTask>) => {
      const response = await fetch("/api/manual-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualTasks"] });
      toast({ title: "Succès", description: "Tâche créée avec succès" });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setTaskData({
      taskType: 'CONSULTATION',
      priority: 'MEDIUM',
      status: 'PENDING',
    });
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskData.patientId || !taskData.assignedToId) {
      toast({
        title: "Erreur",
        description: "Patient et employé sont requis",
        variant: "destructive"
      });
      return;
    }

    await createMutation.mutateAsync(taskData);
  };

  const selectedPatient = patients.find((p: Patient) => p.id === taskData.patientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <ClipboardList className="h-5 w-5" />
            Créer une Nouvelle Tâche
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de tâche *</label>
            <Select
              value={taskData.taskType}
              onValueChange={(value) => setTaskData({ ...taskData, taskType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient *</label>
            <PatientSelectionDialog
              patients={patients}
              selectedPatientId={taskData.patientId}
              onSelect={(patientId) => setTaskData({ ...taskData, patientId })}
            />
            {selectedPatient?.patientCode && (
              <p className="text-xs text-muted-foreground font-mono">
                Code: {selectedPatient.patientCode}
              </p>
            )}
            {selectedPatient?.telephone && (
              <p className="text-xs text-muted-foreground">
                Tél: {selectedPatient.telephone}
              </p>
            )}
          </div>

          {/* Employee Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assigner à *</label>
            <Select
              value={taskData.assignedToId}
              onValueChange={(value) => setTaskData({ ...taskData, assignedToId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: Employee) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorité</label>
            <Select
              value={taskData.priority}
              onValueChange={(value) => setTaskData({ ...taskData, priority: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <Textarea
              value={taskData.adminNotes || ''}
              onChange={(e) => setTaskData({ ...taskData, adminNotes: e.target.value })}
              placeholder="Ajouter des notes pour cette tâche..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-900 hover:bg-blue-700"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
