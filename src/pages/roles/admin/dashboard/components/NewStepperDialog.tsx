import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { PaymentStep } from "./steps/PaymentStep";
import { ProductDialog } from "./dialogs/ProductDialog";
import { useQuery } from "@tanstack/react-query";
import { MedicalDeviceForm } from "@/pages/roles/admin/appareils/components/forms/MedicalDeviceForm";
import { AccessoryForm } from "@/pages/roles/admin/appareils/components/forms/AccessoryForm";
import { SparePartForm } from "@/pages/roles/admin/appareils/components/forms/SparePartForm";
import { DiagnosticDeviceForm } from "@/pages/roles/admin/appareils/components/forms/DiagnosticDeviceForm";
import { Button } from "@/components/ui";
import SaleStepperSidebar from "./SaleStepperSidebar";
import { toast } from "@/components/ui/use-toast";

// Import the client-specific product selection components
import PatientProductSelection from "./steps/product/PatientProductSelection";
import CompanyProductSelection from "./steps/product/CompanyProductSelection";

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
  const [clientDetails, setClientDetails] = useState<any | null>(null);
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

  // Calculate total price
  const calculateTotalPrice = useCallback(() => {
    return selectedProducts.reduce((total, product) => {
      // Ensure price and quantity are valid numbers
      const price = typeof product.sellingPrice === 'number' ? product.sellingPrice : 
                   (parseFloat(product.sellingPrice) || 0);
      const quantity = typeof product.quantity === 'number' ? product.quantity : 
                      (parseInt(product.quantity) || 1);
      return total + (price * quantity);
    }, 0);
  }, [selectedProducts]);

  // Ensure totalPrice is always a valid number
  const totalPrice = calculateTotalPrice();

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

  // Fetch client details when client is selected
  const fetchClientDetails = useCallback(async (id: string, type: "patient" | "societe") => {
    if (!id) return;

    try {
      // Fix: Use societes endpoint instead of companies for company data
      const endpoint = type === "patient" ? "patients" : "societes";
      const response = await fetch(`/api/${endpoint}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} details`);
      }
      const data = await response.json();

      setClientDetails({
        ...data,
        type,
        // Normalize fields for display
        firstName: data.firstName || data.prenom || "",
        lastName: data.lastName || data.nom || "",
        nomComplet: data.nomComplet || `${data.firstName || ""} ${data.lastName || ""}`,
        nomSociete: data.companyName || data.nomSociete || data.name || "",
        telephone: data.telephone || data.telephonePrincipale || "",
        address: data.address || data.adresseComplete || "",
        cin: data.cin || "",
        matriculeFiscale: data.matriculeFiscale || data.fiscalNumber || ""
      });
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les détails du ${type === "patient" ? "patient" : "société"}.`,
        variant: "destructive"
      });
    }
  }, []);

  const handleClientTypeChange = (type: "patient" | "societe") => {
    setClientType(type);
    setSelectedClient(null);
    setClientDetails(null);
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
    // If moving from client selection to product selection and we have a client selected,
    // fetch the client details for display in the sidebar
    if (currentStep === 1 && selectedClient && clientType) {
      fetchClientDetails(selectedClient, clientType);
    }
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

  // Handle payment completion
  const handlePaymentComplete = (paymentData: any) => {
    console.log('Payment data:', paymentData);
    // Here you would normally save the payment to your backend
    toast({
      title: "Paiement enregistré",
      description: "Le paiement a été enregistré avec succès.",
      variant: "default"
    });
    // Close the dialog after successful payment
    handleClose();
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="flex h-full overflow-hidden">
          {/* Sale Stepper Sidebar */}
          {action === "vente" && (
            <SaleStepperSidebar
              steps={steps}
              currentStep={currentStep}
              clientDetails={clientDetails}
              selectedProducts={selectedProducts}
              totalPrice={totalPrice}
            />
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 p-4 pb-4 border-b">
              <DialogTitle>{getActionTitle()}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {currentStep === 1 && (
                  <ClientSelectionStep
                    onNext={handleNext}
                    onClose={handleClose}
                    onClientTypeChange={handleClientTypeChange}
                    onClientSelect={setSelectedClient}
                    clientType={clientType}
                    selectedClient={selectedClient}
                    clients={clients}
                    error={error}
                    action={action}
                  />
                )}

                {currentStep === 2 && clientType === "patient" && (
                  <PatientProductSelection
                    onSelectProduct={handleOpenProductDialog}
                    onCreateProduct={handleOpenCreateForm}
                    selectedProducts={selectedProducts}
                    onRemoveProduct={handleRemoveProduct}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                )}
                
                {currentStep === 2 && clientType === "societe" && (
                  <CompanyProductSelection
                    onSelectProduct={handleOpenProductDialog}
                    onCreateProduct={handleOpenCreateForm}
                    selectedProducts={selectedProducts}
                    onRemoveProduct={handleRemoveProduct}
                    onUpdateProductQuantity={(index, quantity) => {
                      // Create a copy of the selected products array
                      const updatedProducts = [...selectedProducts];
                      // Update the quantity of the product at the specified index
                      updatedProducts[index] = {
                        ...updatedProducts[index],
                        quantity: quantity
                      };
                      // Update the state with the modified array
                      setSelectedProducts(updatedProducts);
                    }}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                )}

                {currentStep === 3 && (
                  <PaymentStep
                    onBack={handleBack}
                    onComplete={handlePaymentComplete}
                    selectedClient={clientDetails}
                    selectedProducts={selectedProducts}
                    calculateTotal={calculateTotalPrice}
                  />
                )}
              </div>
            </div>
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
                    onSubmit={ (data) => {
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
                    onSubmit={async (data) => {
                      await handleProductSelect({ ...data, type: "DIAGNOSTIC_DEVICE" });
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

export default NewStepperDialog;
