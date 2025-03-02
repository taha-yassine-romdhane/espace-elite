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

interface MedicalDevicesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function MedicalDevicesTable({ products, onEdit, onDelete }: MedicalDevicesTableProps) {
  const medicalDevices = products.filter(p => p.type === 'MEDICAL_DEVICE');

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
            <TableHead>Prix d'achat</TableHead>
            <TableHead>Prix de vente</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicalDevices.map((device) => (
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
              <TableCell>{device.purchasePrice ? `${device.purchasePrice} DT` : '-'}</TableCell>
              <TableCell>{device.sellingPrice ? `${device.sellingPrice} DT` : '-'}</TableCell>
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
