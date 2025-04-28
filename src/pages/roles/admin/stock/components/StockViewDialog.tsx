import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { ProductType } from '@prisma/client';

interface StockViewDialogProps {
  locationId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StockItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    brand: string;
    model: string;
    type: ProductType;
  };
}

export function StockViewDialog({ locationId, locationName, isOpen, onClose }: StockViewDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch stock items for the location
  const { data: stockItems, isLoading } = useQuery<StockItem[]>({
    queryKey: ['locationStock', locationId],
    queryFn: async () => {
      try {
        // Fetch regular inventory items
        const response = await fetch(`/api/stock/inventory?locationId=${locationId}`);
        if (!response.ok) throw new Error('Failed to fetch inventory items');
        const inventoryData = await response.json();
        
        // Check the structure of the response
        console.log('Raw inventory response:', inventoryData);
        
        // Handle the new API response structure (items property)
        const inventoryItems = inventoryData.items || inventoryData;
        
        // Fetch medical devices for this location using our new endpoint
        const devicesResponse = await fetch(`/api/medical-devices/by-location?locationId=${locationId}`);
        let medicalDevices = [];
        let diagnosticDevices = [];
        
        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json();
          medicalDevices = devicesData.medicalDevices || [];
          diagnosticDevices = devicesData.diagnosticDevices || [];
        }
        
        // Convert medical devices to the same format as stock items
        const medicalDeviceItems = medicalDevices
          .filter((device: any) => device.type !== 'DIAGNOSTIC_DEVICE') // Exclude diagnostic devices
          .map((device: any) => ({
            id: device.id,
            quantity: 1, // Medical devices are tracked individually
            product: {
              id: device.id,
              name: device.name,
              brand: device.brand || '',
              model: device.model || '',
              type: ProductType.MEDICAL_DEVICE
            }
          }));
        
        // Convert diagnostic devices to the same format as stock items
        const diagnosticDeviceItems = diagnosticDevices.map((device: any) => ({
          id: device.id,
          quantity: 1, // Diagnostic devices are tracked individually
          product: {
            id: device.id,
            name: device.name,
            brand: device.brand || '',
            model: device.model || '',
            type: ProductType.DIAGNOSTIC_DEVICE
          }
        }));
        
        // Format inventory data to ensure it has the correct structure
        // Check if inventoryItems is an array before mapping
        const formattedInventoryData = Array.isArray(inventoryItems) 
          ? inventoryItems.map((item: any) => ({
              id: item.id,
              quantity: item.quantity || 0,
              product: {
                id: item.product?.id || item.productId,
                name: item.product?.name || item.productName || 'Unknown Product',
                brand: item.product?.brand || '',
                model: item.product?.model || '',
                type: item.product?.type || (item.productType as ProductType)
              }
            }))
          : [];
        
        // Log data for debugging
        console.log('Formatted inventory data:', formattedInventoryData);
        console.log('Medical devices:', medicalDeviceItems);
        console.log('Diagnostic devices:', diagnosticDeviceItems);
        
        // Create a Set to track unique item IDs
        const uniqueItemIds = new Set();
        
        // Function to add items only if they don't already exist
        const addUniqueItems = (items: any[]) => {
          const uniqueItems = [];
          
          for (const item of items) {
            // Create a unique key based on id and type
            const uniqueKey = `${item.id}-${item.product.type}`;
            
            if (!uniqueItemIds.has(uniqueKey)) {
              uniqueItemIds.add(uniqueKey);
              uniqueItems.push(item);
            }
          }
          
          return uniqueItems;
        };
        
        // Add items in priority order (inventory first, then medical devices, then diagnostic devices)
        const uniqueInventoryItems = addUniqueItems(formattedInventoryData);
        const uniqueMedicalDeviceItems = addUniqueItems(medicalDeviceItems);
        const uniqueDiagnosticDeviceItems = addUniqueItems(diagnosticDeviceItems);
        
        // Combine all unique items
        return [...uniqueInventoryItems, ...uniqueMedicalDeviceItems, ...uniqueDiagnosticDeviceItems];
      } catch (error) {
        console.error('Error fetching stock items:', error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Filter stock items based on search query
  const filteredItems = React.useMemo(() => {
    if (!stockItems) return [];
    
    if (searchQuery.trim() === '') {
      return stockItems;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return stockItems.filter(item => 
      (item.product.name && item.product.name.toLowerCase().includes(query)) ||
      (item.product.brand && item.product.brand.toLowerCase().includes(query)) ||
      (item.product.model && item.product.model.toLowerCase().includes(query))
    );
  }, [stockItems, searchQuery]);

  // Group items by type for summary
  const summary = React.useMemo(() => {
    if (!stockItems) return { accessories: 0, spareParts: 0, medicalDevices: 0, diagnosticDevices: 0 };
    
    return stockItems.reduce((acc, item) => {
      const quantity = item.quantity || 0;
      
      switch(item.product.type) {
        case ProductType.ACCESSORY:
          acc.accessories += quantity;
          break;
        case ProductType.SPARE_PART:
          acc.spareParts += quantity;
          break;
        case ProductType.MEDICAL_DEVICE:
          acc.medicalDevices += quantity;
          break;
        case ProductType.DIAGNOSTIC_DEVICE:
          acc.diagnosticDevices += quantity;
          break;
      }
      
      return acc;
    }, { 
      accessories: 0, 
      spareParts: 0, 
      medicalDevices: 0, 
      diagnosticDevices: 0 
    });
  }, [stockItems]);

  // Get badge color based on product type
  const getBadgeVariant = (type: ProductType) => {
    switch(type) {
      case ProductType.ACCESSORY:
        return 'default';
      case ProductType.SPARE_PART:
        return 'secondary';
      case ProductType.MEDICAL_DEVICE:
        return 'destructive';
      case ProductType.DIAGNOSTIC_DEVICE:
        return 'outline';
      default:
        return 'default';
    }
  };

  // Get readable product type name
  const getProductTypeName = (type: ProductType) => {
    switch(type) {
      case ProductType.ACCESSORY:
        return 'Accessoire';
      case ProductType.SPARE_PART:
        return 'Pièce de rechange';
      case ProductType.MEDICAL_DEVICE:
        return 'Appareil médical';
      case ProductType.DIAGNOSTIC_DEVICE:
        return 'Équipement diagnostic';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Stock de l&apos;emplacement: {locationName}</DialogTitle>
          <DialogDescription>
            Détails des produits stockés à cet emplacement
          </DialogDescription>
        </DialogHeader>
        
        {/* Summary section */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Accessoires</div>
            <div className="text-xl font-semibold">{summary.accessories}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Pièces</div>
            <div className="text-xl font-semibold">{summary.spareParts}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Appareils</div>
            <div className="text-xl font-semibold">{summary.medicalDevices}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Diagnostics</div>
            <div className="text-xl font-semibold">{summary.diagnosticDevices}</div>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {/* Stock items table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Modèle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Chargement des produits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchQuery ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit dans cet emplacement'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.product.brand || '-'}</TableCell>
                    <TableCell>{item.product.model || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(item.product.type)}>
                        {getProductTypeName(item.product.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StockViewDialog;
