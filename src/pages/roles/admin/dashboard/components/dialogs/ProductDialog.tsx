import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Stethoscope, Puzzle, Cog, Activity, CheckCircle2, XCircle, AlertCircle, HeartPulse, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeviceStatusInfo } from "@/utils/statusUtils";
import { DeviceStatus, ProductType } from "@prisma/client";

const getIconForType = (type: ProductType) => {
  switch (type) {
    case ProductType.MEDICAL_DEVICE:
      return <HeartPulse className="h-6 w-6 text-gray-500" />;
    case ProductType.ACCESSORY:
      return <Package className="h-6 w-6 text-gray-500" />;
    case ProductType.SPARE_PART:
      return <Wrench className="h-6 w-6 text-gray-500" />;
    case ProductType.DIAGNOSTIC_DEVICE:
      return <Stethoscope className="h-6 w-6 text-gray-500" />;
    default:
      return null;
  }
};

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "medical-device" | "accessory" | "spare-part" | "diagnostic";
  onSelect: (product: any) => void;
}

export function ProductDialog({ isOpen, onClose, type, onSelect }: ProductDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

  // Fetch stock locations
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

  // Fetch products based on type
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", type],
    queryFn: async () => {
      let response;
      let data;
      
      // Strictly separate devices and products by their source table
      if (type === "medical-device") {
        // Fetch only MEDICAL_DEVICE type devices from the medicalDevice table
        response = await fetch(`/api/medical-devices?type=MEDICAL_DEVICE`);
        if (!response.ok) {
          throw new Error(`Failed to fetch medical devices`);
        }
        data = await response.json();
        
        // Ensure we only get true medical devices, not products with the same name
        data = data.filter((item: any) => 
          // Explicitly check the type is MEDICAL_DEVICE and the source is the medicalDevice table
          item.type === "MEDICAL_DEVICE" && 
          // We can check for properties that only exist on medical devices
          ("availableForRent" in item || "technicalSpecs" in item)
        );
      } 
      else if (type === "diagnostic") {
        // Fetch only DIAGNOSTIC_DEVICE type devices from the medicalDevice table
        response = await fetch(`/api/medical-devices?type=DIAGNOSTIC_DEVICE`);
        if (!response.ok) {
          throw new Error(`Failed to fetch diagnostic devices`);
        }
        data = await response.json();
        
        // Ensure we only get true diagnostic devices
        data = data.filter((item: any) => 
          item.type === "DIAGNOSTIC_DEVICE" && 
          ("availableForRent" in item || "technicalSpecs" in item)
        );
      } 
      else if (type === "accessory") {
        // Fetch accessories from the products table
        response = await fetch(`/api/products?type=ACCESSORY`);
        if (!response.ok) {
          throw new Error(`Failed to fetch accessories`);
        }
        data = await response.json();
        
        // We don't need additional filtering here as the API already filters by type
        // Just log what we got to help with debugging
        console.log(`Fetched ${data.length} accessories from products table:`, data);
      } 
      else if (type === "spare-part") {
        // Fetch spare parts from the products table
        response = await fetch(`/api/products?type=SPARE_PART`);
        if (!response.ok) {
          throw new Error(`Failed to fetch spare parts`);
        }
        data = await response.json();
        
        // We don't need additional filtering here as the API already filters by type
        // Just log what we got to help with debugging
        console.log(`Fetched ${data.length} spare parts from products table:`, data);
      } 
      else {
        throw new Error(`Unknown product type: ${type}`);
      }
      
      console.log(`Fetched ${data.length} ${type} products from the correct table:`, data);
      return data;
    },
  });

  // Enhanced filtering logic
  const filteredProducts = products?.filter((product: any) => {
    // Search query matching
    const searchFields = [
      product.name,
      product.brand,
      product.model,
      product.serialNumber,
      product.stockLocation?.name
    ].filter(Boolean);

    const searchMatch = !searchQuery || searchFields.some(
      field => field?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Location filtering
    const locationMatch =
      selectedLocation === "all" ||
      product.stock?.locationId === selectedLocation ||
      product.stockLocationId === selectedLocation;

    // Status filtering
    const statusMatch = statusFilter === 'all' || product.status === statusFilter;

    return searchMatch && locationMatch && statusMatch;
  });

  const getTitle = () => {
    switch (type) {
      case "medical-device":
        return "Sélectionner un Appareil";
      case "accessory":
        return "Sélectionner un Accessoire";
      case "spare-part":
        return "Sélectionner une Pièce";
      case "diagnostic":
        return "Sélectionner un Diagnostic";
    }
  };

  const getStockLocationName = (product: any) => {
    if (!product) return "Non assigné";
    
    // If the product has a stockLocation object with a name, use it
    if (product.stockLocation?.name) {
      return product.stockLocation.name;
    }
    
    // If we have a stockLocationId but no stockLocation object,
    // try to find the location name from our stockLocations list
    if (product.stockLocationId && stockLocations) {
      const location = stockLocations.find(
        (loc: any) => loc.id === product.stockLocationId
      );
      if (location) return location.name;
    }
    
    return "Non assigné";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher par nom, marque, modèle, n° série ou emplacement"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les stocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les stocks</SelectItem>
                  {stockLocations?.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeviceStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.values(DeviceStatus).map(status => (
                    <SelectItem key={status} value={status}>{getDeviceStatusInfo(status).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : filteredProducts?.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Aucun produit trouvé</div>
            ) : (
              filteredProducts?.map((product: any) => {
                const isStockable = product.type === 'ACCESSORY' || product.type === 'SPARE_PART';
                const isAvailable = isStockable ? product.stockQuantity > 0 : product.status === DeviceStatus.ACTIVE;
                const statusInfo = getDeviceStatusInfo(isStockable ? (product.stockQuantity > 0 ? DeviceStatus.ACTIVE : DeviceStatus.SOLD) : product.status);

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "transition-all",
                      isAvailable 
                        ? "cursor-pointer hover:bg-gray-50 hover:shadow-md" 
                        : "bg-gray-100 opacity-60 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (isAvailable) {
                        onSelect(product);
                      }
                    }}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getIconForType(product.type as ProductType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {product.brand} {product.model}
                          {product.serialNumber && ` • N°${product.serialNumber}`}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {getStockLocationName(product)}
                        </div>
                      </div>
                      <div className="text-right">
                        {product.sellingPrice && (
                          <div className="font-medium text-[#1e3a8a]">
                            {product.sellingPrice} DT
                          </div>
                        )}
                        <div className="flex flex-col gap-1 mt-1">
                          {isStockable && (
                            <Badge variant="outline" className={cn(
                              "bg-gray-50 text-gray-700 border-gray-200",
                              product.stockQuantity === 0 && "bg-red-100 text-red-700 border-red-200"
                            )}>
                              Stock: {product.stockQuantity || 0}
                            </Badge>
                          )}
                          
                          <Badge 
                            variant="outline" 
                            className={cn("flex items-center gap-1", statusInfo.color)}
                          >
                            <statusInfo.Icon className="h-3 w-3" />
                            <span className="text-xs">{isStockable ? (product.stockQuantity > 0 ? 'Disponible' : 'En rupture') : statusInfo.label}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDialog;