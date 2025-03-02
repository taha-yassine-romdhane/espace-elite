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

interface DiagnosticDevicesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function DiagnosticDevicesTable({ products, onEdit, onDelete }: DiagnosticDevicesTableProps) {
  const diagnosticDevices = products.filter(p => p.type === 'DIAGNOSTIC_DEVICE');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead>Modèle</TableHead>
            <TableHead>N° Série</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Spécifications</TableHead>
            <TableHead>Garantie</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diagnosticDevices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>{device.brand || '-'}</TableCell>
              <TableCell>{device.model || '-'}</TableCell>
              <TableCell>{device.serialNumber || '-'}</TableCell>
              <TableCell>{device.stockLocation}</TableCell>
              <TableCell>
                <Badge variant={device.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {device.status}
                </Badge>
              </TableCell>
              <TableCell>{device.technicalSpecs || '-'}</TableCell>
              <TableCell>{device.warranty || '-'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(device)}>
                  Modifier
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(device)}>
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
