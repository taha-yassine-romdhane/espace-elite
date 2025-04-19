import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  Info,
  X,
  Settings,
  Sliders,
  CircleAlert,
  CheckCircle2,
  Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiagnosticDeviceForm } from "@/pages/roles/admin/appareils/components/forms/DiagnosticDeviceForm";
import { useQuery } from "@tanstack/react-query";
import { ParameterConsumer } from "@/pages/roles/admin/appareils/components/forms/ParameterConsumer";

interface DiagnosticProductStepProps {
  onBack: () => void;
  onNext: () => void;
  selectedProducts: any[];
  onRemoveProduct: (index: number) => void;
  onSelectProduct: (product: any) => void;
  onUpdateProductParameters?: (productIndex: number, parameters: any) => void;
}

export function DiagnosticProductStep({
  onBack,
  onNext,
  selectedProducts,
  onRemoveProduct,
  onSelectProduct,
  onUpdateProductParameters = () => {},
}: DiagnosticProductStepProps) {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isParameterDialogOpen, setIsParameterDialogOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  
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

  // Fetch ONLY diagnostic devices
  const { data: diagnosticProducts, isLoading } = useQuery({
    queryKey: ["products", "diagnostic"],
    queryFn: async () => {
      const response = await fetch(`/api/medical-devices?type=DIAGNOSTIC_DEVICE`);
      if (!response.ok) {
        throw new Error("Failed to fetch diagnostic devices");
      }
      const data = await response.json();
      // Additional filter to ensure only DIAGNOSTIC_DEVICE types are included
      return data.filter((device: any) => device.type === "DIAGNOSTIC_DEVICE");
    },
  });

  // Fetch parameters for a specific device
  const fetchDeviceParameters = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/diagnostic-parameters?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch device parameters");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching parameters:", error);
      return [];
    }
  };

  const handleOpenProductDialog = () => {
    setProductDialogOpen(true);
  };

  const handleCreateProduct = () => {
    setIsCreateFormOpen(true);
  };

  const handleOpenParameterDialog = async (index: number) => {
    setSelectedProductIndex(index);
    
    // Fetch parameters if they don't exist yet
    const product = selectedProducts[index];
    if (!product.parameters) {
      try {
        const parameters = await fetchDeviceParameters(product.id);
        // Update the product with parameters
        const updatedProducts = [...selectedProducts];
        updatedProducts[index] = { ...product, parameters };
        onUpdateProductParameters(index, parameters);
      } catch (error) {
        console.error("Error fetching parameters:", error);
      }
    }
    
    setIsParameterDialogOpen(true);
  };

  const handleParameterSubmit = (parameters: any) => {
    if (selectedProductIndex !== null) {
      onUpdateProductParameters(selectedProductIndex, parameters);
      setIsParameterDialogOpen(false);
      setSelectedProductIndex(null);
    }
  };

  const handleCloseParameterDialog = () => {
    setIsParameterDialogOpen(false);
  };

  const renderParameterStatus = (product: any) => {
    if (!product.parameters || product.parameters.length === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <CircleAlert className="h-4 w-4 mr-1.5" />
          <span className="text-sm">Paramètres non configurés</span>
        </div>
      );
    }

    // Count parameters with values
    const configuredCount = product.parameters.filter((p: any) => p.value).length;
    const totalCount = product.parameters.length;

    if (configuredCount === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <CircleAlert className="h-4 w-4 mr-1.5" />
          <span className="text-sm">Paramètres non configurés</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-blue-600">
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
        <span className="text-sm">{configuredCount} paramètres configurés</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-[#1e3a8a]">Sélection d'Équipement de Diagnostic</h3>
      
      {/* Diagnostic Product Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "w-full h-auto py-4 flex flex-col items-center gap-3",
            "border-[#1e3a8a] border-opacity-20 hover:border-opacity-100",
            "bg-white text-[#1e3a8a]",
            "hover:bg-blue-50 transition-all duration-200",
            "rounded-md"
          )}
          onClick={handleOpenProductDialog}
        >
          <Activity className="h-6 w-6 text-[#1e3a8a]" />
          <span className="text-sm font-medium">Sélectionner un Équipement de Diagnostic</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "w-full h-auto py-4 flex flex-col items-center gap-3",
            "border-[#1e3a8a] border-opacity-20 hover:border-opacity-100",
            "bg-blue-50/30 text-[#1e3a8a]",
            "hover:bg-blue-50 transition-all duration-200",
            "rounded-md"
          )}
          onClick={handleCreateProduct}
        >
          <Plus className="h-6 w-6 text-[#1e3a8a]" />
          <span className="text-sm font-medium">Créer un Nouvel Équipement de Diagnostic</span>
        </Button>
      </div>

      {/* Selected Products */}
      <div className="space-y-4 mt-6">
        <h4 className="font-medium text-[#1e3a8a]">Équipements Sélectionnés</h4>
        
        {selectedProducts.length === 0 ? (
          <div className="p-4 border border-dashed rounded-md text-center text-gray-500">
            Aucun équipement sélectionné
          </div>
        ) : (
          selectedProducts.map((product, index) => (
            <div className="p-4 border rounded-md mb-4 relative" key={index}>
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => onRemoveProduct(index)}
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="text-blue-700">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h4 className="font-medium text-lg">
                  {product.name}
                  {product.quantity > 1 && (
                    <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                      x{product.quantity}
                    </span>
                  )}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-500">Marque:</span> <span className="font-medium">{product.brand || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Modèle:</span> <span className="font-medium">{product.model || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">N° Série:</span> <span className="font-medium">{product.serialNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prix:</span> <span className="font-medium">{product.sellingPrice || '0'} DT</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                {renderParameterStatus(product)}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-[#1e3a8a] border-[#1e3a8a]/30 hover:border-[#1e3a8a] hover:bg-blue-50"
                  onClick={() => handleOpenParameterDialog(index)}
                >
                  <Sliders className="h-3.5 w-3.5 mr-1.5" />
                  Configurer Paramètres
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

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
          disabled={selectedProducts.length === 0}
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

      {/* Product Selection Dialog */}
      <DiagnosticProductDialog
        isOpen={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        onSelect={onSelectProduct}
        products={diagnosticProducts || []}
        isLoading={isLoading}
      />

      {/* Create Form Dialog */}
      {isCreateFormOpen && (
        <Dialog open={isCreateFormOpen} onOpenChange={() => setIsCreateFormOpen(false)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Créer un Équipement de Diagnostic</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <DiagnosticDeviceForm
                onSubmit={(data) => {
                  // Ensure the new device is created with the correct type
                  onSelectProduct({ ...data, type: "DIAGNOSTIC_DEVICE" });
                  setIsCreateFormOpen(false);
                }}
                stockLocations={stockLocations || []}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Parameter Form Dialog */}
      {isParameterDialogOpen && selectedProductIndex !== null && (
        <Dialog open={isParameterDialogOpen} onOpenChange={handleCloseParameterDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Configurer les Paramètres - {selectedProducts[selectedProductIndex]?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ParameterConsumer
                deviceId={selectedProducts[selectedProductIndex]?.id}
                initialValues={selectedProducts[selectedProductIndex]?.parameters || []}
                onSubmit={handleParameterSubmit}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Separate component for the diagnostic product selection dialog
interface DiagnosticProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: any) => void;
  products: any[];
  isLoading: boolean;
}

function DiagnosticProductDialog({
  isOpen,
  onClose,
  onSelect,
  products,
  isLoading
}: DiagnosticProductDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    // First ensure we only show diagnostic devices
    if (product.type !== "DIAGNOSTIC_DEVICE") return false;
    
    if (!searchQuery) return true;
    
    const searchFields = [
      product.name,
      product.brand,
      product.model,
      product.serialNumber,
      product.stockLocation?.name
    ].filter(Boolean);

    return searchFields.some(
      field => field?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sélectionner un Équipement de Diagnostic</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par nom, marque, modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
            />
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Aucun équipement de diagnostic trouvé</div>
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-3 cursor-pointer hover:border-[#1e3a8a] transition-colors"
                  onClick={() => {
                    onSelect(product);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#1e3a8a]" />
                        <h4 className="font-medium truncate">{product.name}</h4>
                      </div>
                      <div className="text-sm text-gray-500 truncate ml-6">
                        {product.brand} {product.model}
                        {product.serialNumber && ` • N°${product.serialNumber}`}
                      </div>
                    </div>
                    {product.sellingPrice && (
                      <div className="text-right font-medium text-[#1e3a8a]">
                        {product.sellingPrice} DT
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
