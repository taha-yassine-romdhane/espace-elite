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
import { EnhancedRentalDetailsStep } from "@/components/rental/steps/EnhancedRentalDetailsStep";
import { RentalPaymentStep } from "@/components/rental/steps/RentalPaymentStep";
import { RentalRecapStep } from "@/components/rental/steps/RentalRecapStep";

interface RentStepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le type de client et le client" },
  { id: 2, name: "Ajout Produits", description: "Sélectionner ou créer des produits" },
  { id: 3, name: "Configuration Location", description: "Configurer les périodes et détails avancés" },
  { id: 4, name: "Gestion Paiements", description: "Gérer les paiements, CNAM et gaps" },
  { id: 5, name: "Récapitulatif Complet", description: "Vérifier et finaliser la location" },
] as const;

export function RentStepperDialog({ isOpen, onClose }: RentStepperDialogProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Payment State
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // Existing Rental State
  const [existingRentalData, setExistingRentalData] = useState<{
    isExistingRental: boolean;
    importDate?: Date;
    hasActiveCnam?: boolean;
    cnamExpirationDate?: Date;
    cnamMonthlyAmount?: number;
    currentUnpaidAmount?: number;
  }>({
    isExistingRental: false,
    importDate: new Date(),
    hasActiveCnam: false,
    cnamExpirationDate: undefined,
    cnamMonthlyAmount: 0,
    currentUnpaidAmount: 0,
  });

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

  // Enhanced Rental Details State
  const [rentalDetailsData, setRentalDetailsData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Calculate total price - Fixed to handle both daily and monthly pricing
  const calculateTotalPrice = useCallback(() => {
    return selectedProducts.reduce((total, product) => {
      // Check for different price fields that might exist
      let price = 0;
      if (product.rentalPrice) {
        price = typeof product.rentalPrice === 'number' ? product.rentalPrice : parseFloat(product.rentalPrice) || 0;
      } else if (product.dailyPrice) {
        // If it's daily price, use it as is (daily pricing)
        price = typeof product.dailyPrice === 'number' ? product.dailyPrice : parseFloat(product.dailyPrice) || 0;
      } else if (product.price) {
        // Fallback to generic price field
        price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
      }
      
      const quantity = typeof product.quantity === 'number' ? product.quantity : (parseInt(product.quantity) || 1);
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
    setRentalDetailsData(null);
    setPaymentData(null);
    setExistingRentalData({
      isExistingRental: false,
      importDate: new Date(),
      hasActiveCnam: false,
      cnamExpirationDate: undefined,
      cnamMonthlyAmount: 0,
      currentUnpaidAmount: 0,
    });
    onClose();
  };

  // Handle enhanced rental details completion
  const handleRentalDetailsComplete = (rentalData: any) => {
    setRentalDetailsData(rentalData);
    handleNext();
  };

  // Handle enhanced payment completion - now goes to step 5
  const handlePaymentComplete = (paymentData: any) => {
    setPaymentData(paymentData);
    handleNext(); // Go to step 5 (Récapitulatif)
  };

  // Handle final rental submission from step 5
  const handleFinalSubmit = () => {
    // Prepare the comprehensive rental data
    const finalRentalData = {
      clientId: clientDetails.id,
      clientType: clientType,
      products: selectedProducts.map(product => ({
        productId: product.id,
        quantity: product.quantity,
        rentalPrice: product.rentalPrice || 0,
        type: product.type,
        name: product.name,
        parameters: product.parameters || {} // Include device parameters
      })),
      // Enhanced rental details
      globalStartDate: rentalDetailsData?.globalStartDate || new Date(),
      globalEndDate: rentalDetailsData?.globalEndDate,
      isGlobalOpenEnded: rentalDetailsData?.isGlobalOpenEnded || false,
      urgentRental: rentalDetailsData?.urgentRental || false,
      productPeriods: rentalDetailsData?.productPeriods || [],
      identifiedGaps: rentalDetailsData?.identifiedGaps || [],
      notes: rentalDetailsData?.notes || "",
      // Enhanced payment data with CNAM bonds
      paymentPeriods: paymentData?.paymentPeriods || [],
      cnamBonds: paymentData?.cnamBonds || [],
      depositAmount: paymentData?.depositAmount || 0,
      depositMethod: paymentData?.depositMethod || "CASH",
      paymentGaps: paymentData?.gaps || [],
      upcomingAlerts: paymentData?.upcomingAlerts || [],
      patientStatus: paymentData?.patientStatus || "ACTIVE",
      cnamEligible: paymentData?.cnamEligible || false,
      // Status and totals
      status: "ACTIVE",
      totalPrice: rentalDetailsData?.totalCost || calculateTotalPrice(),
      totalPaymentAmount: paymentData?.totalAmount || 0,
      totalCnamAmount: paymentData?.cnamBonds?.reduce((sum: number, bond: any) => sum + bond.totalAmount, 0) || 0,
      isRental: true
    };
    
    // Submit the comprehensive rental data
    createRentalMutation.mutate(finalRentalData);
  };

  // Create rental mutation with enhanced error handling
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: any) => {
      try {
        const response = await fetch("/api/rentals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rentalData),
        });

        if (!response.ok) {
          let errorMessage = "Failed to create rental";
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            
            // Handle specific error cases
            if (response.status === 400) {
              errorMessage = `Données invalides: ${errorMessage}`;
            } else if (response.status === 401) {
              errorMessage = "Non autorisé. Veuillez vous reconnecter.";
            } else if (response.status === 403) {
              errorMessage = "Accès refusé. Permissions insuffisantes.";
            } else if (response.status === 500) {
              errorMessage = "Erreur serveur interne. Veuillez réessayer.";
            }
          } catch (parseError) {
            // If we can't parse the error response, use a generic message
            errorMessage = `Erreur ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // Validate response structure
        if (!result || !result.data) {
          throw new Error("Réponse invalide du serveur");
        }
        
        return result;
      } catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error("Erreur de connexion. Vérifiez votre connexion internet.");
        }
        
        // Re-throw other errors
        throw error;
      }
    },
    onSuccess: (result) => {
      toast({
        title: "Location créée avec succès",
        description: `${result.summary?.totalRentals || 1} location(s) créée(s) pour un montant total de ${result.summary?.totalAmount?.toFixed(2) || 0} DT`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      console.error('Rental creation error:', error);
      
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Une erreur inattendue est survenue lors de la création de la location",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full p-0 overflow-hidden max-h-[95vh]">
        <div className="flex h-[90vh]">
          {/* Sidebar */}
          <RentStepperSidebar
            steps={steps}
            currentStep={currentStep}
            clientDetails={clientDetails}
            selectedProducts={selectedProducts}
            totalPrice={totalPrice}
            rentalDetails={rentalDetailsData}
            paymentData={paymentData}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 border-b flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-blue-900">
                Nouvelle Location
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 flex-1 overflow-hidden">
              <div className="h-full">
                {currentStep === 1 && (
                  <ClientSelectionStep
                    onClientTypeChange={handleClientTypeChange}
                    onClientSelect={setSelectedClient}
                    clientType={clientType}
                    selectedClient={selectedClient}
                    action="location"
                    onNext={handleNext}
                    onClose={handleClose}
                    onExistingRentalDataChange={setExistingRentalData}
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
                  <div className="h-full">
                    <EnhancedRentalDetailsStep
                      selectedProducts={selectedProducts.map(product => ({
                        id: product.id,
                        name: product.name,
                        type: product.type,
                        rentalPrice: product.rentalPrice || 0,
                        quantity: product.quantity || 1,
                        requiresReturn: true
                      }))}
                      onBack={handleBack}
                      onComplete={handleRentalDetailsComplete}
                      isSubmitting={submitting}
                      clientDetails={clientDetails}
                    />
                  </div>
                )}
                
                {currentStep === 4 && (
                  <div className="h-full">
                    <RentalPaymentStep
                      selectedProducts={selectedProducts}
                      selectedClient={clientDetails}
                      rentalDetails={rentalDetailsData}
                      calculateTotal={calculateTotalPrice}
                      onBack={handleBack}
                      onComplete={handlePaymentComplete}
                      isSubmitting={false}
                      existingPaymentData={paymentData} // Pass existing data for persistence
                      existingRentalData={existingRentalData} // Pass existing rental import data
                    />
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="h-full">
                    <RentalRecapStep
                      selectedClient={clientDetails}
                      selectedProducts={selectedProducts}
                      rentalDetails={rentalDetailsData}
                      paymentData={paymentData}
                      calculateTotal={calculateTotalPrice}
                      onBack={handleBack}
                      onFinalize={handleFinalSubmit}
                      isSubmitting={createRentalMutation.isPending}
                    />
                  </div>
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
