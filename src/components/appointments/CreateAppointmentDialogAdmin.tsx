import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, User, MapPin, Clock, ChevronLeft, Search, Phone, UserCheck, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentStepperSidebar } from "@/pages/roles/admin/dashboard/components/AppointmentStepperSidebar";

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

interface PreselectedPatient {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  patientCode?: string;
  telephone?: string;
}

interface CreateAppointmentDialogAdminProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatient?: PreselectedPatient;
}

const STEPS = [
  { id: 1, name: "Selection Patient", description: "Choisir le patient" },
  { id: 2, name: "Details", description: "Informations du rendez-vous" },
] as const;

const APPOINTMENT_TYPES = [
  { value: 'POLYGRAPHIE', label: 'Polygraphie' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RECUPERATION', label: 'Recuperation' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Faible', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIGH', label: 'Elevee', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' }
];

export function CreateAppointmentDialogAdmin({ open, onOpenChange, preselectedPatient }: CreateAppointmentDialogAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Determine if we should skip patient selection step
  const hasPreselectedPatient = !!preselectedPatient;
  const initialStep = hasPreselectedPatient ? 2 : 1;

  // Create preselected patient object
  const preselectedPatientData: Patient | null = preselectedPatient ? {
    id: preselectedPatient.id,
    firstName: preselectedPatient.firstName,
    lastName: preselectedPatient.lastName,
    name: preselectedPatient.name || `${preselectedPatient.firstName} ${preselectedPatient.lastName}`,
    patientCode: preselectedPatient.patientCode,
    telephone: preselectedPatient.telephone
  } : null;

  const [step, setStep] = useState(initialStep);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatientData);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [appointmentData, setAppointmentData] = useState({
    appointmentType: 'CONSULTATION',
    scheduledDate: '',
    location: '',
    notes: '',
    priority: 'NORMAL',
    status: 'SCHEDULED'
  });

  // Fetch all patients for admin
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: async () => {
      const response = await fetch("/api/renseignements/patients");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return data.patients || [];
    },
    enabled: open && !!session,
  });

  const patients: Patient[] = patientsData || [];

  // Fetch employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/users/employees-stats");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    enabled: open,
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
      toast({ title: "Succes", description: "Rendez-vous cree avec succes" });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la creation",
        variant: "destructive"
      });
    },
  });

  const handleClose = () => {
    setStep(initialStep);
    // Only reset patient if no preselected patient
    setSelectedPatient(hasPreselectedPatient ? preselectedPatientData : null);
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
    // Don't go back to step 1 if patient is preselected
    if (hasPreselectedPatient) {
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({ title: "Erreur", description: "Veuillez selectionner un patient", variant: "destructive" });
      return;
    }

    if (!appointmentData.scheduledDate || !appointmentData.location) {
      toast({ title: "Erreur", description: "Date et lieu sont requis", variant: "destructive" });
      return;
    }

    if (!selectedEmployeeId) {
      toast({ title: "Erreur", description: "Veuillez assigner un employe", variant: "destructive" });
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
      assignedToId: selectedEmployeeId
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
                <Calendar className="h-5 w-5 text-blue-600" />
                Nouveau Rendez-vous
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Step 1: Patient Selection */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-blue-800 mb-2">Selectionner un Patient</h2>
                      <p className="text-sm text-gray-600">Recherchez et selectionnez le patient pour ce rendez-vous</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, telephone, ou code patient..."
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
                            Aucun patient trouve
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
                            <Button
                              key={patient.id}
                              variant="ghost"
                              className="w-full justify-start h-auto py-3 px-4 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-all"
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <div className="flex flex-col items-start w-full">
                                <div className="flex items-center gap-2 w-full">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="font-medium text-gray-900">{patient.name}</span>
                                  {patient.patientCode && (
                                    <Badge variant="outline" className="text-xs ml-auto border-blue-200 text-blue-700">
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
                      <h2 className="text-lg font-semibold text-blue-800 mb-2">Details du Rendez-vous</h2>
                      <p className="text-sm text-gray-600">Completez les informations du rendez-vous</p>
                    </div>

                    {/* 2-Column Grid for Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Appointment Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
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
                          <Clock className="h-4 w-4 text-blue-600" />
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
                          <MapPin className="h-4 w-4 text-blue-600" />
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
                        <label className="text-sm font-medium">Priorite</label>
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

                      {/* Employee Assignment */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          Assigner a un employe <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedEmployeeId}
                          onValueChange={setSelectedEmployeeId}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selectionner un employe" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-3 w-3 text-blue-600" />
                                  </div>
                                  {emp.firstName} {emp.lastName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                onClick={(step === 1 || hasPreselectedPatient) ? handleClose : handleBack}
              >
                {(step === 1 || hasPreselectedPatient) ? (
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? (
                    "Creation..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Creer le rendez-vous
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

export default CreateAppointmentDialogAdmin;
