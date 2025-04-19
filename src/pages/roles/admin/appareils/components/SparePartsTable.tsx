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
import { Product, ProductType } from "../types";
import { History } from "lucide-react";

interface SparePartsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
}

export function SparePartsTable({ 
  products, 
  onEdit, 
  onDelete,
  onViewHistory,
  renderActionButtons 
}: SparePartsTableProps) {
  const spareParts = products.filter(p => p.type === ProductType.SPARE_PART);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'default';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'secondary';
      case 'VENDU':
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'EN VENTE';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'EN RÉPARATION';
      case 'VENDU':
      case 'RETIRED':
        return 'VENDU';
      case 'EN_LOCATION':
        return 'EN LOCATION';
      default:
        return status;
    }
  };

  const getLocationName = (part: Product) => {
    if (!part.stockLocation) return "Non assigné";
    return typeof part.stockLocation === 'string' 
      ? part.stockLocation 
      : part.stockLocation.name || "Non assigné";
  };

  return (
    <div className="rounded-md border p-4">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="py-1">Nom</TableHead>
            <TableHead className="py-1">Marque</TableHead>
            <TableHead className="py-1">Modèle</TableHead>
            <TableHead className="py-1">Emplacement</TableHead>
            <TableHead className="py-1">État</TableHead>
            <TableHead className="py-1">Prix d'achat</TableHead>
            <TableHead className="py-1">Prix de vente</TableHead>
            <TableHead className="py-1 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spareParts.map((part) => (
            <TableRow key={part.id} className="h-8">
              <TableCell className="py-1">{part.name}</TableCell>
              <TableCell className="py-1">{part.brand || '-'}</TableCell>
              <TableCell className="py-1">{part.model || '-'}</TableCell>
              <TableCell className="py-1">{getLocationName(part)}</TableCell>
              <TableCell className="py-1">
                <Badge variant={getStatusBadgeVariant(part.status)}>
                  {getStatusLabel(part.status)}
                </Badge>
              </TableCell>
              <TableCell className="py-1">{part.purchasePrice ? `${part.purchasePrice} DT` : '-'}</TableCell>
              <TableCell className="py-1">{part.sellingPrice ? `${part.sellingPrice} DT` : '-'}</TableCell>
              <TableCell className="py-1 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewHistory(part)}
                  title="Voir l'historique des réparations"
                  className="h-6 w-6"
                >
                  <History className="h-3 w-3" />
                </Button>
                {renderActionButtons(part)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
