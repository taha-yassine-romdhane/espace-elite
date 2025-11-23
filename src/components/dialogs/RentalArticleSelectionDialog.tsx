import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Stethoscope, Package, X, MapPin } from 'lucide-react';

interface RentalArticleSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onDeviceSelect: (device: any) => void;
  onAccessoriesSelect: (accessories: any[]) => void;
  selectedDeviceId?: string;
  selectedAccessoryIds?: string[];
}

export function RentalArticleSelectionDialog({
  open,
  onClose,
  onDeviceSelect,
  onAccessoriesSelect,
  selectedDeviceId,
  selectedAccessoryIds = []
}: RentalArticleSelectionDialogProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('devices');
  const [tempSelectedAccessories, setTempSelectedAccessories] = useState<any[]>([]);

  // Fetch medical devices (only employee's stock location, MEDICAL_DEVICE type, FOR_RENT destination, ACTIVE status)
  const { data: devicesData, isLoading: loadingDevices } = useQuery({
    queryKey: ['medical-devices', 'available-for-rental'],
    queryFn: async () => {
      const response = await fetch('/api/medical-devices?type=MEDICAL_DEVICE&showReserved=false&assignedToMe=true');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      // API returns array directly, filter for rental-ready devices
      const devices = Array.isArray(data) ? data : [];
      return devices.filter((d: any) =>
        d.type === 'MEDICAL_DEVICE' &&
        d.destination === 'FOR_RENT' &&
        d.status === 'ACTIVE'
      );
    },
    enabled: open && !!session,
  });

  // Fetch accessories (only from employee's stock location)
  const { data: accessoriesData, isLoading: loadingAccessories } = useQuery({
    queryKey: ['products', 'accessories'],
    queryFn: async () => {
      const response = await fetch('/api/products?type=ACCESSORY&assignedToMe=true');
      if (!response.ok) throw new Error('Failed to fetch accessories');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: open && !!session,
  });

  const devices = devicesData || [];
  const accessories = accessoriesData || [];

  // Filter based on search
  const filteredDevices = devices.filter((device: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      device.deviceCode?.toLowerCase().includes(searchLower) ||
      device.name?.toLowerCase().includes(searchLower) ||
      device.brand?.toLowerCase().includes(searchLower) ||
      device.model?.toLowerCase().includes(searchLower) ||
      device.serialNumber?.toLowerCase().includes(searchLower)
    );
  });

  const filteredAccessories = accessories.filter((acc: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acc.productCode?.toLowerCase().includes(searchLower) ||
      acc.name?.toLowerCase().includes(searchLower) ||
      acc.brand?.toLowerCase().includes(searchLower) ||
      acc.model?.toLowerCase().includes(searchLower)
    );
  });

  const handleDeviceSelect = (device: any) => {
    onDeviceSelect({
      id: device.id,
      name: device.name,
      code: device.deviceCode,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber
    });
    onClose();
  };

  const handleAccessoryToggle = (accessory: any) => {
    const isSelected = tempSelectedAccessories.find(a => a.id === accessory.id);
    if (isSelected) {
      setTempSelectedAccessories(tempSelectedAccessories.filter(a => a.id !== accessory.id));
    } else {
      setTempSelectedAccessories([...tempSelectedAccessories, {
        id: accessory.id,
        name: accessory.name,
        code: accessory.productCode,
        brand: accessory.brand,
        model: accessory.model,
        unitPrice: accessory.sellingPrice || accessory.price || 0
      }]);
    }
  };

  const handleConfirmAccessories = () => {
    onAccessoriesSelect(tempSelectedAccessories);
    setTempSelectedAccessories([]);
    onClose();
  };

  const handleClose = () => {
    setTempSelectedAccessories([]);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="text-lg font-bold text-blue-900">
            Sélection d'Articles pour Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Appareils Médicaux
              </TabsTrigger>
              <TabsTrigger value="accessories" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Accessoires
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'devices' ? "Rechercher un appareil..." : "Rechercher un accessoire..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Medical Devices Tab */}
            <TabsContent value="devices" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-2">
                  {loadingDevices ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chargement des appareils...
                    </div>
                  ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun appareil disponible
                    </div>
                  ) : (
                    filteredDevices.map((device: any) => (
                      <div
                        key={device.id}
                        onClick={() => handleDeviceSelect(device)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedDeviceId === device.id
                            ? 'bg-green-50 border-green-500'
                            : 'hover:bg-blue-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Stethoscope className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-300">
                                  {device.deviceCode}
                                </Badge>
                                {selectedDeviceId === device.id && (
                                  <Badge className="bg-green-600 text-white text-xs">✓</Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm text-gray-900 truncate">{device.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                {device.brand && <span>{device.brand}</span>}
                                {device.model && <span>• {device.model}</span>}
                                {device.stockLocation && (
                                  <span className="flex items-center gap-1">
                                    <span>•</span>
                                    <MapPin className="h-3 w-3" />
                                    <span>{device.stockLocation.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Accessories Tab */}
            <TabsContent value="accessories" className="flex-1 overflow-hidden mt-4">
              {tempSelectedAccessories.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-900">
                      {tempSelectedAccessories.length} accessoire{tempSelectedAccessories.length > 1 ? 's' : ''} sélectionné{tempSelectedAccessories.length > 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleConfirmAccessories}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Confirmer la sélection
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempSelectedAccessories.map((acc) => (
                      <Badge key={acc.id} variant="outline" className="text-xs">
                        {acc.name}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => handleAccessoryToggle(acc)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <ScrollArea className="h-[350px] rounded-md border">
                <div className="p-4 space-y-2">
                  {loadingAccessories ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chargement des accessoires...
                    </div>
                  ) : filteredAccessories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun accessoire trouvé
                    </div>
                  ) : (
                    filteredAccessories.map((acc: any) => {
                      const isSelected = tempSelectedAccessories.find(a => a.id === acc.id);
                      return (
                        <div
                          key={acc.id}
                          onClick={() => handleAccessoryToggle(acc)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'bg-green-50 border-green-500'
                              : 'hover:bg-blue-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs font-mono bg-orange-50 text-orange-700 border-orange-300">
                                    {acc.productCode}
                                  </Badge>
                                  {isSelected && (
                                    <Badge className="bg-green-600 text-white text-xs">✓</Badge>
                                  )}
                                </div>
                                <p className="font-medium text-sm text-gray-900 truncate">{acc.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                  {acc.brand && <span>{acc.brand}</span>}
                                  {acc.model && <span>• {acc.model}</span>}
                                  {(acc.sellingPrice || acc.price) && (
                                    <span>• {(acc.sellingPrice || acc.price).toFixed(2)} DT</span>
                                  )}
                                  {acc.stockQuantity !== undefined && (
                                    <span>• Stock: {acc.stockQuantity}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {activeTab === 'accessories' && tempSelectedAccessories.length > 0 && (
            <Button onClick={handleConfirmAccessories} className="bg-green-600 hover:bg-green-700">
              Confirmer ({tempSelectedAccessories.length} accessoire{tempSelectedAccessories.length > 1 ? 's' : ''})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
