import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "../types";

interface AccessoriesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function AccessoriesTable({ products, onEdit, onDelete }: AccessoriesTableProps) {
  const accessories = products.filter(p => p.type === 'ACCESSORY');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Stock Min</TableHead>
            <TableHead>Stock Max</TableHead>
            <TableHead>Prix d'achat</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessories.map((accessory) => (
            <TableRow key={accessory.id}>
              <TableCell>{accessory.name}</TableCell>
              <TableCell>{accessory.brand || '-'}</TableCell>
              <TableCell>{accessory.stockLocation}</TableCell>
              <TableCell>{accessory.stockQuantity}</TableCell>
              <TableCell>{accessory.minStock !== null && accessory.minStock !== undefined ? accessory.minStock : '-'}</TableCell>
              <TableCell>{accessory.maxStock !== null && accessory.maxStock !== undefined ? accessory.maxStock : '-'}</TableCell>
              <TableCell>{accessory.purchasePrice ? `${accessory.purchasePrice} DT` : '-'}</TableCell>
              <TableCell>
                <Badge variant={accessory.status === 'EN_VENTE' ? 'default' : 'destructive'}>
                  {accessory.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(accessory)}>
                  Modifier
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(accessory)}>
                  Supprimer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
