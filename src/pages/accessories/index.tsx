import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { PenSquare, Trash2 } from 'lucide-react';

interface Accessory {
  id: string;
  nom: string;
  type: string;
  marque: string;
  prixAchat?: number;
  stock: 'VENTE' | 'LOCATION' | 'HORS_SERVICE';
}

interface TypeOption {
  id: string;
  name: string;
}

interface BrandOption {
  id: string;
  name: string;
}

export default function AccessoiresPage() {
  const { data: session } = useSession();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [newType, setNewType] = useState('');
  const [newBrand, setNewBrand] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    marque: '',
    prixAchat: '',
    stock: 'VENTE' as const,
  });

  const fetchAccessories = async () => {
    try {
      const response = await fetch('/api/accessories');
      const data = await response.json();
      setAccessories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch accessories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAccessories();
    // In a real app, you would fetch these from an API
    setTypes([
      { id: '1', name: 'Faciale L' },
      { id: '2', name: 'Masque' },
    ]);
    setBrands([
      { id: '1', name: 'YUWELL' },
      { id: '2', name: 'ResMed' },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accessories', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditMode ? { ...formData, id: selectedAccessory?.id } : formData),
      });

      if (!response.ok) throw new Error('Failed to save accessory');

      setIsAddDialogOpen(false);
      setFormData({
        nom: '',
        type: '',
        marque: '',
        prixAchat: '',
        stock: 'VENTE',
      });
      setIsEditMode(false);
      setSelectedAccessory(null);
      fetchAccessories();
      toast({
        title: "Success",
        description: `Accessory ${isEditMode ? 'updated' : 'added'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} accessory`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accessory?')) return;

    try {
      const response = await fetch(`/api/accessories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete accessory');

      fetchAccessories();
      toast({
        title: "Success",
        description: "Accessory deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete accessory",
        variant: "destructive",
      });
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypes([...types, { id: String(types.length + 1), name: newType }]);
    setNewType('');
    setIsTypeDialogOpen(false);
    toast({
      title: "Success",
      description: "Type added successfully",
    });
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrands([...brands, { id: String(brands.length + 1), name: newBrand }]);
    setNewBrand('');
    setIsBrandDialogOpen(false);
    toast({
      title: "Success",
      description: "Brand added successfully",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accessoire</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Accessoire</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajout d'un Accessoire</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTypeDialogOpen(true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="marque">Marque</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.marque}
                      onValueChange={(value) => setFormData({ ...formData, marque: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBrandDialogOpen(true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prixAchat">Prix Achat</Label>
                  <Input
                    id="prixAchat"
                    type="number"
                    value={formData.prixAchat}
                    onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Select
                    value={formData.stock}
                    onValueChange={(value: 'VENTE' | 'LOCATION' | 'HORS_SERVICE') => 
                      setFormData({ ...formData, stock: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENTE">Vente</SelectItem>
                      <SelectItem value="LOCATION">Location</SelectItem>
                      <SelectItem value="HORS_SERVICE">Hors Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Sauvegarder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead>Prix Achat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessories.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nom}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.marque}</TableCell>
              <TableCell>{item.prixAchat ? `${item.prixAchat} dt` : '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedAccessory(item);
                    setFormData({
                      nom: item.nom,
                      type: item.type,
                      marque: item.marque,
                      prixAchat: item.prixAchat?.toString() || '',
                      stock: item.stock,
                    });
                    setIsEditMode(true);
                    setIsAddDialogOpen(true);
                  }}
                >
                  <PenSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajout de Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddType} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sauvegarder
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Brand Dialog */}
      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajout de Marque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sauvegarder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );