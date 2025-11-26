import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientSelectionStep } from "./steps/ClientSelectionStep";
import { PaymentStep } from "@/components/steps/PaymentStep";
import { ProductDialog } from "./dialogs/ProductDialog";
import { useQuery } from "@tanstack/react-query";
import { MedicalDeviceForm } from "@/components/appareils/forms/MedicalDeviceForm";
import { AccessoryForm } from "@/components/appareils/forms/AccessoryForm";
import { SparePartForm } from "@/components/appareils/forms/SparePartForm";
import { DiagnosticDeviceForm } from "@/components/appareils/forms/DiagnosticDeviceForm";
import SaleStepperSidebar from "./SaleStepperSidebar";
import { toast } from "@/components/ui/use-toast";

// Import the product selection components
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { RecapitulationStep } from "@/components/steps/RecapitulationStep";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "vente" | null;
}

interface ClientDetails {
  id: string;
  type: "patient" | "societe";
  firstName?: string;
  lastName?: string;
  nomComplet?: string;
  nomSociete?: string;
  telephone?: string;
  address?: string;
  cin?: string;
  matriculeFiscale?: string;
}

interface SelectedProduct {
  id: string;
  name: string;
  type: string;
  sellingPrice?: number | string;
  rentalPrice?: number | string;
  quantity?: number | string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  stockQuantity?: number;
  warranty?: string | null;
  parameters?: Record<string, string | number | boolean | null | undefined>;
}

// Type for products from ProductDialog and forms which may have optional/null fields
interface ProductDialogItem {
  id?: string;
  name: string;
  type: string;
  sellingPrice?: number | string | null;
  quantity?: number;
  serialNumber?: string | null;
  warranty?: string | null;
  parameters?: Record<string, unknown> | null;
  status?: string;
  // Additional fields that may come from forms
  brand?: string | null;
  model?: string | null;
  purchasePrice?: number | null;
  stockQuantity?: number;
  destination?: string;
  stockLocations?: unknown[];
  [key: string]: unknown; // Allow additional fields from forms
}

interface PaymentItem {
  type: string;
  amount: number | string;
  chequeNumber?: string;
  reference?: string;
  metadata?: {
    groupName?: string;
    products?: SelectedProduct[];
  };
}

const steps = [
  { id: 1, name: "Type de Renseignement", description: "Sélectionner le type de client et le client" },
  { id: 2, name: "Ajout Produits", description: "Sélectionner ou créer des produits" },
  { id: 3, name: "Ajout Paiement", description: "Configurer les détails du paiement" },
  { id: 4, name: "Récapitulatif", description: "Vérifier et finaliser la vente" },
] as const;

export function SaleStepperDialog({ isOpen, onClose, action }: StepperDialogProps) {
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);

  // Client Selection State
  const [clientType, setClientType] = useState<"patient" | "societe" | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);

  // Product Selection State
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [currentProductType, setCurrentProductType] = useState<
    "medical-device" | "accessory" | "spare-part" | "diagnostic" | null
  >(null);

  const [notes, setNotes] = useState("");

  // Calculate total price
  const calculateTotalPrice = useCallback(() => {
    return selectedProducts.reduce((total, product) => {
      // Ensure price and quantity are valid numbers
      const price = typeof product.sellingPrice === 'number' ? product.sellingPrice :
                   (parseFloat(String(product.sellingPrice)) || 0);
      const quantity = typeof product.quantity === 'number' ? product.quantity :
                       (parseInt(String(product.quantity)) || 1);
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
  };

  // Product Selection Handlers
  const handleProductSelect = (products: ProductDialogItem | ProductDialogItem[]) => {
    // Handle both single product and array of products
    const productsArray = Array.isArray(products) ? products : [products];

    // Convert to SelectedProduct format with required fields
    const convertedProducts: SelectedProduct[] = productsArray.map(product => ({
      id: product.id || `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: product.name,
      type: product.type,
      sellingPrice: product.sellingPrice ?? 0,
      quantity: product.quantity || 1,
      serialNumber: product.serialNumber ?? undefined,
      warranty: product.warranty,
      parameters: product.parameters ? (product.parameters as Record<string, string | number | boolean | null | undefined>) : undefined,
    }));

    // Filter out duplicates and add new products
    const newProducts = convertedProducts.filter(product =>
      !selectedProducts.some(selected => selected.id === product.id)
    );

    if (newProducts.length > 0) {
      setSelectedProducts(prev => [...prev, ...newProducts]);

      toast({
        title: "Produits ajoutés",
        description: `${newProducts.length} produit(s) ajouté(s) avec succès.`
      });
    } else if (productsArray.length > 0) {
      toast({
        title: "Produits déjà sélectionnés",
        description: "Tous les produits sélectionnés ont déjà été ajoutés.",
        variant: "destructive"
      });
    }

    setProductDialogOpen(false);
    setCurrentProductType(null);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = (index: number, updatedProduct: SelectedProduct) => {
    const newProducts = [...selectedProducts];
    newProducts[index] = updatedProduct;
    setSelectedProducts(newProducts);
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
    setSelectedProducts([]);
    setCurrentProductType(null);
    setProductDialogOpen(false);
    setIsCreateFormOpen(false);
    setNotes("");
    onClose();
  };

  // Payment completion state
  const [paymentData, setPaymentData] = useState<PaymentItem[] | null>(null);
  const [isFinalizingSale, setIsFinalizingsale] = useState(false);

  // Handle payment completion - now advances to recap step
  const handlePaymentComplete = async (newPaymentData: PaymentItem[]) => {
    try {
      // Store payment data for the recap step
      setPaymentData(newPaymentData);
      
      // Advance to recap step
      setCurrentStep(4);
      
      toast({
        title: "Paiement configuré",
        description: "Vérifiez le récapitulatif avant de finaliser la vente.",
      });
    } catch (error: unknown) {
      console.error('Error processing payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Handle final sale creation from recap step
  const handleFinalizeSale = async () => {
    setIsFinalizingsale(true);
    try {
      // Calculate totals
      const totalAmount = calculateTotalPrice();
      const discount = 0; // You could add discount handling in the future
      const finalAmount = totalAmount - discount;
      
      // Process all payments - pass the payment array directly to the API
      let paymentDetails = null;
      if (Array.isArray(paymentData) && paymentData.length > 0) {
        // paymentData is already an array of payments from the ProductPaymentMatrix
        paymentDetails = paymentData;
      }
      
      // Prepare sale data
      const saleData = {
        saleDate: new Date(),
        totalAmount,
        discount,
        finalAmount,
        status: Array.isArray(paymentData) && paymentData.length > 0 ? 'COMPLETED' : 'PENDING',
        notes: notes,
        patientId: clientType === 'patient' ? clientDetails?.id : null,
        companyId: clientType === 'societe' ? clientDetails?.id : null,
        payment: paymentDetails,
        items: selectedProducts.map(product => {
          const unitPrice = typeof product.sellingPrice === 'number' ? product.sellingPrice : (parseFloat(String(product.sellingPrice)) || 0);
          const qty = typeof product.quantity === 'number' ? product.quantity : (parseInt(String(product.quantity)) || 1);
          return {
            quantity: qty,
            unitPrice: unitPrice,
            discount: 0,
            itemTotal: qty * unitPrice,
            serialNumber: product.serialNumber,
            warranty: product.warranty,
            parameters: product.parameters || null,
            productId: product.type === 'ACCESSORY' || product.type === 'SPARE_PART' ? product.id : null,
            medicalDeviceId: product.type === 'MEDICAL_DEVICE' ? product.id : null,
          };
        })
      };
      
      // Send the data to the API
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sale');
      }
      
      await response.json();

      // Show success message
      toast({
        title: "Vente créée avec succès",
        description: "La vente a été enregistrée avec succès.",
      });
      
      // Close the dialog
      handleClose();
    } catch (error: unknown) {
      console.error('Error creating sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsFinalizingsale(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] min-h-[85vh] overflow-hidden p-0 flex flex-col">
        <div className="flex h-full overflow-hidden">
          {/* Sale Stepper Sidebar */}
          {action === "vente" && (
            <SaleStepperSidebar
              steps={steps}
              currentStep={currentStep}
              clientDetails={clientDetails}
              selectedProducts={selectedProducts}
              totalPrice={totalPrice}
              paymentData={paymentData}
            />
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 p-4 pb-4 border-b">
              <DialogTitle>Nouvelle Vente</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {currentStep === 1 && (
                  <ClientSelectionStep
                    onNext={handleNext}
                    onClose={handleClose}
                    onClientTypeChange={handleClientTypeChange}
                    onClientSelect={setSelectedClient}
                    onClientAdd={() => {}}
                    clientType={clientType}
                    selectedClient={selectedClient}
                    action={action}
                  />
                )}

                {currentStep === 2 && (
                  <ProductSelectionStep
                    clientType={clientType}
                    onSelectProduct={handleOpenProductDialog}
                    onCreateProduct={handleOpenCreateForm}
                    selectedProducts={selectedProducts}
                    onRemoveProduct={handleRemoveProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                )}

                {currentStep === 3 && (
                  <div className="flex flex-col h-full">
                    <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                      <PaymentStep
                        onBack={handleBack}
                        onComplete={handlePaymentComplete}
                        selectedClient={clientDetails}
                        selectedProducts={selectedProducts}
                        calculateTotal={calculateTotalPrice}
                        initialPaymentData={paymentData} // Pass existing payment data for restoration
                      />
                    </div>
                    <div className="p-6 border-t bg-gray-50">
                      <Label htmlFor="sale-notes" className="text-base font-semibold text-gray-800">
                        Notes (facultatif)
                      </Label>
                      <Textarea
                        id="sale-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ajouter des notes sur la vente (par exemple, conditions spéciales, instructions de livraison, etc.)"
                        className="mt-2 min-h-[100px] text-base"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <RecapitulationStep
                    onBack={handleBack}
                    onFinalize={handleFinalizeSale}
                    selectedClient={clientDetails}
                    selectedProducts={selectedProducts}
                    paymentData={paymentData}
                    notes={notes}
                    calculateTotal={calculateTotalPrice}
                    isLoading={isFinalizingSale}
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
            onSelect={(products) => handleProductSelect(products as ProductDialogItem[])}
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

export default SaleStepperDialog;
