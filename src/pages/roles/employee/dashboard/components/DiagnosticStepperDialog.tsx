import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { NewDiagnosticProductStep } from "./steps/diagnostic/NewDiagnosticProductStep";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { CalendarIcon, AlertCircle, Loader2, PlusCircle, FileUp, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DiagnosticStepperSidebar } from "./DiagnosticStepperSidebar";
import { AddTaskButton } from "@/components/tasks/AddTaskButton";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { useToast } from "@/components/ui/use-toast";
import FileManager from "@/components/forms/components/FileManager";
import { useForm } from "react-hook-form";
import { ExistingFile } from "@/types/forms/PatientFormData";

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
  // Form for file uploads
  const form = useForm();
  
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);

  // Client Selection State
  const [clientType, setClientType] = useState<"patient" | "societe" | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

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
  const [notes, setNotes] = useState<string>(""); // Add notes state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // File Management State
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<ExistingFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

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


  const handleClientTypeChange = (type: "patient" | "societe") => {
    setClientType(type);
    setSelectedClient(null);
  };

  // Product Selection Handlers
  const handleProductSelect = (product: any) => {
    // Replace the entire array with just the new product (only one device allowed)
    setSelectedProducts([product]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle updating product parameters
  const handleUpdateProductParameters = (productIndex: number, parameters: any) => {
    // In the new approach, we don't update parameters directly
    // This function is kept for compatibility but may not be needed anymore
    console.log('Product parameters update called, but using simplified approach now');
  };

  // Create diagnostic record mutation
  const { mutate: createDiagnostic } = useMutation({
    mutationFn: async (diagnosticData: any) => {
      if (!diagnosticData.clientId || diagnosticData.products.length === 0) {
        throw new Error("Client and products are required");
      }

      console.log('Submitting diagnostic data:', diagnosticData);

      // Send JSON data instead of FormData for better handling of complex objects
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: diagnosticData.clientId,
          clientType: diagnosticData.clientType,
          // Important: Pass the medical device ID directly
          medicalDeviceId: diagnosticData.medicalDeviceId,
          products: diagnosticData.products,
          followUpDate: diagnosticData.followUpDate ? diagnosticData.followUpDate.toISOString() : null,
          totalPrice: diagnosticData.totalPrice,
          patientInfo: diagnosticData.patientInfo,
          notes: diagnosticData.notes,
          fileUrls: diagnosticData.fileUrls
        }),
      });

      // Clone the response so we can read the body twice if needed
      const responseClone = response.clone();

      try {
        // Try to parse the response as JSON
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to create diagnostic record");
        }
        
        return data;
      } catch (error) {
        // If JSON parsing fails, try to get the text
        const textResponse = await responseClone.text();
        console.error('Error response:', textResponse);
        
        if (!response.ok) {
          throw new Error("Failed to create diagnostic record");
        }
        
        return { success: response.ok };
      }
    },
    onSuccess: (data) => {
      console.log('Diagnostic created successfully:', data);
      setSubmitting(false);
      // Close the dialog
      onClose();
    },
    onError: (error: Error) => {
      console.error('Error creating diagnostic:', error);
      setSubmitError(error.message || "Une erreur est survenue lors de la création du diagnostic");
      setSubmitting(false);
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
    setSelectedProducts([]);
    setFollowUpDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setSubmitError(null);
    onClose();
  };

  // Calculate total price based on selected products
  const calculateTotalPrice = () => {
    return selectedProducts.reduce((total, product) => {
      const price = parseFloat(product.sellingPrice || 0);
      const quantity = product.quantity || 1;
      return total + (price * quantity);
    }, 0).toFixed(2);
  };

  // Load existing files for the selected patient
  useEffect(() => {
    const fetchPatientFiles = async () => {
      if (selectedClient && clientType === 'patient') {
        setIsLoadingFiles(true);
        try {
          const response = await fetch(`/api/files?patientId=${selectedClient}`);
          if (response.ok) {
            const data = await response.json();
            setExistingFiles(data.files || []);
          }
        } catch (error) {
          console.error('Error fetching patient files:', error);
        } finally {
          setIsLoadingFiles(false);
        }
      }
    };
    
    fetchPatientFiles();
  }, [selectedClient, clientType]);

  // Handle file changes
  const handleFileChange = (files: ExistingFile[]) => {
    console.log('Files changed:', files);
    setFilesToUpload(files);
  };

  // Handle removing existing files
  const handleRemoveExistingFile = async (fileUrl: string) => {
    try {
      // Find the file by URL
      const fileToRemove = existingFiles.find(file => file.url === fileUrl);
      if (!fileToRemove) return;
      
      // Remove from UI first
      setExistingFiles(prev => prev.filter(file => file.url !== fileUrl));
      
      // Call API to remove file
      const response = await fetch(`/api/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          fileId: fileToRemove.id, 
          fileUrl: fileUrl 
        })
      });
      
      if (!response.ok) {
        // If deletion fails, add the file back to the UI
        setExistingFiles(prev => [...prev, fileToRemove]);
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive"
      });
    }
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
    
    try {
      // Collect all file URLs from UploadThing uploads
      let uploadedFileUrls: string[] = [];
      
      if (filesToUpload.length > 0) {
        console.log('Files to upload:', filesToUpload);
        
        // Collect all file URLs from UploadThing uploads
        filesToUpload.forEach((file) => {
          // For UploadThing files, the URL will be in the url property
          if (file.url) {
            console.log('Adding file URL to upload list:', file.url);
            uploadedFileUrls.push(file.url);
          }
        });
        
        console.log('Final file URLs to save:', uploadedFileUrls);
      }
      
      // Prepare data for submission
      // Make sure we have at least one selected product for the diagnostic
      if (selectedProducts.length === 0) {
        setSubmitError("Veuillez sélectionner au moins un équipement de diagnostic");
        setSubmitting(false);
        return;
      }

      // Use the first selected product as the medical device for the diagnostic
      // This is important because the Prisma schema expects a single medicalDeviceId
      const selectedDevice = selectedProducts[0];
      
      const diagnosticData = {
        clientId: selectedClient,
        clientType,
        // Important: Pass the medical device ID directly instead of in a products array
        medicalDeviceId: selectedDevice.id,
        // Still keep the products array for any additional information
        products: selectedProducts.map(product => {
          return {
            id: product.id,
            resultDueDate: resultDueDate ? resultDueDate.toISOString() : null,
            type: product.type,
            name: product.name,
            sellingPrice: product.sellingPrice
          };
        }),
        followUpDate: followUpDate,
        totalPrice: calculateTotalPrice(),
        notes: notes,
        // Include patient information if available
        patientInfo: clientType === 'patient' && clientDetails ? {
          name: clientDetails.name || '',
          phone: clientDetails.phone || '',
          email: clientDetails.email || ''
        } : null,
        // Include file URLs if any were uploaded
        fileUrls: uploadedFileUrls
      };
      
      // Submit the data
      createDiagnostic(diagnosticData);
    } catch (error) {
      console.error('Error during submission:', error);
      setSubmitError("Une erreur est survenue lors de la création du diagnostic");
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
          <DiagnosticStepperSidebar 
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
                          {product.resultDueDate && (
                            <div className="text-sm text-gray-600">
                              Résultats attendus le: {new Date(product.resultDueDate).toLocaleDateString()}
                            </div>
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
                
                {/* Notes Section */}
                <div className="mt-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-lg">Notes</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Ajoutez des notes ou commentaires concernant ce diagnostic.
                    </p>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Saisissez vos notes ici..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* File Upload Section */}
                <div className="mt-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-lg">Documents du Patient</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Ajoutez des documents liés à ce diagnostic. Les documents seront automatiquement associés au patient.
                    </p>
                    
                    {clientType === 'patient' && selectedClient ? (
                      <>
                        <FileManager
                          form={form}
                          existingFiles={existingFiles}
                          onFileChange={handleFileChange}
                          onRemoveExistingFile={handleRemoveExistingFile}
                          className="w-full"
                          endpoint="documentUploader"
                          maxFiles={5}
                        />
                        <div className="mt-4 text-sm text-gray-600">
                          <p>Les fichiers seront automatiquement associés au diagnostic et au patient lors de la soumission.</p>
                          <p>Vous n'avez pas besoin de cliquer sur "Enregistrer les fichiers" - ils seront enregistrés avec le diagnostic.</p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                        <p className="text-sm text-yellow-700">Vous devez sélectionner un patient pour ajouter des documents.</p>
                      </div>
                    )}
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

export default DiagnosticStepperDialog;