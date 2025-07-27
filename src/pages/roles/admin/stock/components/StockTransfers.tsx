import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
import { Plus, Search, History, Info, AlertCircle, Package, Wrench, Stethoscope, Monitor, Filter, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import TransferHistory from './TransferHistory';


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
  
  const [formData, setFormData] = useState<TransferFormData>({
    fromLocationId: '',
    toLocationId: '',
    productId: '',
    quantity: 1,
    notes: '',
  });
  
  const [maxAvailableQuantity, setMaxAvailableQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');
  
  const currentUser = {
    id: 'user-1', 
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'User'
  };

  // Helper function to get product type icon
  const getProductTypeIcon = (productType: string) => {
    switch (productType) {
      case 'MEDICAL_DEVICE':
        return <Stethoscope className="h-4 w-4" />;
      case 'DIAGNOSTIC_DEVICE':
        return <Monitor className="h-4 w-4" />;
      case 'ACCESSORY':
        return <Package className="h-4 w-4" />;
      case 'SPARE_PART':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Helper function to get product type label
  const getProductTypeLabel = (productType: string) => {
    switch (productType) {
      case 'MEDICAL_DEVICE':
        return 'Appareil médical';
      case 'DIAGNOSTIC_DEVICE':
        return 'Appareil de diagnostic';
      case 'ACCESSORY':
        return 'Accessoire';
      case 'SPARE_PART':
        return 'Pièce détachée';
      default:
        return 'Produit';
    }
  };

  const { data: locations } = useQuery({
    queryKey: ['stockLocations'],
    queryFn: async () => {
      const response = await fetch('/api/stock/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['availableProducts', formData.fromLocationId],
    queryFn: async () => {
      if (!formData.fromLocationId) return { items: [] };
      const response = await fetch(`/api/stock/inventory?locationId=${formData.fromLocationId}&limit=1000&t=${Date.now()}`, {
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!formData.fromLocationId,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
  });
  
  const products = React.useMemo(() => {
    const items = productsData?.items || productsData || [];
    
    let filteredItems = items.map((item: any) => {
      const isDevice = item.isDevice || 
        [ProductType.MEDICAL_DEVICE, ProductType.DIAGNOSTIC_DEVICE].includes(item.product?.type);
      
      const brand = item.product?.brand || '';
      const model = item.product?.model || '';
      const brandModel = [brand, model].filter(Boolean).join(' ');
      const displayName = `${item.product.name}${brandModel ? ` (${brandModel})` : ''}`;
      
      return { ...item, displayName, isDevice };
    });

    // Apply product type filter
    if (selectedProductType !== 'all') {
      filteredItems = filteredItems.filter((item: any) => 
        item.product.type === selectedProductType
      );
    }

    // Apply search filter
    if (productSearch.trim()) {
      const searchTerm = productSearch.toLowerCase().trim();
      filteredItems = filteredItems.filter((item: any) => 
        item.product.name.toLowerCase().includes(searchTerm) ||
        (item.product.brand && item.product.brand.toLowerCase().includes(searchTerm)) ||
        (item.product.model && item.product.model.toLowerCase().includes(searchTerm))
      );
    }

    return filteredItems;
  }, [productsData, selectedProductType, productSearch]);

  useEffect(() => {
    const selectedProduct = products.find((p: any) => p.product.id === formData.productId);
    if (selectedProduct) {
      const isDevice = selectedProduct.isDevice;
      setMaxAvailableQuantity(isDevice ? 1 : selectedProduct.quantity);
      setFormData(prev => ({
        ...prev,
        quantity: 1,
        isDevice: isDevice,
        productType: selectedProduct.product.type,
      }));
    } else {
      setMaxAvailableQuantity(1);
    }
  }, [formData.productId, products]);

  const checkAvailabilityMutation = useMutation({
    mutationFn: async (data: { fromLocationId: string; productId: string; quantity: number }) => {
      const response = await fetch('/api/stock/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      return response.json();
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      // First check availability
      const availabilityCheck = await checkAvailabilityMutation.mutateAsync({
        fromLocationId: data.fromLocationId,
        productId: data.productId,
        quantity: data.quantity,
      });

      if (!availabilityCheck.available) {
        throw new Error(availabilityCheck.reason + (availabilityCheck.details ? ` (Disponible: ${availabilityCheck.details.availableQuantity}, Demandé: ${availabilityCheck.details.requestedQuantity})` : ''));
      }

      const response = await fetch('/api/stock/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: currentUser.id, userRole: currentUser.role }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transfer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockLocations'] });
      queryClient.invalidateQueries({ queryKey: ['availableProducts', formData.fromLocationId] });
      queryClient.invalidateQueries({ queryKey: ['transferHistory'] });

      toast({
        title: "Transfert créé avec succès",
        description: `Le transfert de ${formData.quantity} unité(s) a été enregistré.`,
      });

      setIsDialogOpen(false);
      setFormData({
        fromLocationId: '',
        toLocationId: '',
        productId: '',
        quantity: 1,
        notes: '',
        newStatus: undefined,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors du transfert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransferMutation.mutate(formData);
  };

  const resetProductFilters = () => {
    setProductSearch('');
    setSelectedProductType('all');
  };

  const handleLocationChange = (value: string) => {
    setFormData({ ...formData, fromLocationId: value, productId: '' });
    resetProductFilters();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestion des Transferts de Stock</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouveau Transfert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau transfert</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">De l'emplacement</label>
                  <Select
                    value={formData.fromLocationId}
                    onValueChange={handleLocationChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'emplacement de départ" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Vers l'emplacement</label>
                  <Select
                    value={formData.toLocationId}
                    onValueChange={(value) => setFormData({ ...formData, toLocationId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'emplacement de destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.filter((loc: any) => loc.id !== formData.fromLocationId).map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Produit à transférer</label>
                  {(productSearch || selectedProductType !== 'all') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetProductFilters}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </div>

                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                      disabled={!formData.fromLocationId || isLoadingProducts}
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                      value={selectedProductType}
                      onValueChange={setSelectedProductType}
                      disabled={!formData.fromLocationId || isLoadingProducts}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Type de produit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Tous les types
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDICAL_DEVICE">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Appareils médicaux
                          </div>
                        </SelectItem>
                        <SelectItem value="DIAGNOSTIC_DEVICE">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Appareils de diagnostic
                          </div>
                        </SelectItem>
                        <SelectItem value="ACCESSORY">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Accessoires
                          </div>
                        </SelectItem>
                        <SelectItem value="SPARE_PART">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Pièces détachées
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Product Selection Dropdown */}
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  required
                  disabled={!formData.fromLocationId || isLoadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingProducts 
                        ? 'Chargement...' 
                        : products.length === 0 
                          ? 'Aucun produit trouvé'
                          : 'Sélectionner un produit'
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {products.length === 0 && !isLoadingProducts ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {productSearch || selectedProductType !== 'all' 
                          ? 'Aucun produit trouvé avec les filtres actuels'
                          : 'Aucun produit disponible dans cet emplacement'
                        }
                      </div>
                    ) : (
                      products.map((p: any) => (
                        <SelectItem key={p.product.id} value={p.product.id}>
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0">
                              {getProductTypeIcon(p.product.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {p.displayName}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs py-0">
                                  {getProductTypeLabel(p.product.type)}
                                </Badge>
                                <span>Qté: {p.isDevice ? 1 : p.quantity}</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Results Summary */}
                {formData.fromLocationId && !isLoadingProducts && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>
                        {products.length} produit{products.length !== 1 ? 's' : ''} 
                        {productSearch || selectedProductType !== 'all' ? ' trouvé(s)' : ' disponible(s)'}
                        {productSearch && ` pour "${productSearch}"`}
                        {selectedProductType !== 'all' && ` dans "${getProductTypeLabel(selectedProductType)}"`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantité</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    min={1}
                    max={maxAvailableQuantity}
                    required
                    disabled={formData.isDevice}
                  />
                  {formData.quantity >= maxAvailableQuantity && formData.productId && !formData.isDevice && (
                    <p className="text-xs text-amber-600">
                      Attention: Vous transférez la quantité maximale disponible
                    </p>
                  )}
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
                        <>
                          <SelectItem value="ACTIVE">Actif</SelectItem>
                          <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                          <SelectItem value="RETIRED">Retiré</SelectItem>
                          <SelectItem value="RESERVED">Réservé</SelectItem>
                        </>
                      ) : (
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
              </div>

              <div>
                <label className="text-sm font-medium">Notes (optionnel)</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajouter des notes sur le transfert..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={createTransferMutation.isPending}>
                {createTransferMutation.isPending ? 'Création...' : 'Créer le transfert'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TransferHistory />

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
