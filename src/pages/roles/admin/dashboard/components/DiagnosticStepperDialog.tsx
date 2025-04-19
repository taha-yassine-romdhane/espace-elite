import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { DiagnosticProductStep } from "./steps/DiagnosticProductStep";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, AlertCircle, Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface DiagnosticStepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le patient" },
  { id: 2, name: "Ajout Équipement", description: "Sélectionner ou créer un équipement de diagnostic" },
  { id: 3, name: "Ajout Paiement", description: "Configurer les détails du paiement" },
] as const;

export function DiagnosticStepperDialog({ isOpen, onClose }: DiagnosticStepperDialogProps) {
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

  // Final Step State
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [notes, setNotes] = useState("");
  const [createNotification, setCreateNotification] = useState(true);
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // Document upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocuments(Array.from(e.target.files));
    }
  };

  // Create diagnostic record mutation
  const { mutate: createDiagnostic } = useMutation({
    mutationFn: async () => {
      if (!selectedClient || selectedProducts.length === 0) {
        throw new Error("Client and products are required");
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append("clientId", selectedClient);
      formData.append("products", JSON.stringify(selectedProducts));
      formData.append("followUpDate", followUpDate ? followUpDate.toISOString() : "");
      formData.append("notes", notes);
      formData.append("createNotification", createNotification.toString());
      
      // Add documents if any
      documents.forEach(doc => {
        formData.append("documents", doc);
      });

      const response = await fetch("/api/diagnostics", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create diagnostic record");
      }

      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      handleClose();
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
    setNotes("");
    setCreateNotification(true);
    setDocuments([]);
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
    
    try {
      createDiagnostic();
    } catch (error) {
      console.error("Error submitting diagnostic:", error);
      setSubmitError("Une erreur s'est produite lors de l'enregistrement du diagnostic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Nouveau Diagnostic</DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh]">
          {/* Vertical Steps */}
          <div className="w-64 bg-gray-50 border-r p-6">
            <div className="space-y-6">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "relative pl-8 pb-8 last:pb-0",
                    "before:absolute before:left-2 before:top-1 before:h-full before:w-[2px]",
                    currentStep > step.id
                      ? "before:bg-[#1e3a8a]"
                      : "before:bg-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full",
                      currentStep >= step.id
                        ? "bg-[#1e3a8a] text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {step.id}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-medium",
                      currentStep >= step.id ? "text-[#1e3a8a]" : "text-gray-500"
                    )}>
                      {step.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              <DiagnosticProductStep
                onBack={handleBack}
                onNext={handleNext}
                selectedProducts={selectedProducts}
                onRemoveProduct={handleRemoveProduct}
                onSelectProduct={handleProductSelect}
                onUpdateProductParameters={handleUpdateProductParameters}
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-[#1e3a8a]">Ajout Paiement</h3>
                
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
                
                {/* Follow-up and Document Upload */}
                <div className="mt-8 p-6 border border-gray-200 rounded-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={createNotification} 
                        onCheckedChange={setCreateNotification}
                      />
                      <Label htmlFor="notification" className="font-medium">
                        Créer une notification pour le suivi
                      </Label>
                    </div>
                  </div>
                  
                  {createNotification && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date de suivi</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {followUpDate ? (
                                format(followUpDate, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={followUpDate}
                              onSelect={setFollowUpDate}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Documents</Label>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Glissez-déposez des fichiers ici ou cliquez pour parcourir
                      </p>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="document-upload"
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("document-upload")?.click()}
                      >
                        Parcourir
                      </Button>
                      
                      {documents.length > 0 && (
                        <div className="mt-4 text-left">
                          <p className="text-sm font-medium mb-2">Fichiers sélectionnés:</p>
                          <ul className="space-y-1">
                            {documents.map((doc, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center">
                                <span className="truncate max-w-[250px]">{doc.name}</span>
                                <span className="ml-2 text-xs text-gray-400">
                                  ({(doc.size / 1024).toFixed(1)} KB)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <Textarea 
                      placeholder="Ajouter des notes supplémentaires..."
                      className="min-h-[100px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
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
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Terminer'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
