import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { NewDiagnosticProductStep } from "./steps/NewDiagnosticProductStep";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, AlertCircle, Upload, Loader2, User, Bell, FileText, PlusCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { StepperSidebar } from "./StepperSidebar";
import { AddTaskButton } from "@/components/tasks/AddTaskButton";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

interface DiagnosticStepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le patient" },
  { id: 2, name: "Ajout Équipement", description: "Sélectionner ou créer un équipement de diagnostic" },
  { id: 3, name: "Création de Tâches", description: "Ajouter des tâches pour le suivi du diagnostic" },
] as const;

export function DiagnosticStepperDialog({ isOpen, onClose }: DiagnosticStepperDialogProps) {
  const { toast } = useToast();
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);

  // Client Selection State
  const [clientType, setClientType] = useState<"patient" | "societe" | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product Selection State
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Result Due Date State - for when results are expected
  const [resultDueDate, setResultDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );

  // Final Step State
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Fetch stock locations for forms
  const { data: stockLocations } = useQuery({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const response = await fetch("/api/stock-locations");
      if (!response.ok) {
        throw new Error("Failed to fetch stock locations");
      }
      return response.json();
    },
  });

  // Fetch client details when a client is selected
  const { data: clientDetails } = useQuery({
    queryKey: ["client-details", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return null;
      const response = await fetch(`/api/clients/${selectedClient}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }
      return response.json();
    },
    enabled: !!selectedClient,
  });

  // Client Selection Handlers
  const fetchClients = async (type: "patient" | "societe") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clients?type=${type}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Erreur lors du chargement des données");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientTypeChange = (type: "patient" | "societe") => {
    setClientType(type);
    setSelectedClient(null);
    setClients([]);
    fetchClients(type);
  };

  // Product Selection Handlers
  const handleProductSelect = (product: any) => {
    setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle updating product parameters
  const handleUpdateProductParameters = (productIndex: number, parameters: any) => {
    setSelectedProducts((prev) => {
      const updated = [...prev];
      updated[productIndex] = { ...updated[productIndex], parameters };
      return updated;
    });
  };

  // Create diagnostic record mutation
  const { mutate: createDiagnostic } = useMutation({
    mutationFn: async (diagnosticData: any) => {
      if (!diagnosticData.clientId || diagnosticData.products.length === 0) {
        throw new Error("Client and products are required");
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append("clientId", diagnosticData.clientId);
      formData.append("clientType", diagnosticData.clientType);
      formData.append("products", JSON.stringify(diagnosticData.products));
      formData.append("followUpDate", diagnosticData.followUpDate ? diagnosticData.followUpDate.toISOString() : "");
      
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create diagnostic record");
      }
      
      const data = await response.json();
      // Reset form and close dialog
      handleClose();
      return data;
    },
    onSuccess: () => {
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  // Navigation Handlers
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setClientType(null);
    setSelectedClient(null);
    setClients([]);
    setError(null);
    setSelectedProducts([]);
    setFollowUpDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setSubmitError(null);
    onClose();
  };

  // Calculate total price based on selected products
  const calculateTotalPrice = () => {
    return selectedProducts.reduce((total, product) => {
      const price = parseFloat(product.sellingPrice) || 0;
      const quantity = product.quantity || 1;
      return total + (price * quantity);
    }, 0).toFixed(2);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    
    // Validate required fields
    if (!selectedClient) {
      setSubmitError("Veuillez sélectionner un patient");
      setSubmitting(false);
      return;
    }
    
    if (selectedProducts.length === 0) {
      setSubmitError("Veuillez sélectionner au moins un équipement");
      setSubmitting(false);
      return;
    }
    
    // Prepare data for submission
    const diagnosticData = {
      clientId: selectedClient,
      clientType,
      products: selectedProducts.map(product => ({
        productId: product.id,
        parameters: product.parameters || [],
      })),
      followUpDate: followUpDate,
      resultDueDate: resultDueDate,
    };
    
    // Submit the data
    createDiagnostic(diagnosticData, {
      onSuccess: () => {
        setSubmitting(false);
        onClose();
      },
      onError: (error) => {
        setSubmitError("Une erreur est survenue lors de la création du diagnostic");
        setSubmitting(false);
        console.error("Error creating diagnostic:", error);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Nouveau Diagnostic</DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh]">
          <StepperSidebar 
            steps={steps}
            currentStep={currentStep}
            clientDetails={clientDetails}
            totalPrice={selectedProducts.length > 0 ? `${calculateTotalPrice()} DT` : undefined}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && (
              <ClientSelectionStep
                onNext={handleNext}
                onClose={handleClose}
                onClientTypeChange={handleClientTypeChange}
                onClientSelect={setSelectedClient}
                clientType={clientType}
                selectedClient={selectedClient}
                clients={clients}
                isLoading={isLoading}
                error={error}
                action="diagnostique"
              />
            )}

            {currentStep === 2 && (
              <NewDiagnosticProductStep
                onBack={handleBack}
                onNext={handleNext}
                selectedProducts={selectedProducts}
                onRemoveProduct={handleRemoveProduct}
                onSelectProduct={handleProductSelect}
                onUpdateProductParameters={handleUpdateProductParameters}
                patientId={clientType === 'patient' && selectedClient ? selectedClient : undefined}
                resultDueDate={resultDueDate}
                onResultDueDateChange={setResultDueDate}
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#1e3a8a]">Finaliser le Diagnostic</h2>
                
                {/* Summary of selected products */}
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 space-y-3">
                  <h4 className="font-medium text-[#1e3a8a]">Récapitulatif du Diagnostic</h4>
                  
                  <div className="space-y-2">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          {product.parameters && product.parameters.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {product.parameters.filter((p: { value: any }) => p.value).length} paramètres
                            </span>
                          )}
                        </div>
                        <span>{product.sellingPrice} DT</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t border-blue-200 flex justify-between font-medium">
                    <span>Total</span>
                    <span>{calculateTotalPrice()} DT</span>
                  </div>
                </div>
                
                {/* Task Creation Section */}
                <div className="mt-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-lg">Tâches de Suivi</h3>
                      </div>
                      <AddTaskButton 
                        onClick={() => setIsTaskModalOpen(true)} 
                        variant="outline"
                        label="Créer une tâche"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Créez des tâches associées à ce diagnostic pour suivre les actions à réaliser. 
                      Les tâches seront automatiquement associées au patient et apparaîtront dans votre calendrier.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700">
                        <CalendarIcon className="h-4 w-4" />
                        <p className="text-sm font-medium">Conseil: Utilisez les tâches pour planifier les rendez-vous de suivi et les rappels pour les résultats.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between pt-6 border-t">
                  <Button variant="outline" onClick={handleBack}>
                    ← Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      "Terminer"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DiagnosticTaskFormDialog 
        isOpen={isTaskModalOpen} 
        patientId={selectedClient && clientType === 'patient' ? selectedClient : undefined} 
        followUpDate={followUpDate} 
      />
    </Dialog>
  );
}

export function DiagnosticTaskFormDialog({ isOpen, patientId, followUpDate }: { isOpen: boolean, patientId?: string, followUpDate?: Date }) {
  const { toast } = useToast();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(isOpen);

  useEffect(() => {
    setIsTaskModalOpen(isOpen);
  }, [isOpen]);

  return (
    <TaskFormDialog
      open={isTaskModalOpen}
      onClose={() => setIsTaskModalOpen(false)}
      onSubmit={async (data) => {
        try {
          // Add patient ID if available
          if (patientId) {
            data.patientId = patientId;
          }
          
          // Call your API to create the task
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create task');
          }
          
          toast({
            title: "Succès",
            description: "La tâche a été créée avec succès",
          });
          
          setIsTaskModalOpen(false);
        } catch (error) {
          console.error('Error creating task:', error);
          toast({
            title: "Erreur",
            description: "Impossible de créer la tâche",
            variant: "destructive",
          });
        }
      }}
      initialDate={followUpDate}
      preselectedPatientId={patientId || ''}
    />
  );
}
