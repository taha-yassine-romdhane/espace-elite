import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, User, MapPin, Clock, ChevronLeft, Search, Phone, UserCheck, Plus, CheckCircle2, Circle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  telephone?: string;
  patientCode?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

interface Step {
  id: number;
  name: string;
  description: string;
}

const STEPS: readonly Step[] = [
  { id: 1, name: "Sélection Patient", description: "Choisir le patient" },
  { id: 2, name: "Détails", description: "Informations du rendez-vous" },
] as const;

const APPOINTMENT_TYPES = [
  { value: 'POLYGRAPHIE', label: 'Polygraphie' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RECUPERATION', label: 'Récupération' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Faible', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIGH', label: 'Élevée', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' }
];

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  'POLYGRAPHIE': 'Polygraphie',
  'CONSULTATION': 'Consultation',
  'LOCATION': 'Location',
  'VENTE': 'Vente',
  'MAINTENANCE': 'Maintenance',
  'RECUPERATION': 'Récupération'
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  'LOW': { label: 'Faible', color: 'bg-gray-100 text-gray-700' },
  'NORMAL': { label: 'Normal', color: 'bg-green-100 text-green-700' },
  'HIGH': { label: 'Élevée', color: 'bg-orange-100 text-orange-700' },
  'URGENT': { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

// Stepper Sidebar Component
function AppointmentStepperSidebar({
  steps,
  currentStep,
  patientDetails,
  appointmentData
}: {
  steps: readonly Step[];
  currentStep: number;
  patientDetails: { id: string; name: string; telephone?: string; patientCode?: string } | null;
  appointmentData?: { appointmentType?: string; scheduledDate?: string; location?: string; priority?: string };
}) {
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const dateTime = formatDateTime(appointmentData?.scheduledDate);

  return (
    <div className="w-80 border-r flex-shrink-0 flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <div className="p-4 border-b bg-green-50 sticky top-0">
        <h3 className="font-semibold text-green-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nouveau Rendez-vous
        </h3>
      </div>

      <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Patient Info Card */}
        {patientDetails && (
          <div className="mb-6 overflow-hidden rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm">
            <div className="bg-green-600 p-3 text-white">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">{patientDetails.name}</h4>
                  {patientDetails.patientCode && (
                    <p className="text-xs text-green-100">Code: {patientDetails.patientCode}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 text-sm space-y-2">
              {patientDetails.telephone && (
                <div className="flex items-center gap-2 text-green-800">
                  <Phone className="h-4 w-4" />
                  <span>{patientDetails.telephone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Summary */}
        {appointmentData && (appointmentData.appointmentType || appointmentData.scheduledDate || appointmentData.location) && (
          <div className="mb-6 rounded-lg border border-green-200 overflow-hidden">
            <div className="bg-green-50 px-3 py-2 font-medium text-green-700 border-b flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Détails du Rendez-vous
            </div>
            <div className="p-3 space-y-3">
              {appointmentData.appointmentType && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">
                    {APPOINTMENT_TYPE_LABELS[appointmentData.appointmentType] || appointmentData.appointmentType}
                  </span>
                </div>
              )}
              {dateTime && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-gray-600">Date et heure:</div>
                    <div className="font-medium text-gray-900 capitalize">{dateTime.date}</div>
                    <div className="font-medium text-green-600">{dateTime.time}</div>
                  </div>
                </div>
              )}
              {appointmentData.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Lieu:</span>
                  <span className="font-medium text-gray-900">{appointmentData.location}</span>
                </div>
              )}
              {appointmentData.priority && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Priorité:</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    PRIORITY_LABELS[appointmentData.priority]?.color || 'bg-gray-100 text-gray-700'
                  )}>
                    {PRIORITY_LABELS[appointmentData.priority]?.label || appointmentData.priority}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="relative space-y-6 mt-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="relative">
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-0 left-5 w-0.5 h-6 -translate-y-6",
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-10 w-10 text-green-600 fill-green-100" />
                    ) : isActive ? (
                      <div className="h-10 w-10 rounded-full border-2 border-green-600 bg-green-50 flex items-center justify-center text-green-600 font-medium">
                        {step.id}
                      </div>
                    ) : (
                      <Circle className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className={cn(
                      "font-medium",
                      isActive ? "text-green-600" : isCompleted ? "text-green-700" : "text-gray-400"
                    )}>
                      {step.name}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isActive || isCompleted ? "text-gray-600" : "text-gray-400"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Badge */}
      <div className="p-4 border-t bg-gradient-to-r from-green-50 to-emerald-50 sticky bottom-0">
        <div className="flex justify-center">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            currentStep === steps.length ? 'bg-green-600 text-white' : 'bg-green-600 text-white'
          )}>
            {currentStep === steps.length ? 'Prêt à créer' : 'En cours'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateAppointmentDialog({ open, onOpenChange, isAdmin = false }: CreateAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [appointmentData, setAppointmentData] = useState({
    appointmentType: 'CONSULTATION',
    scheduledDate: '',
    location: '',
    notes: '',
    priority: 'NORMAL',
    status: 'SCHEDULED'
  });

  // Fetch patients (all for admin, only assigned for employee)
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", isAdmin ? "all" : "assignedToMe"],
    queryFn: async () => {
      const url = isAdmin
        ? "/api/renseignements/patients"
        : "/api/renseignements/patients?assignedToMe=true";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return data.patients || [];
    },
    enabled: open && !!session,
  });

  const patients: Patient[] = patientsData || [];

  // Fetch employees (only for admin)
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/users/employees-stats");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    enabled: open && isAdmin,
  });

  const employees: Employee[] = employeesData || [];

  // Filter patients based on search
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const telephone = patient.telephone?.toLowerCase() || '';
    const patientCode = patient.patientCode?.toLowerCase() || '';
    return fullName.includes(searchLower) || telephone.includes(searchLower) || patientCode.includes(searchLower);
  });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create appointment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Succès", description: "Rendez-vous créé avec succès" });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive"
      });
    },
  });

  const handleClose = () => {
    setStep(1);
    setSelectedPatient(null);
    setSearchQuery('');
    setSelectedEmployeeId('');
    setAppointmentData({
      appointmentType: 'CONSULTATION',
      scheduledDate: '',
      location: '',
      notes: '',
      priority: 'NORMAL',
      status: 'SCHEDULED'
    });
    onOpenChange(false);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un patient", variant: "destructive" });
      return;
    }

    if (!appointmentData.scheduledDate || !appointmentData.location) {
      toast({ title: "Erreur", description: "Date et lieu sont requis", variant: "destructive" });
      return;
    }

    if (isAdmin && !selectedEmployeeId) {
      toast({ title: "Erreur", description: "Veuillez assigner un employé", variant: "destructive" });
      return;
    }

    const payload = {
      patientId: selectedPatient.id,
      appointmentType: appointmentData.appointmentType,
      scheduledDate: new Date(appointmentData.scheduledDate),
      location: appointmentData.location,
      notes: appointmentData.notes,
      priority: appointmentData.priority,
      status: appointmentData.status,
      assignedToId: isAdmin ? selectedEmployeeId : session?.user?.id
    };

    await createMutation.mutateAsync(payload);
  };

  const updateField = (field: string, value: string) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-hidden p-0 flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex h-full overflow-hidden">
          {/* Sidebar */}
          <AppointmentStepperSidebar
            steps={STEPS}
            currentStep={step}
            patientDetails={selectedPatient ? {
              id: selectedPatient.id,
              name: selectedPatient.name,
              telephone: selectedPatient.telephone,
              patientCode: selectedPatient.patientCode
            } : null}
            appointmentData={step === 2 ? {
              appointmentType: appointmentData.appointmentType,
              scheduledDate: appointmentData.scheduledDate,
              location: appointmentData.location,
              priority: appointmentData.priority
            } : undefined}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 p-4 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Nouveau Rendez-vous
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Step 1: Patient Selection */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-green-800 mb-2">Sélectionner un Patient</h2>
                      <p className="text-sm text-gray-600">Recherchez et sélectionnez le patient pour ce rendez-vous</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, téléphone, ou code patient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>

                    <ScrollArea className="h-[400px] rounded-lg border">
                      <div className="p-2 space-y-1">
                        {loadingPatients ? (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            Chargement des patients...
                          </div>
                        ) : filteredPatients.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            Aucun patient trouvé
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
                            <Button
                              key={patient.id}
                              variant="ghost"
                              className="w-full justify-start h-auto py-3 px-4 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-lg transition-all"
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <div className="flex flex-col items-start w-full">
                                <div className="flex items-center gap-2 w-full">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-green-600" />
                                  </div>
                                  <span className="font-medium text-gray-900">{patient.name}</span>
                                  {patient.patientCode && (
                                    <Badge variant="outline" className="text-xs ml-auto border-green-200 text-green-700">
                                      {patient.patientCode}
                                    </Badge>
                                  )}
                                </div>
                                {patient.telephone && (
                                  <span className="text-xs text-muted-foreground ml-10 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {patient.telephone}
                                  </span>
                                )}
                              </div>
                            </Button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Step 2: Appointment Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-green-800 mb-2">Détails du Rendez-vous</h2>
                      <p className="text-sm text-gray-600">Complétez les informations du rendez-vous</p>
                    </div>

                    {/* 2-Column Grid for Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Appointment Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          Type de rendez-vous <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={appointmentData.appointmentType}
                          onValueChange={(val) => updateField('appointmentType', val)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPOINTMENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Scheduled Date */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          Date et heure <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="datetime-local"
                          value={appointmentData.scheduledDate}
                          onChange={(e) => updateField('scheduledDate', e.target.value)}
                          className="h-11"
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          Lieu <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={appointmentData.location}
                          onChange={(e) => updateField('location', e.target.value)}
                          placeholder="Ex: Cabinet, Domicile du patient..."
                          className="h-11"
                        />
                      </div>

                      {/* Priority */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priorité</label>
                        <div className="flex gap-2">
                          {PRIORITIES.map(priority => (
                            <Button
                              key={priority.value}
                              type="button"
                              variant="outline"
                              size="sm"
                              className={`flex-1 ${appointmentData.priority === priority.value ? priority.color + ' border-2' : 'border'}`}
                              onClick={() => updateField('priority', priority.value)}
                            >
                              {priority.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Employee Assignment (Admin Only) */}
                      {isAdmin && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            Assigner à un employé <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={selectedEmployeeId}
                            onValueChange={setSelectedEmployeeId}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Sélectionner un employé" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                      <User className="h-3 w-3 text-green-600" />
                                    </div>
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Notes - Full Width Textarea */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={appointmentData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Notes additionnelles..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={step === 1 ? handleClose : handleBack}
              >
                {step === 1 ? (
                  <>Annuler</>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Retour
                  </>
                )}
              </Button>

              {step === 2 && (
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createMutation.isPending ? (
                    "Création..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le rendez-vous
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
