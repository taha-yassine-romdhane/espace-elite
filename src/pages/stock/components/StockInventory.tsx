import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Stock {
  id: string;
  location: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    model: string;
    brand: string;
    type: string;
  };
  quantity: number;
  status: 'EN_VENTE' | 'RESERVE' | 'DEFECTUEUX';
}

export default function StockInventory() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: locations } = useQuery({
    queryKey: ['stockLocations'],
    queryFn: async () => {
      const response = await fetch('/api/stock/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ['stocks', selectedLocation, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocation !== 'all') {
        params.append('locationId', selectedLocation);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await fetch(`/api/stock/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stock');
      return response.json();
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
        return <Badge variant="default">En vente</Badge>;
      case 'RESERVE':
        return <Badge variant="secondary">Réservé</Badge>;
      case 'DEFECTUEUX':
        return <Badge variant="destructive">Défectueux</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inventaire du Stock</h2>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-[200px]">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un emplacement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les emplacements</SelectItem>
              {locations?.map((location: any) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks?.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.product.name}</TableCell>
                <TableCell>{stock.product.brand}</TableCell>
                <TableCell>{stock.product.model}</TableCell>
                <TableCell>{stock.product.type}</TableCell>
                <TableCell>{stock.location.name}</TableCell>
                <TableCell>{stock.quantity}</TableCell>
                <TableCell>{getStatusBadge(stock.status)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {stocks?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Aucun stock trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
