import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParameterConsumer } from "@/pages/roles/admin/appareils/components/forms/ParameterConsumer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Info } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ParameterConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (parameters: any) => void;
  deviceId: string;
  deviceName: string;
  initialValues?: any[];
  patientId?: string;
  resultDueDate?: Date;
  onResultDueDateChange?: (date: Date | undefined) => void;
}

export function ParameterConfigurationDialog({
  isOpen,
  onClose,
  onSubmit,
  deviceId,
  deviceName,
  initialValues = [],
  patientId,
  resultDueDate,
  onResultDueDateChange = () => {}
}: ParameterConfigurationDialogProps) {
  // Set default date to 7 days from now if not provided
  const defaultDate = resultDueDate || addDays(new Date(), 7);
  
  const handleParameterSubmit = (parameters: any) => {
    // Add the result due date to all RESULT type parameters
    const updatedParameters = parameters.map((param: any) => {
      if (param.parameterType === 'RESULT' && resultDueDate) {
        return {
          ...param,
          resultDueDate: resultDueDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        };
      }
      return param;
    });
    
    onSubmit(updatedParameters);
  };
  
  // Format date as a string for display
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return format(date, 'PPP', { locale: fr });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Configurer les Paramètres - {deviceName}
          </DialogTitle>
        </DialogHeader>
        
        {/* Date selector for results */}
        <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Date prévue pour les résultats
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Définissez la date à laquelle les résultats seront attendus. Une tâche sera créée dans le calendrier pour cette date.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Label htmlFor="result-date" className="text-sm font-medium text-gray-700">Date des résultats attendus</Label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="result-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {resultDueDate ? (
                      formatDate(resultDueDate)
                    ) : (
                      <span className="text-gray-500">Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-gray-200 shadow-md rounded-md" align="start">
                  <div className="p-2 border-b border-gray-100">
                    <div className="font-medium text-center py-1">Date des résultats</div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={resultDueDate || defaultDate}
                    onSelect={onResultDueDateChange}
                    initialFocus
                    disabled={{
                      before: new Date(),
                    }}
                    className="rounded-md border-0"
                    classNames={{
                      day_selected: "bg-blue-900 text-white hover:bg-blue-900 hover:text-white focus:bg-blue-900 focus:text-white",
                      day_today: "bg-gray-100 text-gray-900"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Show selected date as text for clarity */}
            {resultDueDate && (
              <div className="text-sm text-blue-800 mt-1 flex items-center">
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                Résultats attendus le {formatDate(resultDueDate)}
              </div>
            )}
          </div>
        </div>
        
        <div className="py-4">
          <ParameterConsumer
            deviceId={deviceId}
            onSubmit={handleParameterSubmit}
            initialValues={initialValues}
            patientId={patientId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
