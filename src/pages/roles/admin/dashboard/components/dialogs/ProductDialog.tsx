import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";

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
      if (type === "medical-device" || type === "diagnostic") {
        const deviceType = type === "medical-device" ? "MEDICAL_DEVICE" : "DIAGNOSTIC_DEVICE";
        const response = await fetch(`/api/medical-devices?type=${deviceType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch medical devices");
        }
        return response.json();
      } else {
        const productType = type === "accessory" ? "ACCESSORY" : "SPARE_PART";
        const response = await fetch(`/api/products?type=${productType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        return response.json();
      }
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
                      <h4 className="font-medium truncate">{product.name}</h4>
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
                      <Badge variant="outline" className="mt-1">
                        Stock: {product.stockQuantity || 1}
                      </Badge>
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