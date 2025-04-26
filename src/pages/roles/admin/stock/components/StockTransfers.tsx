import { useState } from 'react';
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
import { Plus } from 'lucide-react';

interface TransferFormData {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
  notes?: string;
  newStatus?: 'EN_VENTE' | 'RESERVE' | 'DEFECTUEUX';
}

interface Stock {
  id: string;
  product: {
    id: string;
    name: string;
    brand: string;
    model: string;
  };
  quantity: number;
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
  });

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
  const { data: products } = useQuery<Stock[]>({
    queryKey: ['availableProducts', formData.fromLocationId],
    queryFn: async () => {
      if (!formData.fromLocationId) return [];
      const response = await fetch(`/api/stock/inventory?locationId=${formData.fromLocationId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!formData.fromLocationId,
  });

  // Create transfer
  const createTransfer = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const response = await fetch('/api/stock/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create transfer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      setIsDialogOpen(false);
      setFormData({
        fromLocationId: '',
        toLocationId: '',
        productId: '',
        quantity: 1,
      });
      toast({
        title: "Succès",
        description: "Le transfert a été créé avec succès",
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transferts de Stock</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau transfert
            </Button>
          </DialogTrigger>
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
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((stock) => (
                      <SelectItem key={stock.product.id} value={stock.product.id}>
                        {stock.product.name} - {stock.product.brand} {stock.product.model} ({stock.quantity} disponible)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Quantité</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nouveau statut (optionnel)</label>
                <Select
                  value={formData.newStatus}
                  onValueChange={(value: "EN_VENTE" | "RESERVE" | "DEFECTUEUX") => setFormData({ ...formData, newStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le nouveau statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN_VENTE">En vente</SelectItem>
                    <SelectItem value="RESERVE">Réservé</SelectItem>
                    <SelectItem value="DEFECTUEUX">Défectueux</SelectItem>
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
      </div>
    </div>
  );
}
