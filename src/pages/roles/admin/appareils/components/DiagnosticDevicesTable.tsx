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
import { Product, ProductType } from "@/types";
import { History, Sliders } from "lucide-react";

interface DiagnosticDevicesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onViewParameters?: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
}

export function DiagnosticDevicesTable({ 
  products = [], 
  onViewHistory,
  onViewParameters,
  renderActionButtons 
}: DiagnosticDevicesTableProps) {
  const diagnosticDevices = products?.filter(p => p?.type === ProductType.DIAGNOSTIC_DEVICE) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'MAINTENANCE':
        return 'secondary';
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLocationName = (device: Product) => {
    if (!device?.stockLocation) return "Non assigné";
    return device.stockLocation.name;
  };

  if (diagnosticDevices.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucun appareil de diagnostic trouvé</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Marque/Modèle</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diagnosticDevices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium">{device.name}</TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {device.brand && <span>{device.brand}</span>}
                  {device.model && <span> / {device.model}</span>}
                </div>
              </TableCell>
              <TableCell>{getLocationName(device)}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(device.status)}>
                  {device.status}
                </Badge>
              </TableCell>
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
                {onViewParameters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewParameters(device)}
                    title="Voir les paramètres"
                    className="h-6 w-6"
                  >
                    <Sliders className="h-3 w-3" />
                  </Button>
                )}
                {renderActionButtons(device)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DiagnosticDevicesTable;
