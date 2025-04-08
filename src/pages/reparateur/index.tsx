import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Building, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Location = {
  id: string;
  name: string;
  address?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function RepairLocations() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Atelier',
  });

  const locationTypes = ['Atelier', 'Fournisseur', 'Centre de Service', 'Autre'];

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réparateurs',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add location');

      const newLocation = await response.json();
      setLocations([...locations, newLocation]);
      setIsAddDialogOpen(false);
      setFormData({ name: '', address: '', type: 'Atelier' });
      toast({
        title: 'Succès',
        description: 'Réparateur ajouté avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'ajout du réparateur',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    try {
      const response = await fetch('/api/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedLocation.id,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update location');

      const updatedLocation = await response.json();
      setLocations(locations.map(loc => 
        loc.id === updatedLocation.id ? updatedLocation : loc
      ));
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: 'Succès',
        description: 'Réparateur modifié avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la modification du réparateur',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    try {
      const response = await fetch(`/api/locations?id=${selectedLocation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      setLocations(locations.filter(loc => loc.id !== selectedLocation.id));
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: 'Succès',
        description: 'Réparateur supprimé avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression du réparateur',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      type: location.type,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building className="h-6 w-6" />
          Gestion des Réparateurs
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un réparateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau réparateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Ajouter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le réparateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Adresse</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement le réparateur
              {selectedLocation && ` "${selectedLocation.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.address}</TableCell>
                <TableCell>{location.type}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => openEditDialog(location)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => openDeleteDialog(location)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
