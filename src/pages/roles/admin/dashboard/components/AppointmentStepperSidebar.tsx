import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Calendar, User, Clock, MapPin, FileText } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description: string;
}

interface PatientDetails {
  id: string;
  name: string;
  telephone?: string;
  patientCode?: string;
}

interface AppointmentData {
  appointmentType?: string;
  scheduledDate?: string;
  location?: string;
  priority?: string;
}

interface AppointmentStepperSidebarProps {
  steps: ReadonlyArray<Step>;
  currentStep: number;
  patientDetails: PatientDetails | null;
  appointmentData?: AppointmentData;
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  'POLYGRAPHIE': 'Polygraphie',
  'CONSULTATION': 'Consultation',
  'LOCATION': 'Location',
  'VENTE': 'Vente',
  'MAINTENANCE': 'Maintenance',
  'RECUPERATION': 'Recuperation'
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  'LOW': { label: 'Faible', color: 'bg-gray-100 text-gray-700' },
  'NORMAL': { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  'HIGH': { label: 'Elevee', color: 'bg-orange-100 text-orange-700' },
  'URGENT': { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

export function AppointmentStepperSidebar({
  steps = [],
  currentStep,
  patientDetails,
  appointmentData
}: AppointmentStepperSidebarProps) {
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
      <div className="p-4 border-b bg-blue-50 sticky top-0">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nouveau Rendez-vous
        </h3>
      </div>

      <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Patient Info Card - Show when a patient is selected */}
        {patientDetails && (
          <div className="mb-6 overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
            {/* Header with patient name */}
            <div className="bg-blue-600 p-3 text-white">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">
                    {patientDetails.name}
                  </h4>
                  {patientDetails.patientCode && (
                    <p className="text-xs text-blue-100">
                      Code: {patientDetails.patientCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Patient details */}
            <div className="p-3 text-sm space-y-2">
              {patientDetails.telephone && (
                <div className="flex items-center gap-2 text-blue-800">
                  <span className="font-medium">Telephone:</span>
                  <span>{patientDetails.telephone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Summary - Show when appointment data exists */}
        {appointmentData && (appointmentData.appointmentType || appointmentData.scheduledDate || appointmentData.location) && (
          <div className="mb-6 rounded-lg border border-blue-200 overflow-hidden">
            <div className="bg-blue-50 px-3 py-2 font-medium text-blue-700 border-b flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details du Rendez-vous
            </div>
            <div className="p-3 space-y-3">
              {appointmentData.appointmentType && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">
                    {APPOINTMENT_TYPE_LABELS[appointmentData.appointmentType] || appointmentData.appointmentType}
                  </span>
                </div>
              )}

              {dateTime && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-gray-600">Date et heure:</div>
                    <div className="font-medium text-gray-900 capitalize">{dateTime.date}</div>
                    <div className="font-medium text-blue-600">{dateTime.time}</div>
                  </div>
                </div>
              )}

              {appointmentData.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Lieu:</span>
                  <span className="font-medium text-gray-900">{appointmentData.location}</span>
                </div>
              )}

              {appointmentData.priority && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Priorite:</span>
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
          {steps?.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="relative">
                {/* Connecting line to previous step */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-0 left-5 w-0.5",
                      "h-6 -translate-y-6",
                      isCompleted ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                )}
                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-10 w-10 text-blue-600 fill-blue-100" />
                    ) : isActive ? (
                      <div className="h-10 w-10 rounded-full border-2 border-blue-600 bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                        {step.id}
                      </div>
                    ) : (
                      <Circle className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3
                      className={cn(
                        "font-medium",
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                          ? "text-blue-700"
                          : "text-gray-400"
                      )}
                    >
                      {step.name}
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isActive || isCompleted
                          ? "text-gray-600"
                          : "text-gray-400"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Badge - Fixed at bottom */}
      <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50 sticky bottom-0">
        <div className="flex justify-center">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            currentStep === steps.length ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
          )}>
            {currentStep === steps.length ? 'Pret a creer' : 'En cours'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentStepperSidebar;
