import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Stethoscope, Puzzle, Cog, Activity, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "medical-device" | "accessory" | "spare-part" | "diagnostic";
  onSelect: (product: any) => void;
}

export function ProductDialog({ isOpen, onClose, type, onSelect }: ProductDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

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

    const matchesSearch = !searchQuery || searchFields.some(
      field => field?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Location filtering
    const matchesLocation = selectedLocation === "all" || product.stockLocationId === selectedLocation;

    return matchesSearch && matchesLocation;
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
            <div className="w-48">
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
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : filteredProducts?.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Aucun produit trouvé</div>
            ) : (
              filteredProducts?.map((product: any) => (
                <Card
                  key={`${product.id}-${product.stockLocationId || 'no-location'}`}
                  className="p-3 cursor-pointer hover:border-[#1e3a8a] transition-colors"
                  onClick={() => {
                    onSelect(product);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        {/* Type Badge */}
                        {type === "medical-device" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            <span className="text-xs">Appareil</span>
                          </Badge>
                        )}
                        {type === "accessory" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                            <Puzzle className="h-3 w-3" />
                            <span className="text-xs">Accessoire</span>
                          </Badge>
                        )}
                        {type === "spare-part" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                            <Cog className="h-3 w-3" />
                            <span className="text-xs">Pièce</span>
                          </Badge>
                        )}
                        {type === "diagnostic" && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span className="text-xs">Diagnostic</span>
                          </Badge>
                        )}
                      </div>
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
                        {/* Stock Badge */}
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Stock: {product.stockQuantity || 1}
                        </Badge>
                        
                        {/* Status Badge */}
                        {product.status && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1",
                              (product.status === "AVAILABLE" || product.status === "ACTIVE") && "bg-green-50 text-green-700 border-green-200",
                              product.status === "RESERVED" && "bg-amber-50 text-amber-700 border-amber-200",
                              (product.status === "UNAVAILABLE" || product.status === "MAINTENANCE" || product.status === "RETIRED") && "bg-red-50 text-red-700 border-red-200",
                              !product.status || product.status === "UNKNOWN" && "bg-gray-50 text-gray-700 border-gray-200"
                            )}
                          >
                            {(product.status === "AVAILABLE" || product.status === "ACTIVE") && <CheckCircle2 className="h-3 w-3" />}
                            {product.status === "RESERVED" && <AlertCircle className="h-3 w-3" />}
                            {(product.status === "UNAVAILABLE" || product.status === "MAINTENANCE" || product.status === "RETIRED") && <XCircle className="h-3 w-3" />}
                            {!product.status || product.status === "UNKNOWN" && <span className="h-3 w-3" />}
                            <span className="text-xs">
                              {product.status === "AVAILABLE" || product.status === "ACTIVE" ? "Disponible" : 
                               product.status === "RESERVED" ? "Réservé" : 
                               product.status === "MAINTENANCE" ? "En maintenance" :
                               product.status === "RETIRED" ? "Retiré" :
                               product.status === "UNAVAILABLE" ? "Indisponible" : 
                               "État inconnu"}
                            </span>
                          </Badge>
                        )}
                        
                        {/* If no status is provided, show a default available badge */}
                        {!product.status && product.stockQuantity && product.stockQuantity > 0 && (
                          <Badge 
                            variant="outline" 
                            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-xs">Disponible</span>
                          </Badge>
                        )}
                      </div>
                    </div>
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

export default ProductDialog;