import React from 'react';
import { MedicalDevice, Diagnostic, DiagnosticResult } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivityIcon } from 'lucide-react';

interface DiagnosticDeviceDetailsProps {
  device: MedicalDevice;
  diagnostics: (Diagnostic & {
    result?: DiagnosticResult | null;
    patient: { firstName: string; lastName: string };
  })[];
}

export const DiagnosticDeviceDetails: React.FC<DiagnosticDeviceDetailsProps> = ({ device, diagnostics }) => {
  if (!diagnostics || diagnostics.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Détails de l'appareil de diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ActivityIcon className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Aucun diagnostic enregistré</h3>
            <p className="text-gray-500 mt-1">
              Cet appareil de diagnostic n'a pas encore été utilisé pour des diagnostics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Détails de l'appareil de diagnostic</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>IAH</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Remarque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostics.map((diagnostic) => (
              <TableRow key={diagnostic.id}>
                <TableCell>{new Date(diagnostic.diagnosticDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {diagnostic.patient.firstName} {diagnostic.patient.lastName}
                </TableCell>
                <TableCell>{diagnostic.result?.iah || '-'}</TableCell>
                <TableCell>{diagnostic.result?.idValue || '-'}</TableCell>
                <TableCell>{diagnostic.result?.status || '-'}</TableCell>
                <TableCell>{diagnostic.result?.remarque || diagnostic.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
