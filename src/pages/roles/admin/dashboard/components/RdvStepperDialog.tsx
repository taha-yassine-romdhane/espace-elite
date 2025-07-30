import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  MapPin,
  Stethoscope
} from 'lucide-react';

// Import step components
import { AppointmentClientSelectionStep } from './steps/AppointmentClientSelectionStep';

// Type definitions
interface Client {
  id: string;
  name: string;
  type: 'patient';
  telephone?: string;
  firstName?: string;
  lastName?: string;
}

interface AppointmentData {
  client: Client | null;
  appointmentType: string;
  appointmentDate: Date | null;
  appointmentTime: string;
  duration: number;
  location: string;
  notes: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

interface RdvStepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RdvStepperDialog({ isOpen, onClose }: RdvStepperDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    client: null,
    appointmentType: '',
    appointmentDate: null as Date | null,
    appointmentTime: '',
    duration: 60,
    location: '',
    notes: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    status: 'SCHEDULED' as 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  });

  // Steps configuration
  const steps = [
    { 
      id: 1, 
      title: 'Sélection Client', 
      icon: <User className="h-5 w-5" />,
      description: 'Choisir le patient ou la société'
    },
    { 
      id: 2, 
      title: 'Type de Rendez-vous', 
      icon: <Stethoscope className="h-5 w-5" />,
      description: 'Définir le type et motif'
    },
    { 
      id: 3, 
      title: 'Date et Heure', 
      icon: <Calendar className="h-5 w-5" />,
      description: 'Planifier le rendez-vous'
    },
    { 
      id: 4, 
      title: 'Récapitulatif', 
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: 'Vérifier et confirmer'
    }
  ];

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rendez-vous créé',
        description: 'Le rendez-vous a été créé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le rendez-vous',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setCurrentStep(1);
    setAppointmentData({
      client: null,
      appointmentType: '',
      appointmentDate: null,
      appointmentTime: '',
      duration: 60,
      location: '',
      notes: '',
      priority: 'NORMAL',
      status: 'SCHEDULED'
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!appointmentData.appointmentDate || !appointmentData.appointmentTime) {
      toast({
        title: 'Erreur',
        description: 'Date et heure sont requises',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time into a single Date object
    const [hours, minutes] = appointmentData.appointmentTime.split(':');
    const scheduledDate = new Date(appointmentData.appointmentDate);
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const payload = {
      patientId: appointmentData.client ? appointmentData.client.id : null,
      companyId: null, // Appointments are only for patients
      appointmentType: appointmentData.appointmentType,
      scheduledDate: scheduledDate,
      duration: appointmentData.duration,
      location: appointmentData.location,
      notes: appointmentData.notes,
      priority: appointmentData.priority,
      status: appointmentData.status,
    };

    createAppointmentMutation.mutate(payload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AppointmentClientSelectionStep
            selectedClient={appointmentData.client}
            onClientSelect={(client) => 
              setAppointmentData(prev => ({ ...prev, client }))
            }
          />
        );

      case 2:
        return (
          <AppointmentTypeStep
            appointmentType={appointmentData.appointmentType}
            location={appointmentData.location}
            priority={appointmentData.priority}
            notes={appointmentData.notes}
            onUpdate={(updates) => 
              setAppointmentData(prev => ({ ...prev, ...updates }))
            }
          />
        );

      case 3:
        return (
          <DateTimeStep
            appointmentDate={appointmentData.appointmentDate}
            appointmentTime={appointmentData.appointmentTime}
            duration={appointmentData.duration}
            onUpdate={(updates) => 
              setAppointmentData(prev => ({ ...prev, ...updates }))
            }
          />
        );

      case 4:
        return (
          <AppointmentSummaryStep
            appointmentData={appointmentData}
            onSubmit={handleSubmit}
            isLoading={createAppointmentMutation.isPending}
          />
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return appointmentData.client !== null;
      case 2:
        return appointmentData.appointmentType && appointmentData.location;
      case 3:
        return appointmentData.appointmentDate && appointmentData.appointmentTime;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
            Nouveau Rendez-vous
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="min-h-[400px] py-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="text-sm text-gray-500">
            Étape {currentStep} sur {steps.length}
          </div>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || createAppointmentMutation.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {createAppointmentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Créer le Rendez-vous
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step Components
interface AppointmentTypeStepProps {
  appointmentType: string;
  location: string;
  priority: string;
  notes: string;
  onUpdate: (updates: Partial<AppointmentData>) => void;
}

function AppointmentTypeStep({ 
  appointmentType, 
  location, 
  priority, 
  notes, 
  onUpdate 
}: AppointmentTypeStepProps) {
  const appointmentTypes = [
    { value: 'CONSULTATION', label: 'Consultation', icon: <Stethoscope className="h-4 w-4" /> },
    { value: 'LOCATION', label: 'Location', icon: <FileText className="h-4 w-4" /> },
    { value: 'VENTE', label: 'Vente', icon: <FileText className="h-4 w-4" /> },
    { value: 'DIAGNOSTIC', label: 'Diagnostic', icon: <FileText className="h-4 w-4" /> },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: <FileText className="h-4 w-4" /> },
    { value: 'RECUPERATION', label: 'Récupération', icon: <FileText className="h-4 w-4" /> }
  ];

  const priorities = [
    { value: 'LOW', label: 'Faible', color: 'bg-green-100 text-green-800' },
    { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'HIGH', label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Type de Rendez-vous</h3>
        <div className="grid grid-cols-2 gap-3">
          {appointmentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onUpdate({ appointmentType: type.value })}
              className={`p-4 border rounded-lg flex items-center gap-3 text-left transition-colors ${
                appointmentType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {type.icon}
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Lieu</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => onUpdate({ location: e.target.value })}
            placeholder="Adresse ou lieu du rendez-vous"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Priorité</label>
        <div className="flex gap-2">
          {priorities.map((prio) => (
            <button
              key={prio.value}
              onClick={() => onUpdate({ priority: prio.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                priority === prio.value
                  ? prio.color
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {prio.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Informations complémentaires..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

interface DateTimeStepProps {
  appointmentDate: Date | null;
  appointmentTime: string;
  duration: number;
  onUpdate: (updates: Partial<AppointmentData>) => void;
}

function DateTimeStep({ 
  appointmentDate, 
  appointmentTime, 
  duration, 
  onUpdate 
}: DateTimeStepProps) {
  const durations = [30, 45, 60, 90, 120, 180];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Planification du Rendez-vous</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <DatePicker
            value={appointmentDate || undefined}
            onChange={(date) => onUpdate({ appointmentDate: date || null })}
            placeholder="Sélectionner une date"
            className="w-full"
          />
          <p className="text-xs text-gray-500">Choisissez la date du rendez-vous</p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Heure</label>
          <TimePicker
            value={appointmentTime}
            onChange={(time) => onUpdate({ appointmentTime: time })}
            placeholder="Sélectionner l'heure"
            className="w-full"
          />
          <p className="text-xs text-gray-500">Choisissez l'heure du rendez-vous</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Durée estimée</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {durations.map((dur) => (
            <Button
              key={dur}
              variant={duration === dur ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ duration: dur })}
              className="flex flex-col h-auto py-2"
            >
              <span className="font-semibold">{dur}</span>
              <span className="text-xs">min</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">Sélectionnez la durée prévue pour le rendez-vous</p>
      </div>

      {/* Preview Section */}
      {appointmentDate && appointmentTime && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Aperçu du créneau</h4>
          <div className="flex items-center gap-4 text-sm text-blue-800">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{appointmentDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{appointmentTime} ({duration} minutes)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppointmentSummaryStepProps {
  appointmentData: AppointmentData;
  onSubmit: () => void;
  isLoading: boolean;
}

function AppointmentSummaryStep({ 
  appointmentData
}: AppointmentSummaryStepProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Date non sélectionnée';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time || 'Heure non sélectionnée';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Récapitulatif du Rendez-vous</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium">{appointmentData.client?.name}</p>
            <p className="text-sm text-gray-600">Patient</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">{appointmentData.appointmentType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Priorité</p>
            <Badge className="w-fit">{appointmentData.priority}</Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">Date et heure</p>
          <p className="font-medium">
            {formatDate(appointmentData.appointmentDate)} à {formatTime(appointmentData.appointmentTime)}
          </p>
          <p className="text-sm text-gray-500">Durée: {appointmentData.duration} minutes</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Lieu</p>
          <p className="font-medium">{appointmentData.location}</p>
        </div>

        {appointmentData.notes && (
          <div>
            <p className="text-sm text-gray-600">Notes</p>
            <p className="text-sm">{appointmentData.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RdvStepperDialog;