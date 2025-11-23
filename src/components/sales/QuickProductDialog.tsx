import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Loader2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: 'ACCESSORY' | 'SPARE_PART';
  onProductCreated: () => void;
}

export function QuickProductDialog({
  open,
  onOpenChange,
  productType,
  onProductCreated
}: QuickProductDialogProps) {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    sellingPrice: '',
    quantity: '1'
  });

  // Fetch employee's stock location
  const { data: employeeStock } = useQuery({
    queryKey: ["employee-stock", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const response = await fetch(`/api/stock-locations?userId=${session.user.id}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.find((loc: any) => loc.userId === session.user.id) || null;
    },
    enabled: open && !!session?.user?.id
  });

  // Fetch next product code
  const { data: nextCode } = useQuery({
    queryKey: ["next-product-code", productType],
    queryFn: async () => {
      const prefix = productType === 'ACCESSORY' ? 'ACC' : 'SP';
      const response = await fetch(`/api/products/next-code?type=${productType}`);
      if (!response.ok) {
        // Fallback to a timestamp-based code if API fails
        return `${prefix}-${Date.now()}`;
      }
      const data = await response.json();
      return data.nextCode || `${prefix}-001`;
    },
    enabled: open
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Succès',
        description: `${productType === 'ACCESSORY' ? 'Accessoire' : 'Pièce détachée'} créé${productType === 'ACCESSORY' ? '' : 'e'} avec succès`
      });
      handleClose();
      onProductCreated();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.brand.trim()) {
      toast({
        title: 'Erreur',
        description: 'La marque est requise',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.model.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le modèle est requis',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le prix de vente doit être supérieur à 0',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast({
        title: 'Erreur',
        description: 'La quantité doit être supérieure à 0',
        variant: 'destructive'
      });
      return;
    }

    if (!employeeStock?.id) {
      toast({
        title: 'Erreur',
        description: 'Emplacement de stock introuvable',
        variant: 'destructive'
      });
      return;
    }

    // Prepare payload
    const payload = {
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      type: productType,
      sellingPrice: parseFloat(formData.sellingPrice),
      quantity: parseInt(formData.quantity),
      stockLocationId: employeeStock.id,
      productCode: nextCode || `${productType === 'ACCESSORY' ? 'ACC' : 'SP'}-${Date.now()}`
    };

    await createMutation.mutateAsync(payload);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      brand: '',
      model: '',
      sellingPrice: '',
      quantity: '1'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            Créer {productType === 'ACCESSORY' ? 'un Accessoire' : 'une Pièce Détachée'}
          </DialogTitle>
          <DialogDescription>
            Création rapide pour ajout immédiat à la vente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={productType === 'ACCESSORY' ? 'Ex: Masque nasal' : 'Ex: Filtre HEPA'}
              required
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">
              Marque <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder={productType === 'ACCESSORY' ? 'Ex: ResMed' : 'Ex: Philips'}
              required
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">
              Modèle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder={productType === 'ACCESSORY' ? 'Ex: Taille M' : 'Ex: Standard'}
              required
            />
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">
              Prix de vente (DT) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantité initiale <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="1"
              required
            />
          </div>

          {/* Stock Location (Read-only) */}
          {employeeStock && (
            <div className="space-y-2">
              <Label>Emplacement de stock</Label>
              <Input
                value={employeeStock.name}
                disabled
                className="bg-gray-100 text-gray-600"
              />
            </div>
          )}

          {/* Product Code (Auto-generated - Read-only) */}
          <div className="space-y-2">
            <Label>Code produit (auto-généré)</Label>
            <Input
              value={nextCode || 'Chargement...'}
              disabled
              className="bg-gray-100 text-gray-600 font-mono"
            />
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Info:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Code: Pattern {productType === 'ACCESSORY' ? 'ACC-XXX' : 'SP-XXX'} (auto-incrémenté)</li>
              <li>Ajouté à votre stock: {employeeStock?.name || 'Chargement...'}</li>
              <li>Disponible immédiatement pour la vente</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
