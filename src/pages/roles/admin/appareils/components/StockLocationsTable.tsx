import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

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

interface StockLocationsTableProps {
  onEdit: (location: StockLocation) => void;
}

export function StockLocationsTable({ onEdit }: StockLocationsTableProps) {
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
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(location)}>
                    Modifier
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