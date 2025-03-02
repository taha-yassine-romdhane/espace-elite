import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface InstallationsHistoryProps {
  technicianId: string;
}

export function InstallationsHistory({ technicianId }: InstallationsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Historique des Installations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suivi des installations et paramétrages récents
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Appareil</TableHead>
              <TableHead>Paramètres</TableHead>
              <TableHead>Médecin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>Jean Dupont</TableCell>
              <TableCell>CPAP</TableCell>
              <TableCell>Pression: 9.0 cmH2O</TableCell>
              <TableCell>Dr. Lefebvre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>05/06/2023</TableCell>
              <TableCell>Marie Martin</TableCell>
              <TableCell>Concentrateur O²</TableCell>
              <TableCell>Débit: 2 L/min</TableCell>
              <TableCell>Dr. Rousseau</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
