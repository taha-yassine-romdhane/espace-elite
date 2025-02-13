import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductForm from '@/components/forms/ProductForm';
import { useToast } from "@/components/ui/use-toast";
import { Product, ProductStatus, StockLocation } from '@/types';

const AppareilsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingTypes, setExistingTypes] = useState<string[]>([]);
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    marque: '',
    stock: StockLocation.VENTE,
    ns: '',
    prixAchat: undefined as number | undefined,
    status: ProductStatus.FONCTIONNEL,
    montantReparation: undefined as number | undefined,
    pieceRechange: '',
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      type: '',
      marque: '',
      stock: StockLocation.VENTE,
      ns: '',
      prixAchat: undefined,
      status: ProductStatus.FONCTIONNEL,
      montantReparation: undefined,
      pieceRechange: '',
    });
    setIsEditMode(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      nom: product.nom,
      type: product.type,
      marque: product.marque,
      stock: product.stock as StockLocation,
      ns: product.ns || '',
      prixAchat: product.prixAchat,
      status: product.status as ProductStatus,
      montantReparation: product.montantReparation,
      pieceRechange: product.pieceRechange || '',
    });
    setIsEditMode(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      toast({
        title: "Succès",
        description: "Appareil supprimé avec succès",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la suppression de l'appareil",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch('/api/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }

      toast({
        title: "Succès",
        description: `Appareil ${isEditMode ? 'modifié' : 'ajouté'} avec succès`,
      });

      setIsOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : `Échec de ${isEditMode ? 'la modification' : "l'ajout"} de l'appareil`,
        variant: "destructive",
      });
    }
  };

  const handleAddType = async (newType: string) => {
    setExistingTypes(prev => [...prev, newType]);
    setFormData(prev => ({ ...prev, type: newType }));
  };

  const handleAddBrand = async (newBrand: string) => {
    setExistingBrands(prev => [...prev, newBrand]);
    setFormData(prev => ({ ...prev, marque: newBrand }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);

      // Extract unique types and brands
      const types = [...new Set(data.map((p: Product) => p.type))] as string[];
      const brands = [...new Set(data.map((p: Product) => p.marque))] as string[];
      
      setExistingTypes(types);
      setExistingBrands(brands);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les appareils",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Appareils</h1>
          <Button onClick={() => setIsOpen(true)} disabled>
            Ajouter un appareil
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Appareils</h1>
        <Button onClick={() => { setIsOpen(true); setIsEditMode(false); resetForm(); }}>
          Ajouter un appareil
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucun appareil trouvé
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.nom}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>{product.marque}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <ProductForm
            formData={formData}
            existingTypes={existingTypes}
            existingBrands={existingBrands}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={() => { setIsOpen(false); resetForm(); }}
            isEditMode={isEditMode}
            onAddType={handleAddType}
            onAddBrand={handleAddBrand}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppareilsPage;
