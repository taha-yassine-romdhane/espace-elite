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

interface AccessoriesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
}

export function AccessoriesTable({ 
  products, 
  onEdit, 
  onDelete,
  onViewHistory,
  renderActionButtons 
}: AccessoriesTableProps) {
  const accessories = products.filter(p => p.type === ProductType.ACCESSORY);

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

  const getLocationName = (device: Product) => {
    if (!device.stockLocation) return "Non assigné";
    return typeof device.stockLocation === 'string' 
      ? device.stockLocation 
      : device.stockLocation.name || "Non assigné";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="py-1">Nom</TableHead>
            <TableHead className="py-1">Marque</TableHead>
            <TableHead className="py-1">Modèle</TableHead>
            <TableHead className="py-1">N° Série</TableHead>
            <TableHead className="py-1">Emplacement</TableHead>
            <TableHead className="py-1">État</TableHead>
            <TableHead className="py-1">Prix d'achat</TableHead>
            <TableHead className="py-1">Prix de vente</TableHead>
            <TableHead className="py-1 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessories.map((device) => (
            <TableRow key={device.id} className="h-8">
              <TableCell className="py-1">{device.name}</TableCell>
              <TableCell className="py-1">{device.brand || '-'}</TableCell>
              <TableCell className="py-1">{device.model || '-'}</TableCell>
              <TableCell className="py-1">{device.serialNumber || '-'}</TableCell>
              <TableCell className="py-1">{getLocationName(device)}</TableCell>
              <TableCell className="py-1">
                <Badge variant={getStatusBadgeVariant(device.status)}>
                  {getStatusLabel(device.status)}
                </Badge>
              </TableCell>
              <TableCell className="py-1">{device.purchasePrice ? `${device.purchasePrice} DT` : '-'}</TableCell>
              <TableCell className="py-1">{device.sellingPrice ? `${device.sellingPrice} DT` : '-'}</TableCell>
              <TableCell className="py-1 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewHistory(device)}
                  title="Voir l'historique des réparations"
                  className="h-6 w-6"
                >
                  <History className="h-3 w-3" />
                </Button>
                {renderActionButtons(device)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
