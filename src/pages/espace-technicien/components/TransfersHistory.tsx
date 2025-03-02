import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface TransfersHistoryProps {
  technicianId: string;
}

export function TransfersHistory({ technicianId }: TransfersHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Historique des Transferts de Machines
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suivi des déplacements d'appareils entre différents lieux
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Appareil</TableHead>
              <TableHead>Numéro de série</TableHead>
              <TableHead>Lieu de départ</TableHead>
              <TableHead>Lieu d'arrivée</TableHead>
              <TableHead>Raison</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>CPAP ResMed AirSense 10</TableCell>
              <TableCell>XYZ12345</TableCell>
              <TableCell>Stock central</TableCell>
              <TableCell>Domicile (Jean Dupont)</TableCell>
              <TableCell>Installation</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>Concentrateur O² Philips EverFlo</TableCell>
              <TableCell>ABC78901</TableCell>
              <TableCell>Domicile (Marie Martin)</TableCell>
              <TableCell>Centre de maintenance</TableCell>
              <TableCell>Réparation</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
