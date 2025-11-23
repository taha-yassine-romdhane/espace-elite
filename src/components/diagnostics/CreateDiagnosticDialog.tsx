import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, User, Calendar, ChevronRight, ChevronLeft, Search, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiagnosticDeviceSelector } from '@/components/forms/components/DiagnosticDeviceSelector';
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  telephone?: string;
  patientCode?: string;
}

interface CreateDiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDiagnosticDialog({ open, onOpenChange }: CreateDiagnosticDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [diagnosticData, setDiagnosticData] = useState({
    medicalDeviceId: '',
    diagnosticDate: new Date().toISOString().split('T')[0],
    followUpDate: ''
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

  // Fetch diagnostic devices (ACTIVE and in user's stock location)
  const { data: devicesData } = useQuery({
    queryKey: ['diagnostic-devices', 'my-location'],
    queryFn: async () => {
      const response = await fetch('/api/medical-devices/diagnostic-devices?myLocation=true&status=ACTIVE');
      if (!response.ok) throw new Error('Failed to fetch devices');
      return response.json();
    },
    enabled: open && !!session,
  });

  const patients: Patient[] = patientsData || [];
  const devices = Array.isArray(devicesData) ? devicesData : [];

  // Filter patients based on search
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const telephone = patient.telephone?.toLowerCase() || '';
    const patientCode = patient.patientCode?.toLowerCase() || '';
    return fullName.includes(searchLower) || telephone.includes(searchLower) || patientCode.includes(searchLower);
  });

  // Create diagnostic mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: data.patientId,
          clientType: 'patient',
          medicalDeviceId: data.medicalDeviceId,
          products: [{
            id: data.medicalDeviceId,
            type: 'DIAGNOSTIC_DEVICE',
            name: devices.find((d: any) => d.id === data.medicalDeviceId)?.name || '',
            sellingPrice: 0
          }],
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          totalPrice: 0,
          notes: '',
          patientInfo: null,
          fileUrls: [],
          result: null // No results yet - will be added later
        })
      });
      if (!response.ok) throw new Error('Failed to create diagnostic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      toast({ title: 'Succès', description: 'Diagnostic créé avec succès' });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive'
      });
    },
  });

  const handleClose = () => {
    setStep(1);
    setSelectedPatient(null);
    setSearchQuery('');
    setDiagnosticData({
      medicalDeviceId: '',
      diagnosticDate: new Date().toISOString().split('T')[0],
      followUpDate: ''
    });
    onOpenChange(false);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    // Auto-set follow-up date to next day
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    setDiagnosticData(prev => ({
      ...prev,
      followUpDate: nextDay.toISOString().split('T')[0]
    }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient', variant: 'destructive' });
      return;
    }

    if (!diagnosticData.medicalDeviceId || !diagnosticData.diagnosticDate) {
      toast({ title: 'Erreur', description: 'Appareil et date sont requis', variant: 'destructive' });
      return;
    }

    const payload = {
      patientId: selectedPatient.id,
      medicalDeviceId: diagnosticData.medicalDeviceId,
      diagnosticDate: diagnosticData.diagnosticDate,
      performedById: session?.user?.id, // Auto-set to logged in user
      followUpDate: diagnosticData.followUpDate
    };

    await createMutation.mutateAsync(payload);
  };

  const updateField = (field: string, value: any) => {
    setDiagnosticData(prev => {
      const updates: any = { [field]: value };

      // Auto-set follow-up date to next day when diagnostic date changes
      if (field === 'diagnosticDate' && value) {
        const nextDay = new Date(value);
        nextDay.setDate(nextDay.getDate() + 1);
        updates.followUpDate = nextDay.toISOString().split('T')[0];
      }

      return { ...prev, ...updates };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Commencer un Diagnostic
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Sélectionnez un patient" : "Sélectionnez l'appareil et la date"}
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
            <span className="text-sm">Appareil et Date</span>
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

        {/* Step 2: Device and Date Selection */}
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

            {/* Logged In User Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Effectué par:</span>
                <span className="text-gray-700">{session?.user?.name || 'Vous'}</span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-6">
              {/* Diagnostic Device */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-green-600" />
                  Appareil de diagnostic <span className="text-red-500">*</span>
                </label>
                <DiagnosticDeviceSelector
                  value={diagnosticData.medicalDeviceId}
                  onChange={(val) => updateField('medicalDeviceId', val)}
                  placeholder="Sélectionner un appareil"
                />
              </div>

              {/* Diagnostic Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  Date du diagnostic <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={diagnosticData.diagnosticDate}
                  onChange={(e) => updateField('diagnosticDate', e.target.value)}
                />
              </div>

              {/* Follow-up Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date de suivi (auto-calculée)
                </label>
                <Input
                  type="date"
                  value={diagnosticData.followUpDate}
                  onChange={(e) => updateField('followUpDate', e.target.value)}
                />
              </div>
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
              {createMutation.isPending ? "Création..." : "Créer le diagnostic"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
