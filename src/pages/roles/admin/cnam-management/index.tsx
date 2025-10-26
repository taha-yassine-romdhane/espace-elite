import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface CNAMNomenclature {
  id: string;
  bondType: string;
  category: 'LOCATION' | 'ACHAT';
  amount: number;
  monthlyRate: number;
  description: string | null;
  isActive: boolean;
}

const BOND_TYPES = [
  { value: 'CONCENTRATEUR_OXYGENE', label: 'Concentrateur Oxygène' },
  { value: 'VNI', label: 'VNI (Ventilation Non Invasive)' },
  { value: 'CPAP', label: 'CPAP' },
  { value: 'MASQUE', label: 'Masque' },
  { value: 'AUTRE', label: 'Autre' },
];

const BOND_CATEGORIES = [
  { value: 'LOCATION', label: 'Bon de Location (Mensuel)' },
  { value: 'ACHAT', label: 'Bon d\'Achat (Unique)' },
];

export default function CNAMManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CNAMNomenclature | null>(null);
  const [deletingItem, setDeletingItem] = useState<CNAMNomenclature | null>(null);
  const [formData, setFormData] = useState({
    bondType: '',
    category: 'LOCATION' as 'LOCATION' | 'ACHAT',
    amount: '',
    monthlyRate: '',
    description: '',
    isActive: true,
  });

  // Fetch nomenclature data
  const { data: nomenclature = [], isLoading } = useQuery({
    queryKey: ['cnam-nomenclature'],
    queryFn: async () => {
      const response = await fetch('/api/cnam-nomenclature');
      if (!response.ok) throw new Error('Failed to fetch nomenclature');
      return response.json();
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingItem
        ? `/api/cnam-nomenclature/${editingItem.id}`
        : '/api/cnam-nomenclature';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondType: data.bondType,
          category: data.category,
          amount: parseFloat(data.amount),
          monthlyRate: data.category === 'LOCATION' ? parseFloat(data.monthlyRate || data.amount) : 0,
          description: data.description || null,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnam-nomenclature'] });
      toast({
        title: 'Succès',
        description: editingItem
          ? 'Tarif CNAM modifié avec succès'
          : 'Tarif CNAM ajouté avec succès',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cnam-nomenclature/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnam-nomenclature'] });
      toast({
        title: 'Succès',
        description: 'Tarif CNAM supprimé avec succès',
      });
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      bondType: '',
      category: 'LOCATION',
      amount: '',
      monthlyRate: '',
      description: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: CNAMNomenclature) => {
    setEditingItem(item);
    setFormData({
      bondType: item.bondType,
      category: item.category,
      amount: item.amount.toString(),
      monthlyRate: item.monthlyRate.toString(),
      description: item.description || '',
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: CNAMNomenclature) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      bondType: '',
      category: 'LOCATION',
      amount: '',
      monthlyRate: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bondType || !formData.amount) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const getBondTypeLabel = (bondType: string) => {
    return BOND_TYPES.find((t) => t.value === bondType)?.label || bondType;
  };

  const locationItems = nomenclature.filter((item: CNAMNomenclature) => item.category === 'LOCATION');
  const achatItems = nomenclature.filter((item: CNAMNomenclature) => item.category === 'ACHAT');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion CNAM</h1>
            <p className="text-gray-500 mt-1">
              Tarifs fixes CNAM pour les bons de location et d&apos;achat
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un tarif
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bon de Location */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Bon de Location (Mensuel)
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {locationItems.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : locationItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun tarif de location
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Tarif/Mois</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationItems.map((item: CNAMNomenclature) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getBondTypeLabel(item.bondType)}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {Number(item.monthlyRate).toFixed(2)} TND
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Bon d'Achat */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-green-700">
              Bon d&apos;Achat (Paiement Unique)
            </h2>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {achatItems.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : achatItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun tarif d&apos;achat
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achatItems.map((item: CNAMNomenclature) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getBondTypeLabel(item.bondType)}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {Number(item.amount).toFixed(2)} TND
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Ces tarifs sont basés sur la nomenclature officielle CNAM Tunisie.
          Les modifications doivent être conformes aux réglementations gouvernementales en vigueur.
        </p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Modifier le tarif CNAM' : 'Ajouter un tarif CNAM'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Modifiez les informations du tarif CNAM'
                : 'Ajoutez un nouveau tarif CNAM à la nomenclature'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bondType">
                Type de bon <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bondType}
                onValueChange={(value) =>
                  setFormData({ ...formData, bondType: value })
                }
                disabled={!!editingItem}
              >
                <SelectTrigger id="bondType">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {BOND_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Catégorie <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'LOCATION' | 'ACHAT') =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOND_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Montant (TND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="Ex: 190.00"
              />
            </div>

            {formData.category === 'LOCATION' && (
              <div className="space-y-2">
                <Label htmlFor="monthlyRate">Tarif mensuel (TND)</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  step="0.01"
                  value={formData.monthlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRate: e.target.value })
                  }
                  placeholder="Si différent du montant"
                />
                <p className="text-xs text-gray-500">
                  Laissez vide pour utiliser le montant comme tarif mensuel
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description optionnelle"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Tarif actif
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Enregistrement...'
                  : editingItem
                  ? 'Modifier'
                  : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce tarif CNAM ?
              {deletingItem && (
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <div className="font-medium">
                    {getBondTypeLabel(deletingItem.bondType)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {deletingItem.category === 'LOCATION'
                      ? `${Number(deletingItem.monthlyRate).toFixed(2)} TND/mois`
                      : `${Number(deletingItem.amount).toFixed(2)} TND`}
                  </div>
                </div>
              )}
              <div className="mt-2 text-red-600">
                Cette action est irréversible.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
