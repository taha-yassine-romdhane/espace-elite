import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Stethoscope,
  Puzzle,
  Cog,
  Activity,
  Info,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSelectionStepProps {
  onSelectProduct: (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => void;
  onCreateProduct: (type: "medical-device" | "accessory" | "spare-part" | "diagnostic") => void;
  selectedProducts?: any[];
  onRemoveProduct: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ProductSelectionStep({
  onSelectProduct,
  onCreateProduct,
  selectedProducts = [],
  onRemoveProduct,
  onBack,
  onNext,
}: ProductSelectionStepProps) {
  const productTypes = [
    { 
      id: "medical-device", 
      label: "Appareil", 
      selectLabel: "Select Appareil", 
      createLabel: "Créer Appareil",
      icon: Stethoscope
    },
    { 
      id: "accessory", 
      label: "Accessoire", 
      selectLabel: "Select Accessoire", 
      createLabel: "Créer Accessoire",
      icon: Puzzle
    },
    { 
      id: "spare-part", 
      label: "Pièce", 
      selectLabel: "Select Pièce", 
      createLabel: "Créer Pièce",
      icon: Cog
    },
    { 
      id: "diagnostic", 
      label: "Diagnostic", 
      selectLabel: "Select Diagnostic", 
      createLabel: "Créer Diagnostic",
      icon: Activity
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Product Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {productTypes.map((type) => (
          <div key={type.id} className="space-y-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full h-10 flex items-center gap-2 px-4",
                  "border-[#1e3a8a] border-opacity-20 hover:border-opacity-100",
                  "bg-white text-[#1e3a8a]",
                  "hover:bg-blue-50 transition-all duration-200",
                  "rounded-md"
                )}
                onClick={() => onSelectProduct(type.id)}
              >
                <type.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">{type.selectLabel}</span>
                <Info className="h-4 w-4 text-[#1e3a8a] opacity-50" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full h-10 flex items-center gap-2 px-4",
                  "border-[#1e3a8a] border-opacity-20 hover:border-opacity-100",
                  "bg-blue-50/30 text-[#1e3a8a]",
                  "hover:bg-blue-50 transition-all duration-200",
                  "rounded-md"
                )}
                onClick={() => onCreateProduct(type.id)}
              >
                <type.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">{type.createLabel}</span>
                <Plus className="h-4 w-4 text-[#1e3a8a] opacity-50" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Products */}
      {selectedProducts?.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-base font-medium text-[#1e3a8a]">Produits Sélectionnés</h3>
          <div className="space-y-2">
            {selectedProducts.map((product, index) => (
              <Card key={`${product.id}-${index}`} className="p-3 border-[#1e3a8a]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{product.name}</span>
                    {product.quantity && (
                      <span className="text-sm text-gray-500">x{product.quantity}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onRemoveProduct(index)}
                  >
                    <span className="sr-only">Remove</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className={cn(
            "text-[#1e3a8a] border-[#1e3a8a] border-opacity-20",
            "hover:bg-blue-50 hover:border-opacity-100",
            "flex items-center gap-2 h-9 px-4"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={selectedProducts?.length === 0}
          className={cn(
            "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white",
            "flex items-center gap-2 h-9 px-4",
            "disabled:opacity-50"
          )}
        >
          Continuer
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ProductSelectionStep;
