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

interface SparePartsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function SparePartsTable({ products, onEdit, onDelete }: SparePartsTableProps) {
  const spareParts = products.filter(p => p.type === 'SPARE_PART');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Seuil d'alerte</TableHead>
            <TableHead>Prix unitaire</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spareParts.map((part) => (
            <TableRow key={part.id}>
              <TableCell>{part.name}</TableCell>
              <TableCell>{part.serialNumber || '-'}</TableCell>
              <TableCell>{part.stockLocation}</TableCell>
              <TableCell>{part.stockQuantity}</TableCell>
              <TableCell>{part.alertThreshold || '-'}</TableCell>
              <TableCell>{part.purchasePrice ? `${part.purchasePrice} DT` : '-'}</TableCell>
              <TableCell>
                <Badge variant={part.status === 'EN_VENTE' ? 'success' : 'destructive'}>
                  {part.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(part)}>
                  Modifier
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(part)}>
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
