import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Package, AlertCircle, Search, Check, Plus, Minus, MapPin
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickMedicalDeviceDialog } from './QuickMedicalDeviceDialog';
import { QuickProductDialog } from './QuickProductDialog';

interface SaleArticleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientType: 'PATIENT' | 'COMPANY';
  existingArticles: any[];
  onArticlesSelected: (articles: any[]) => void;
}

interface InventoryItem {
  id: string;
  type: 'PRODUCT' | 'MEDICAL_DEVICE' | 'ACCESSORY' | 'SPARE_PART';
  name: string;
  code?: string;
  serialNumber?: string;
  sellingPrice: number;
  stockLocationId?: string;
  availableQuantity?: number;
  status?: string;
  stockLocation?: {
    id: string;
    name: string;
  };
}

export function SaleArticleSelectionDialog({
  open,
  onOpenChange,
  clientType,
  existingArticles,
  onArticlesSelected
}: SaleArticleSelectionDialogProps) {
  const { toast } = useToast();

  const [category, setCategory] = useState<'MEDICAL_DEVICE' | 'ACCESSORY' | 'SPARE_PART'>('MEDICAL_DEVICE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, {
    item: InventoryItem;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>>(new Map());
  const [quickCreateDialogOpen, setQuickCreateDialogOpen] = useState(false);
  const [quickProductDialogOpen, setQuickProductDialogOpen] = useState(false);

  // Fetch inventory based on category
  const { data: inventoryData, isLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory', category],
    queryFn: async () => {
      let url = '';
      if (category === 'MEDICAL_DEVICE') {
        // Fetch from user's stock location, exclude reserved devices
        url = '/api/medical-devices?assignedToMe=true&showReserved=false';
      } else if (category === 'ACCESSORY') {
        // Only show accessories in user's stock location
        url = '/api/products?type=ACCESSORY&inStock=true&assignedToMe=true';
      } else if (category === 'SPARE_PART') {
        // Only show spare parts in user's stock location
        url = '/api/products?type=SPARE_PART&inStock=true&assignedToMe=true';
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();

      // Additional client-side filtering for medical devices
      if (category === 'MEDICAL_DEVICE' && Array.isArray(data)) {
        console.log('Filtering medical devices, total received:', data.length);
        const filtered = data.filter((device: any) => {
          // Only ACTIVE devices (exclude SOLD, RESERVED, MAINTENANCE, etc.)
          if (device.status !== 'ACTIVE') {
            console.log('❌ Filtered out device (not ACTIVE):', device.name, 'status:', device.status);
            return false;
          }

          // device.type is 'MEDICAL_DEVICE' for all medical devices
          // We need to check device.deviceType or just accept all MEDICAL_DEVICE types
          if (device.type === 'MEDICAL_DEVICE') {
            console.log('✅ Keeping medical device:', device.name, 'deviceType:', device.deviceType || 'N/A');
            return true;
          }

          console.log('❌ Filtered out (not MEDICAL_DEVICE type):', device.name, 'type:', device.type);
          return false;
        });
        console.log('✅ Final filtered medical devices:', filtered.length);
        return filtered;
      }

      // Filter accessories and spare parts (already filtered by user's stock location via API)
      if ((category === 'ACCESSORY' || category === 'SPARE_PART') && Array.isArray(data)) {
        console.log(`Filtering ${category}, total received:`, data.length);
        const filtered = data.filter((item: any) => {
          // API already filtered by user's stock location, quantity is from user's stock only
          const userStockQty = item.quantity || item.stockQuantity || item.totalQuantity || 0;

          // Exclude items with no stock in user's location
          if (userStockQty <= 0) {
            console.log('❌ Filtered out (no stock in your location):', item.name, 'quantity:', userStockQty);
            return false;
          }

          // Exclude items with SOLD status
          if (item.status === 'SOLD' || item.status === 'OUT_OF_STOCK') {
            console.log('❌ Filtered out (status):', item.name, 'status:', item.status);
            return false;
          }

          // API already filtered for FOR_SALE status
          console.log('✅ Keeping:', item.name, 'your stock qty:', userStockQty, 'location:', item.stockLocation?.name || 'N/A');
          return true;
        });
        console.log(`✅ Final filtered ${category}:`, filtered.length);
        return filtered;
      }

      return data;
    },
    enabled: open,
  });

  const inventory: InventoryItem[] = Array.isArray(inventoryData)
    ? inventoryData.map((item: any) => {
        const inventoryItem: any = {
          id: item.id,
          type: category,
          name: item.name || item.deviceName,
          code: item.productCode || item.deviceCode,
          serialNumber: item.serialNumber,
          sellingPrice: parseFloat(item.sellingPrice || item.price || 0) || 0,
          stockLocationId: item.stockLocationId || item.currentLocationId,
          availableQuantity: parseInt(item.quantity || item.stockQuantity || item.totalQuantity || 1) || 1,
          status: item.status
        };

        // Include stockLocation for medical devices
        if (category === 'MEDICAL_DEVICE' && item.stockLocation) {
          inventoryItem.stockLocation = item.stockLocation;
        }

        return inventoryItem;
      })
    : [];

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(searchLower) ||
           item.code?.toLowerCase().includes(searchLower) ||
           item.serialNumber?.toLowerCase().includes(searchLower);
  });

  // Check if item is already selected
  const isSelected = (itemId: string) => selectedItems.has(itemId);

  // Toggle item selection
  const toggleItem = (item: InventoryItem) => {
    const newSelected = new Map(selectedItems);

    if (newSelected.has(item.id)) {
      // Deselect
      newSelected.delete(item.id);
    } else {
      // Select
      // For patients: only ONE medical device allowed
      if (clientType === 'PATIENT' && category === 'MEDICAL_DEVICE') {
        // Remove any existing medical devices
        Array.from(newSelected.keys()).forEach(key => {
          const selectedItem = newSelected.get(key);
          if (selectedItem?.item.type === 'MEDICAL_DEVICE') {
            newSelected.delete(key);
          }
        });
      }

      newSelected.set(item.id, {
        item,
        quantity: 1,
        unitPrice: Number(item.sellingPrice) || 0,
        discount: 0
      });
    }

    setSelectedItems(newSelected);
  };

  // Update quantity
  const updateQuantity = (itemId: string, delta: number) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);

    if (selected) {
      const newQuantity = Math.max(1, selected.quantity + delta);

      // Medical devices are always quantity 1
      if (selected.item.type === 'MEDICAL_DEVICE') {
        return;
      }

      // Check stock availability
      if (newQuantity > (selected.item.availableQuantity || 1)) {
        toast({
          title: 'Stock insuffisant',
          description: `Quantité maximale disponible: ${selected.item.availableQuantity}`,
          variant: 'destructive'
        });
        return;
      }

      newSelected.set(itemId, { ...selected, quantity: newQuantity });
      setSelectedItems(newSelected);
    }
  };

  // Update price
  const updatePrice = (itemId: string, price: number) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);

    if (selected) {
      newSelected.set(itemId, { ...selected, unitPrice: Number(price) || 0 });
      setSelectedItems(newSelected);
    }
  };

  // Update discount
  const updateDiscount = (itemId: string, discount: number) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);

    if (selected) {
      newSelected.set(itemId, { ...selected, discount: Number(discount) || 0 });
      setSelectedItems(newSelected);
    }
  };

  // Calculate item total
  const calculateItemTotal = (quantity: number, unitPrice: number, discount: number) => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const disc = Number(discount) || 0;
    return (qty * price) - disc;
  };

  const handleConfirm = () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un article',
        variant: 'destructive'
      });
      return;
    }

    const articles = Array.from(selectedItems.values()).map(selected => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      type: selected.item.type,
      productId: selected.item.type !== 'MEDICAL_DEVICE' ? selected.item.id : undefined,
      medicalDeviceId: selected.item.type === 'MEDICAL_DEVICE' ? selected.item.id : undefined,
      name: selected.item.name,
      code: selected.item.code,
      serialNumber: selected.item.serialNumber,
      quantity: Number(selected.quantity) || 1,
      unitPrice: Number(selected.unitPrice) || 0,
      discount: Number(selected.discount) || 0,
      itemTotal: Number(calculateItemTotal(selected.quantity, selected.unitPrice, selected.discount)) || 0,
      stockLocationId: selected.item.stockLocationId,
      parameters: null // Will be set later for patient medical devices
    }));

    onArticlesSelected(articles);
    handleClose();
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    setSearchQuery('');
    setCategory('MEDICAL_DEVICE');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[92vw] max-h-[92vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Compact Header */}
        <div className="px-6 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-blue-900">Sélection des Articles</h2>
                <p className="text-xs text-blue-700">
                  {clientType === 'PATIENT'
                    ? 'Patient: 1 appareil max avec config | Accessoires: multiples'
                    : 'Société: Sélection multiple sans configuration'}
                </p>
              </div>
            </div>
            <Badge className={`${
              clientType === 'PATIENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {clientType === 'PATIENT' ? 'Mode Patient' : 'Mode Société'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Category Tabs */}
          <Tabs value={category} onValueChange={(val) => setCategory(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="MEDICAL_DEVICE">Appareils Médicaux</TabsTrigger>
              <TabsTrigger value="ACCESSORY">Accessoires</TabsTrigger>
              <TabsTrigger value="SPARE_PART">Pièces Détachées</TabsTrigger>
            </TabsList>

            {/* Search and Quick Create */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code, ou numéro de série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              {/* Show create button for all categories */}
              <Button
                onClick={() => {
                  if (category === 'MEDICAL_DEVICE') {
                    setQuickCreateDialogOpen(true);
                  } else {
                    setQuickProductDialogOpen(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                size="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer {category === 'MEDICAL_DEVICE' ? 'Appareil' : category === 'ACCESSORY' ? 'Accessoire' : 'Pièce'}
              </Button>
            </div>

            {/* Inventory Grid */}
            <TabsContent value={category} className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-[520px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-4">
                  {isLoading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Chargement...
                    </div>
                  ) : filteredInventory.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Aucun article disponible
                    </div>
                  ) : (
                    filteredInventory.map((item) => {
                      const selected = selectedItems.get(item.id);
                      const isItemSelected = isSelected(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            isItemSelected
                              ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => !isItemSelected && toggleItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1 flex-wrap">
                                {item.code && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.code}
                                  </Badge>
                                )}
                                {/* Status and quantity badges */}
                                {item.type === 'MEDICAL_DEVICE' && item.status && (
                                  <Badge className={`text-xs ${
                                    item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    item.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                                    item.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {item.status}
                                  </Badge>
                                )}
                                {/* Quantity and status for accessories/spare parts */}
                                {(item.type === 'ACCESSORY' || item.type === 'SPARE_PART') && (
                                  <>
                                    <Badge variant="outline" className={`text-xs ${
                                      (item.availableQuantity || 0) > 10 ? 'bg-green-50 text-green-700 border-green-300' :
                                      (item.availableQuantity || 0) > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                      'bg-red-50 text-red-700 border-red-300'
                                    }`}>
                                      Stock: {item.availableQuantity || 0}
                                    </Badge>
                                    {item.status && (
                                      <Badge className={`text-xs ${
                                        item.status === 'FOR_SALE' || item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                        item.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                                        item.status === 'OUT_OF_STOCK' ? 'bg-gray-100 text-gray-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {item.status}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              <h4 className="font-medium text-sm truncate">{item.name}</h4>
                              {item.serialNumber && (
                                <p className="text-xs text-gray-500 font-mono truncate">SN: {item.serialNumber}</p>
                              )}
                              {/* Stock location for medical devices */}
                              {item.type === 'MEDICAL_DEVICE' && item.stockLocationId && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{item.stockLocation?.name || 'Stock'}</span>
                                </div>
                              )}
                              <p className="text-sm text-green-600 font-bold mt-1">
                                {(Number(item.sellingPrice) || 0).toFixed(2)} DT
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isItemSelected ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item);
                              }}
                              className={`flex-shrink-0 h-8 w-8 p-0 ${isItemSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
                            >
                              {isItemSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>

                          {/* Item Configuration (only for selected items) */}
                          {isItemSelected && selected && (
                            <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                              {/* Quantity (not for medical devices) */}
                              {item.type !== 'MEDICAL_DEVICE' && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Qté:</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateQuantity(item.id, -1)}
                                      disabled={selected.quantity <= 1}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-10 text-center text-sm font-bold">{selected.quantity}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateQuantity(item.id, 1)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Unit Price */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">Prix:</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selected.unitPrice}
                                  onChange={(e) => updatePrice(item.id, parseFloat(e.target.value))}
                                  className="w-24 h-7 text-right text-xs"
                                />
                              </div>

                              {/* Discount */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">Remise:</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selected.discount}
                                  onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value))}
                                  className="w-24 h-7 text-right text-xs"
                                />
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between pt-1 border-t">
                                <span className="text-xs font-bold">Total:</span>
                                <span className="text-sm font-bold text-green-600">
                                  {calculateItemTotal(selected.quantity, selected.unitPrice, selected.discount).toFixed(2)} DT
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t bg-gray-50">
          <div className="text-sm font-medium text-gray-700">
            {selectedItems.size} article{selectedItems.size > 1 ? 's' : ''} sélectionné{selectedItems.size > 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} size="sm">
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedItems.size === 0}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              Confirmer ({selectedItems.size})
            </Button>
          </div>
        </div>

        {/* Quick Create Medical Device Dialog */}
        <QuickMedicalDeviceDialog
          open={quickCreateDialogOpen}
          onOpenChange={setQuickCreateDialogOpen}
          onDeviceCreated={() => {
            refetchInventory();
            toast({
              title: 'Succès',
              description: 'Appareil créé et disponible dans la liste'
            });
          }}
        />

        {/* Quick Create Product Dialog (Accessory/Spare Part) */}
        <QuickProductDialog
          open={quickProductDialogOpen}
          onOpenChange={setQuickProductDialogOpen}
          productType={category === 'ACCESSORY' ? 'ACCESSORY' : 'SPARE_PART'}
          onProductCreated={() => {
            refetchInventory();
            toast({
              title: 'Succès',
              description: `${category === 'ACCESSORY' ? 'Accessoire' : 'Pièce détachée'} créé${category === 'ACCESSORY' ? '' : 'e'} et disponible dans la liste`
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
