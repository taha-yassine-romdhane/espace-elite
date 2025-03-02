import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface StepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "location" | "vente" | "diagnostique" | null;
}

const steps = [
  { id: 1, name: "Type de Renseignement" },
  { id: 2, name: "Ajout Produits" },
  { id: 3, name: "Ajout Paiement" },
];

export function StepperDialog({ isOpen, onClose, action }: StepperDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientType, setClientType] = useState<"patient" | "societe" | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients based on type
  const fetchClients = async (type: "patient" | "societe") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clients?type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Erreur lors du chargement des données");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientTypeChange = (value: string) => {
    setClientType(value as "patient" | "societe");
    setSelectedClient(null);
    setClients([]); // Clear previous clients
    fetchClients(value as "patient" | "societe");
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getActionTitle = () => {
    switch (action) {
      case "location":
        return "Nouvelle Location";
      case "vente":
        return "Nouvelle Vente";
      case "diagnostique":
        return "Nouveau Diagnostic";
      default:
        return "";
    }
  };

  // Reset form when dialog closes
  const handleClose = () => {
    setCurrentStep(1);
    setClientType(null);
    setSelectedClient(null);
    setClients([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{getActionTitle()}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="relative mb-8">
          <div className="absolute top-4 w-full h-0.5 bg-gray-200" />
          <div
            className="absolute top-4 h-0.5 bg-primary transition-all"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    currentStep >= step.id
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    currentStep >= step.id ? "text-primary" : "text-gray-500"
                  )}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Type de Client</Label>
                <RadioGroup
                  className="grid grid-cols-2 gap-4 mt-4"
                  value={clientType || ""}
                  onValueChange={handleClientTypeChange}
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="patient" id="patient" />
                    <Label htmlFor="patient" className="flex-1 cursor-pointer">
                      <div className="font-medium">Patient</div>
                      <div className="text-sm text-gray-500">Particulier</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="societe" id="societe" />
                    <Label htmlFor="societe" className="flex-1 cursor-pointer">
                      <div className="font-medium">Société</div>
                      <div className="text-sm text-gray-500">Entreprise</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {clientType && (
                <div>
                  <Label className="text-base font-semibold">
                    {clientType === "patient" ? "Sélectionner le Patient" : "Sélectionner la Société"}
                  </Label>
                  <Select
                    value={selectedClient || ""}
                    onValueChange={setSelectedClient}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue 
                        placeholder={
                          isLoading 
                            ? "Chargement..." 
                            : error 
                              ? "Erreur de chargement" 
                              : "Sélectionner..."
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {error ? (
                        <SelectItem value="error" disabled>
                          {error}
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
          >
            {currentStep === 1 ? "Annuler" : "← Retour"}
          </Button>
          <Button
            disabled={!selectedClient}
            onClick={handleNext}
          >
            {currentStep === steps.length ? "Terminer" : "Continuer →"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
