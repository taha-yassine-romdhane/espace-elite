import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

interface PaymentsHistoryProps {
  technicianId: string;
}

export function PaymentsHistory({ technicianId }: PaymentsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Historique des Paiements
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suivi des paiements effectués
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Appareil</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>Jean Dupont</TableCell>
              <TableCell>CPAP</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>650€/mois</TableCell>
           
            </TableRow>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>Marie Martin</TableCell>
              <TableCell>Concentrateur O²</TableCell>
              <TableCell>Vente</TableCell>
              <TableCell>850€</TableCell>
              <TableCell>
                <Badge variant="destructive">En attente</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
