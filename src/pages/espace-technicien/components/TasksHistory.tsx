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

interface TasksHistoryProps {
  technicianId: string;
}

export function TasksHistory({ technicianId }: TasksHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Personal Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Historique des Tâches Personnalisées
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Suivi des tâches spécifiques effectuées par le technicien
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Patient/Lieu</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>06/06/2023</TableCell>
                <TableCell>Formation utilisation CPAP</TableCell>
                <TableCell>Jean Dupont</TableCell>
                <TableCell>Formation initiale sur l'utilisation de l'appareil CPAP</TableCell>
                <TableCell>
                  <Badge>Terminé</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* General Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Historique des Tâches Générales
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Suivi des tâches générales effectuées par le technicien
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>05/06/2023</TableCell>
                <TableCell>Maintenance préventive</TableCell>
                <TableCell>Vérification et entretien de 5 concentrateurs d'oxygène</TableCell>
                <TableCell>
                  <Badge>En cours</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
