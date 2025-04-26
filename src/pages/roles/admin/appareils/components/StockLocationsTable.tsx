import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { LocationEditForm } from "./LocationEditForm";
import { Trash2, Edit } from "lucide-react";

interface StockLocation {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
}



export function StockLocationsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<StockLocation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch stock locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const response = await fetch("/api/stock-locations");
      if (!response.ok) {
        throw new Error("Failed to fetch stock locations");
      }
      const data = await response.json();
      return data;
    },
  });

  const getUserDisplayName = (user?: { firstName: string; lastName: string } | null) => {
    if (!user || !user.firstName || !user.lastName) return "Aucun responsable";
    return `${user.firstName} ${user.lastName}`;
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Emplacements</h2>
        </div>
        <div className="text-center py-6">
          Aucun emplacement trouvé
        </div>
      </div>
    );
  }

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stock-locations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete location");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-locations"] });
      toast({
        title: "Succès",
        description: "L'emplacement a été supprimé avec succès",
      });
      setLocationToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'emplacement",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (location: StockLocation) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (location: StockLocation) => {
    setLocationToDelete(location);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingLocation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations?.map((location: StockLocation) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.description || '-'}</TableCell>
                <TableCell>{getUserDisplayName(location.user)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                    <Edit className="h-4 w-4 mr-1" /> 
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(location)}>
                    <Trash2 className="h-4 w-4 mr-1" /> 
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;emplacement</DialogTitle>
            <DialogDescription>
              Modifiez les détails de l&apos;emplacement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {editingLocation && (
            <LocationEditForm
              location={editingLocation}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;emplacement &quot;{locationToDelete?.name}&quot; ?
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => locationToDelete && deleteLocationMutation.mutate(locationToDelete.id)}
              disabled={deleteLocationMutation.isPending}
            >
              {deleteLocationMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StockLocationsTable;