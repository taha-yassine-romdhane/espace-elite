import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockLocation {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    stocks: number;
    products: number;
    medicalDevices: number;
  };
  createdAt: string;
}

export default function StockLocations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
  });

  // Fetch stock locations
  const { data: locations, isLoading } = useQuery<StockLocation[]>({
    queryKey: ['stockLocations'],
    queryFn: async () => {
      const response = await fetch('/api/stock/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Create new location
  const createLocation = useMutation({
    mutationFn: async (locationData: { name: string; description: string }) => {
      const response = await fetch('/api/stock/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockLocations'] });
      setIsDialogOpen(false);
      setNewLocation({ name: '', description: '' });
      toast({
        title: "Succès",
        description: "L'emplacement a été créé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'emplacement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation.mutate(newLocation);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Emplacements de Stock</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un emplacement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel emplacement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="Nom de l'emplacement"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="Description de l'emplacement"
                />
              </div>
              <Button type="submit" className="w-full">
                Créer l'emplacement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Appareils</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations?.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.description || '-'}</TableCell>
                <TableCell>
                  {location.user ? (
                    `${location.user.firstName} ${location.user.lastName}`
                  ) : (
                    <span className="text-gray-500">Non assigné</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {location._count?.products || 0} produits
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {location._count?.medicalDevices || 0} appareils
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={location.isActive ? "success" : "secondary"}>
                    {location.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Voir le stock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!locations?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Aucun emplacement trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
