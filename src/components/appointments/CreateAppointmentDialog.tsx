import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, User, MapPin, Clock, ChevronRight, ChevronLeft, Search, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  telephone?: string;
  patientCode?: string;
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APPOINTMENT_TYPES = [
  { value: 'POLYGRAPHIE', label: 'Polygraphie' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RECUPERATION', label: 'Récupération' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Faible' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Élevée' },
  { value: 'URGENT', label: 'Urgent' }
];

export function CreateAppointmentDialog({ open, onOpenChange }: CreateAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    appointmentType: 'CONSULTATION',
    scheduledDate: '',
    location: '',
    notes: '',
    priority: 'NORMAL',
    status: 'SCHEDULED'
  });

  // Fetch patients (only assigned to this employee)
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", "assignedToMe"],
    queryFn: async () => {
      const response = await fetch("/api/renseignements/patients?assignedToMe=true");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return data.patients || [];
    },
    enabled: open && !!session,
  });

  const patients: Patient[] = patientsData || [];

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
    mutationFn: async (data: any) => {
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

    const payload = {
      patientId: selectedPatient.id,
      appointmentType: appointmentData.appointmentType,
      scheduledDate: new Date(appointmentData.scheduledDate),
      location: appointmentData.location,
      notes: appointmentData.notes,
      priority: appointmentData.priority,
      status: appointmentData.status,
      assignedToId: session?.user?.id
    };

    await createMutation.mutateAsync(payload);
  };

  const updateField = (field: string, value: any) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Nouveau Rendez-vous
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Sélectionnez un patient" : "Complétez les informations du rendez-vous"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
              1
            </div>
            <span className="text-sm">Patient</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
              2
            </div>
            <span className="text-sm">Détails</span>
          </div>
        </div>

        {/* Step 1: Patient Selection */}
        {step === 1 && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col px-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone, ou code patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="flex-1 rounded-md border">
              <div className="p-2 space-y-1">
                {loadingPatients ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Chargement des patients...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun patient trouvé
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <Button
                      key={patient.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3 hover:bg-green-50"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{patient.name}</span>
                          {patient.patientCode && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {patient.patientCode}
                            </Badge>
                          )}
                        </div>
                        {patient.telephone && (
                          <span className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
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
          <div className="space-y-6 flex-1 overflow-y-auto px-2">
            {/* Selected Patient Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-medium">Patient sélectionné:</span>
                <span className="text-green-700">{selectedPatient?.name}</span>
                {selectedPatient?.patientCode && (
                  <Badge variant="outline" className="text-xs">
                    {selectedPatient.patientCode}
                  </Badge>
                )}
              </div>
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
                  <SelectTrigger>
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
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Priorité
                </label>
                <Select
                  value={appointmentData.priority}
                  onValueChange={(val) => updateField('priority', val)}
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
            </div>

            {/* Notes - Full Width Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notes
              </label>
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

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
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
              {createMutation.isPending ? "Création..." : "Créer le rendez-vous"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
