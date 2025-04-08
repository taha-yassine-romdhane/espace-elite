import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { ProductDialog } from "./dialogs/ProductDialog";
import { useQuery } from "@tanstack/react-query";
import { MedicalDeviceForm } from "@/pages/appareils/components/forms/MedicalDeviceForm";
import { AccessoryForm } from "@/pages/appareils/components/forms/AccessoryForm";
import { SparePartForm } from "@/pages/appareils/components/forms/SparePartForm";
import { DiagnosticDeviceForm } from "@/pages/appareils/components/forms/DiagnosticDeviceForm";
import { Button } from "@/components/ui";

interface StepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "location" | "vente" | "diagnostique" | null;
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le type de client et le client" },
  { id: 2, name: "Ajout Produits", description: "Sélectionner ou créer des produits" },
  { id: 3, name: "Ajout Paiement", description: "Configurer les détails du paiement" },
] as const;

export function NewStepperDialog({ isOpen, onClose, action }: StepperDialogProps) {
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
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [currentProductType, setCurrentProductType] = useState<
    "medical-device" | "accessory" | "spare-part" | "diagnostic" | null
  >(null);

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

  const handleOpenProductDialog = (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => {
    setCurrentProductType(type);
    setProductDialogOpen(true);
  };

  const handleOpenCreateForm = (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => {
    setCurrentProductType(type);
    setIsCreateFormOpen(true);
  };

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
    setCurrentProductType(null);
    setProductDialogOpen(false);
    setIsCreateFormOpen(false);
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{getActionTitle()}</DialogTitle>
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
                action={action}
              />
            )}

            {currentStep === 2 && (
              <ProductSelectionStep
                onSelectProduct={handleOpenProductDialog}
                onCreateProduct={handleOpenCreateForm}
                selectedProducts={selectedProducts}
                onRemoveProduct={handleRemoveProduct}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Ajout Paiement</h3>
                {/* Payment form will be added here */}
                <div className="flex justify-between pt-6 border-t">
                  <Button variant="outline" onClick={handleBack}>
                    ← Retour
                  </Button>
                  <Button onClick={handleNext}>
                    Terminer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selection Dialog */}
        {currentProductType && (
          <ProductDialog
            isOpen={productDialogOpen}
            onClose={() => {
              setProductDialogOpen(false);
              setCurrentProductType(null);
            }}
            type={currentProductType}
            onSelect={handleProductSelect}
          />
        )}

        {/* Create Form Dialog */}
        {currentProductType && isCreateFormOpen && (
          <Dialog open={isCreateFormOpen} onOpenChange={() => setIsCreateFormOpen(false)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {currentProductType === "medical-device" && "Créer un Appareil"}
                  {currentProductType === "accessory" && "Créer un Accessoire"}
                  {currentProductType === "spare-part" && "Créer une Pièce"}
                  {currentProductType === "diagnostic" && "Créer un Diagnostic"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {currentProductType === "medical-device" && (
                  <MedicalDeviceForm
                    onSubmit={(data) => {
                      handleProductSelect({ ...data, type: "MEDICAL_DEVICE" });
                      setIsCreateFormOpen(false);
                    }}
                    stockLocations={stockLocations || []}
                  />
                )}
                {currentProductType === "accessory" && (
                  <AccessoryForm
                    onSubmit={(data) => {
                      handleProductSelect({ ...data, type: "ACCESSORY" });
                      setIsCreateFormOpen(false);
                    }}
                    stockLocations={stockLocations || []}
                  />
                )}
                {currentProductType === "spare-part" && (
                  <SparePartForm
                    onSubmit={(data) => {
                      handleProductSelect({ ...data, type: "SPARE_PART" });
                      setIsCreateFormOpen(false);
                    }}
                    stockLocations={stockLocations || []}
                  />
                )}
                {currentProductType === "diagnostic" && (
                  <DiagnosticDeviceForm
                    onSubmit={(data) => {
                      handleProductSelect({ ...data, type: "DIAGNOSTIC_DEVICE" });
                      setIsCreateFormOpen(false);
                    }}
                    stockLocations={stockLocations || []}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
