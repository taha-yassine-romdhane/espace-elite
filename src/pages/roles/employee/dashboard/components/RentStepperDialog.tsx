import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { ProductDialog } from "./dialogs/ProductDialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MedicalDeviceForm } from "@/components/appareils/forms/MedicalDeviceForm";
import { AccessoryForm } from "@/components/appareils/forms/AccessoryForm";
import RentStepperSidebar from "./RentStepperSidebar";
import { toast } from "@/components/ui/use-toast";
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { RentalDetailsStep } from "@/components/rental/steps/RentalDetailsStep";
import { PaymentStep } from "@/components/steps/PaymentStep";

interface RentStepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le type de client et le client" },
  { id: 2, name: "Ajout Produits", description: "Sélectionner ou créer des produits" },
  { id: 3, name: "Détails Location", description: "Configurer les détails de la location" },
  { id: 4, name: "Ajout Paiement", description: "Configurer les détails du paiement" },
] as const;

export function RentStepperDialog({ isOpen, onClose }: RentStepperDialogProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Payment State
  const [paymentData, setPaymentData] = useState<any>(null);

  // Client Selection State
  const [clientType, setClientType] = useState<"patient" | "societe" | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<any | null>(null);

  // Product Selection State
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [currentProductType, setCurrentProductType] = useState<
    "medical-device" | "accessory" | null
  >(null);

  // Rental Details State
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days
  const [rentalNotes, setRentalNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate total price
  const calculateTotalPrice = useCallback(() => {
    return selectedProducts.reduce((total, product) => {
      // Ensure price and quantity are valid numbers
      const price = typeof product.rentalPrice === 'number' ? product.rentalPrice : 
                   (parseFloat(product.rentalPrice) || 0);
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

  // Fetch client details when client is selected
  const { data: fetchedClientDetails } = useQuery({
    queryKey: ["client-details", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return null;
      const response = await fetch(`/api/clients/${selectedClient}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }
      return response.json();
    },
    enabled: !!selectedClient
  });
  
  // Update client details when data is fetched
  useEffect(() => {
    if (fetchedClientDetails) {
      setClientDetails(fetchedClientDetails);
    }
  }, [fetchedClientDetails]);


  // Handle client type change
  const handleClientTypeChange = (type: "patient" | "societe") => {
    setClientType(type);
    setSelectedClient(null);
    setClientDetails(null);
  };

  // Product Selection Handlers
  const handleProductSelect = (product: any) => {
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = (index: number, updatedProduct: any) => {
    const newProducts = [...selectedProducts];
    newProducts[index] = updatedProduct;
    setSelectedProducts(newProducts);
  };

  const handleOpenProductDialog = (type: "medical-device" | "accessory") => {
    setCurrentProductType(type);
    setProductDialogOpen(true);
  };

  const handleOpenCreateForm = (type: "medical-device" | "accessory") => {
    setCurrentProductType(type);
    setIsCreateFormOpen(true);
  };

  // Navigation Handlers
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

  const handleClose = () => {
    // Reset all state
    setCurrentStep(1);
    setClientType(null);
    setSelectedClient(null);
    setClientDetails(null);
    setSelectedProducts([]);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setRentalNotes("");
    onClose();
  };

  // Handle rental details completion
  const handleRentalDetailsComplete = (rentalData: any) => {
    setStartDate(rentalData.startDate || startDate);
    setEndDate(rentalData.endDate || endDate);
    setRentalNotes(rentalData.notes || rentalNotes);
    handleNext();
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentData: any) => {
    setPaymentData(paymentData);
    
    // Prepare the final rental data
    const finalRentalData = {
      clientId: clientDetails.id,
      clientType: clientType,
      products: selectedProducts.map(product => ({
        productId: product.id,
        quantity: product.quantity,
        rentalPrice: product.rentalPrice
      })),
      startDate: startDate,
      endDate: endDate,
      notes: rentalNotes,
      payment: paymentData,
      status: "ACTIVE",
      totalPrice: calculateTotalPrice(),
      paidAmount: paymentData.paidAmount || 0,
      remainingAmount: paymentData.remainingAmount || calculateTotalPrice()
    };
    
    // Submit the rental data
    createRentalMutation.mutate(finalRentalData);
  };

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rentalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create rental");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location créée",
        description: "La location a été créée avec succès",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la location",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden">
        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <RentStepperSidebar
            steps={steps}
            currentStep={currentStep}
            clientDetails={clientDetails}
            selectedProducts={selectedProducts}
            totalPrice={totalPrice}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-xl font-semibold text-blue-900">
                Nouvelle Location
              </DialogTitle>
            </DialogHeader>

            <div className="p-6">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <ClientSelectionStep
                    onClientTypeChange={handleClientTypeChange}
                    onClientSelect={setSelectedClient}
                    clientType={clientType}
                    selectedClient={selectedClient}
                    action="location"
                    onNext={handleNext}
                    onClose={handleClose}
                  />
                )}

                {currentStep === 2 && (
                  <ProductSelectionStep
                    clientType={clientType}
                    onSelectProduct={(type) => {
                      if (type === "medical-device" || type === "accessory") {
                        handleOpenProductDialog(type);
                      }
                    }}
                    onCreateProduct={(type) => {
                      if (type === "medical-device" || type === "accessory") {
                        handleOpenCreateForm(type);
                      }
                    }}
                    selectedProducts={selectedProducts}
                    onRemoveProduct={handleRemoveProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onBack={handleBack}
                    onNext={handleNext}
                    isRental={true}
                  />
                )}

                {currentStep === 3 && (
                  <RentalDetailsStep
                    startDate={startDate}
                    endDate={endDate}
                    notes={rentalNotes}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onNotesChange={setRentalNotes}
                    onBack={handleBack}
                    onComplete={handleRentalDetailsComplete}
                    isSubmitting={false}
                  />
                )}
                
                {currentStep === 4 && (
                  <PaymentStep
                    onBack={handleBack}
                    onComplete={handlePaymentComplete}
                    selectedClient={clientDetails}
                    selectedProducts={selectedProducts}
                    calculateTotal={calculateTotalPrice}
                    isRental={true}
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
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RentStepperDialog;
