import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, History, Info, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import TransferHistory from './TransferHistory';
import TransferDetailDialog from './TransferDetailDialog';

interface TransferFormData {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
  notes?: string;
  newStatus?: 'EN_VENTE' | 'RESERVE' | 'DEFECTUEUX';
  isDevice?: boolean; // Flag to indicate if this is a medical device
  productType?: string; // Type of product being transferred
}

interface RecentTransfer {
  id: string;
  fromLocation: {
    name: string;
  };
  toLocation: {
    name: string;
  };
  product: {
    name: string;
    type: string;
  };
  quantity: number;
  transferDate: string;
  transferredBy: {
    firstName: string;
    lastName: string;
    role: string;
  };
  isVerified: boolean | null;
}

// Define product types enum to match the database
enum ProductType {
  MEDICAL_DEVICE = 'MEDICAL_DEVICE',
  DIAGNOSTIC_DEVICE = 'DIAGNOSTIC_DEVICE',
  ACCESSORY = 'ACCESSORY',
  SPARE_PART = 'SPARE_PART'
}

interface Stock {
  id: string;
  product: {
    id: string;
    name: string;
    brand?: string;
    model?: string;
    type?: string;
  };
  quantity: number;
  isDevice?: boolean;
}

export default function StockTransfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new-transfer');
  const [formData, setFormData] = useState<TransferFormData>({
    fromLocationId: '',
    toLocationId: '',
    productId: '',
    quantity: 1,
  });
  
  // State for product search
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [maxAvailableQuantity, setMaxAvailableQuantity] = useState(1);
  
  // State for transfer details dialog
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Current user information - in a real app, this would come from an auth context
  // For demonstration purposes, we'll define a mock user
  const currentUser = {
    id: 'user-1',
    role: 'ADMIN', // This would normally be dynamically determined
    firstName: 'Admin',
    lastName: 'User'
  };

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['stockLocations'],
    queryFn: async () => {
      const response = await fetch('/api/stock/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Fetch available products for selected location
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['availableProducts', formData.fromLocationId],
    queryFn: async () => {
      if (!formData.fromLocationId) return { items: [], summary: { total: 0 } };
      
      // Fetch inventory with all product types
      const response = await fetch(`/api/stock/inventory?locationId=${formData.fromLocationId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      console.log('Inventory data for transfers:', data);
      return data;
    },
    enabled: !!formData.fromLocationId,
  });
  
  // Extract items from the response and add display info
  const products = React.useMemo(() => {
    const items = productsData?.items || productsData || [];
    
    return items.map((item: any) => {
      // Determine if this is a device
      const isDevice = item.isDevice || 
        (item.product?.type === ProductType.MEDICAL_DEVICE || 
         item.product?.type === ProductType.DIAGNOSTIC_DEVICE);
      
      // Create a formatted display name
      const brand = item.product?.brand || '';
      const model = item.product?.model || '';
      const brandModel = [brand, model].filter(Boolean).join(' ');
      const displayName = `${item.product?.name || 'Produit'}${brandModel ? ` - ${brandModel}` : ''}`;
      
      // Add type label
      let typeLabel = '';
      switch(item.product?.type) {
        case ProductType.ACCESSORY:
          typeLabel = 'Accessoire';
          break;
        case ProductType.SPARE_PART:
          typeLabel = 'Pièce de rechange';
          break;
        case ProductType.MEDICAL_DEVICE:
          typeLabel = 'Appareil médical';
          break;
        case ProductType.DIAGNOSTIC_DEVICE:
          typeLabel = 'Équipement diagnostic';
          break;
        default:
          typeLabel = item.product?.type || '';
      }
      
      return {
        ...item,
        displayName,
        typeLabel,
        isDevice,
        // For devices, ensure quantity is 1 as they're transferred as whole units
        quantity: isDevice ? 1 : item.quantity
      };
    });
  }, [productsData]);

  // Fetch recent transfers for the user
  const { data: recentTransfers, isLoading: isLoadingTransfers } = useQuery<RecentTransfer[]>({
    queryKey: ['recentTransfers'],
    queryFn: async () => {
      const response = await fetch('/api/stock/transfers/recent');
      if (!response.ok) throw new Error('Failed to fetch recent transfers');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Create transfer
  const createTransfer = useMutation({
    mutationFn: async (data: TransferFormData) => {
      // Determine the API endpoint based on whether this is a device or regular stock
      const endpoint = data.isDevice 
        ? '/api/medical-devices/transfer' 
        : '/api/stock/transfers';
      
      // Add current user info to the request
      const requestData = {
        ...data,
        transferredById: currentUser.id,
        userRole: currentUser.role
      };
      
      console.log('Sending transfer request to:', endpoint, requestData);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create transfer');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transferHistory'] });
      setIsDialogOpen(false);
      setFormData({
        fromLocationId: '',
        toLocationId: '',
        productId: '',
        quantity: 1,
      });
      
      // Determine the success message based on the user role and verification status
      let successMessage = "Le transfert a été créé avec succès";
      if (currentUser.role !== 'ADMIN') {
        successMessage += " et sera vérifié par un administrateur";
      }
      
      toast({
        title: "Succès",
        description: successMessage,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du transfert",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransfer.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transferts de Stock</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau transfert
            </Button>
          </div>
        </div>
        
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-transfer">Transferts récents</TabsTrigger>
          <TabsTrigger value="history">Historique complet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-transfer" className="space-y-4">
          {/* Display recent transfers (last 7 days) */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Vérification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransfers ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Chargement des transferts récents...
                    </TableCell>
                  </TableRow>
                ) : recentTransfers && recentTransfers.length > 0 ? (
                  recentTransfers.map(transfer => (
                    <TableRow key={transfer.id}>
                      <TableCell>{new Date(transfer.transferDate).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{transfer.product.name}</span>
                          <Badge variant="outline" className="mt-1 self-start">
                            {transfer.product.type === 'MEDICAL_DEVICE' ? 'Appareil médical' :
                             transfer.product.type === 'DIAGNOSTIC_DEVICE' ? 'Équipement diagnostic' :
                             transfer.product.type === 'ACCESSORY' ? 'Accessoire' :
                             transfer.product.type === 'SPARE_PART' ? 'Pièce de rechange' :
                             transfer.product.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{transfer.fromLocation.name}</TableCell>
                      <TableCell>{transfer.toLocation.name}</TableCell>
                      <TableCell>{transfer.quantity}</TableCell>
                      <TableCell>
                        {transfer.isVerified === null && transfer.transferredBy.role !== 'ADMIN' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            En attente
                          </Badge>
                        ) : transfer.isVerified === true ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Vérifié
                          </Badge>
                        ) : transfer.isVerified === false ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Rejeté
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Auto-approuvé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedTransferId(transfer.id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-gray-500">Aucun transfert récent</div>
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un transfert
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau transfert</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Depuis</label>
                <Select
                  value={formData.fromLocationId}
                  onValueChange={(value) => setFormData({ ...formData, fromLocationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l&apos;emplacement source" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location: { id: string; name: string }) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Vers</label>
                <Select
                  value={formData.toLocationId}
                  onValueChange={(value) => setFormData({ ...formData, toLocationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l&apos;emplacement destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location: { id: string; name: string }) => (
                      location.id !== formData.fromLocationId && (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem> 
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Produit</label>
                <div className="space-y-2">
                  {/* Search bar for products */}
                  <div className="relative">
                    <Input
                      placeholder="Rechercher un produit..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                  
                  {/* Product selection dropdown */}
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => {
                      // Find the selected product
                      const selectedProduct = products.find((p: any) => 
                        (p.product?.id || p.id) === value
                      );
                      
                      // Get the max available quantity
                      const maxQuantity = selectedProduct?.quantity || 1;
                      setMaxAvailableQuantity(maxQuantity);
                      
                      // Update form with product info
                      setFormData({ 
                        ...formData, 
                        productId: value,
                        isDevice: selectedProduct?.isDevice || false,
                        productType: selectedProduct?.product?.type,
                        // For devices, quantity should be 1 and not editable
                        // For regular products, set to 1 or max available if less than 1
                        quantity: selectedProduct?.isDevice ? 1 : Math.min(1, maxQuantity)
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le produit" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {isLoadingProducts ? (
                        <SelectItem value="loading" disabled>Chargement des produits...</SelectItem>
                      ) : products && products.length > 0 ? (
                        // Filter products based on search query
                        products
                          .filter((stock: any) => {
                            if (!productSearchQuery) return true;
                            const searchLower = productSearchQuery.toLowerCase();
                            return (
                              stock.displayName?.toLowerCase().includes(searchLower) ||
                              stock.typeLabel?.toLowerCase().includes(searchLower) ||
                              stock.product?.brand?.toLowerCase().includes(searchLower) ||
                              stock.product?.model?.toLowerCase().includes(searchLower)
                            );
                          })
                          .map((stock: any) => (
                            <SelectItem 
                              key={stock.product?.id || stock.id} 
                              value={stock.product?.id || stock.id}
                            >
                              <div className="flex flex-col">
                                <span>{stock.displayName}</span>
                                <span className="text-xs text-gray-500">
                                  {stock.typeLabel} • <span className="font-semibold">{stock.quantity} disponible</span>
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="none" disabled>Aucun produit disponible</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Quantité</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    max={formData.isDevice ? 1 : maxAvailableQuantity}
                    value={formData.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      
                      // Ensure quantity doesn't exceed available stock
                      const validQuantity = Math.min(newQuantity, maxAvailableQuantity);
                      
                      setFormData({ ...formData, quantity: validQuantity });
                    }}
                    disabled={formData.isDevice} // Disable for devices as they're transferred as whole units
                  />
                  
                  {/* Quantity indicator */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {formData.isDevice ? 
                        'Transfert unitaire' : 
                        `Min: 1`}
                    </span>
                    <span>
                      {formData.productId ? 
                        `Max disponible: ${maxAvailableQuantity}` : 
                        'Sélectionnez un produit'}
                    </span>
                  </div>
                  
                  {formData.isDevice && (
                    <p className="text-xs text-gray-500">
                      Les appareils médicaux sont transférés en unités complètes
                    </p>
                  )}
                  
                  {/* Warning if trying to transfer more than available */}
                  {formData.quantity >= maxAvailableQuantity && formData.productId && !formData.isDevice && (
                    <p className="text-xs text-amber-600">
                      Attention: Vous transférez la quantité maximale disponible
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nouveau statut (optionnel)</label>
                <Select
                  value={formData.newStatus}
                  onValueChange={(value: any) => setFormData({ ...formData, newStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le nouveau statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.isDevice ? (
                      // Status options for medical devices
                      <>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                        <SelectItem value="RETIRED">Retiré</SelectItem>
                        <SelectItem value="RESERVED">Réservé</SelectItem>
                      </>
                    ) : (
                      // Status options for regular inventory
                      <>
                        <SelectItem value="EN_VENTE">En vente</SelectItem>
                        <SelectItem value="EN_LOCATION">En location</SelectItem>
                        <SelectItem value="EN_REPARATION">En réparation</SelectItem>
                        <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes (optionnel)</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajouter des notes sur le transfert..."
                />
              </div>

              <Button type="submit" className="w-full">
                Créer le transfert
              </Button>
            </form>
            </DialogContent>
          </Dialog>

          {/* Transfer Detail Dialog */}
          {selectedTransferId && (
            <TransferDetailDialog
              transferId={selectedTransferId}
              isOpen={detailDialogOpen}
              onClose={() => {
                setDetailDialogOpen(false);
                // Refresh the recent transfers list when the dialog is closed
                queryClient.invalidateQueries({ queryKey: ['recentTransfers'] });
              }}
              currentUserRole={currentUser.role}
            />
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <TransferHistory />
        </TabsContent>
      </Tabs>

      {/* Role-based admin notification alert */}
      {currentUser.role !== 'ADMIN' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Information importante sur les transferts</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Les transferts que vous créez doivent être vérifiés par un administrateur avant d'être complètement validés.
                  Votre transfert sera visible dans la liste des transferts récents avec un statut "En attente de vérification".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
