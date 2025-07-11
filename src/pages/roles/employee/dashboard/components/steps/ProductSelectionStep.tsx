import PatientProductSelection from "./product/PatientProductSelection";
import CompanyProductSelection from "./product/CompanyProductSelection";

interface ProductSelectionStepProps {
  onSelectProduct: (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => void;
  onCreateProduct: (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => void;
  selectedProducts?: any[];
  onRemoveProduct: (index: number) => void;
  onUpdateProduct?: (index: number, updatedProduct: any) => void;
  onBack: () => void;
  onNext: () => void;
  clientType?: "patient" | "societe" | null;
  isRental?: boolean;
}

/**
 * ProductSelectionStep - A router component that delegates to the appropriate
 * client-specific component based on the clientType prop.
 * 
 * This component is kept for backward compatibility and routes to either
 * PatientProductSelection or CompanyProductSelection based on the client type.
 */
export function ProductSelectionStep({
  selectedProducts = [],
  onSelectProduct,
  onCreateProduct,
  onRemoveProduct,
  onUpdateProduct,
  onBack,
  onNext,
  clientType,
  isRental = false
}: ProductSelectionStepProps) {
  // Handler for company product quantity updates
  const handleQuantityChange = (index: number, quantity: number) => {
    // Create a copy of the selected products array
    const updatedProducts = [...selectedProducts];
    // Update the quantity of the product at the specified index
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: quantity
    };
    // NOTE: This doesn't update the state as it would need to be passed from parent
    // This functionality is now handled in the parent component (NewStepperDialog)
  };

  // Route to the appropriate component based on client type
  if (clientType === "patient") {
    return (
      <PatientProductSelection 
        selectedProducts={selectedProducts}
        onSelectProduct={onSelectProduct}
        onCreateProduct={onCreateProduct}
        onRemoveProduct={onRemoveProduct}
        onUpdateProduct={onUpdateProduct}
        onBack={onBack}
        onNext={onNext}
        isRental={isRental}
      />
    );
  } else if (clientType === "societe") {
    return (
      <CompanyProductSelection
        selectedProducts={selectedProducts}
        onSelectProduct={onSelectProduct}
        onCreateProduct={onCreateProduct}
        onRemoveProduct={onRemoveProduct}
        onUpdateProductQuantity={handleQuantityChange}
        onUpdateProduct={onUpdateProduct}
        onBack={onBack}
        onNext={onNext}
        isRental={isRental}
      />
    );
  }
  
  // Fallback for unspecified client type
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">
        Veuillez d'abord sélectionner un type de client pour continuer.
      </p>
    </div>
  );
}

export default ProductSelectionStep;
