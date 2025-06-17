import React from 'react';
import Link from 'next/link';
import { MedicalDevice, Patient, Company, Rental, Diagnostic } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserIcon, BuildingIcon, ClipboardIcon } from 'lucide-react';

interface DeviceRelationsProps {
  device: MedicalDevice & {
    Patient?: Patient | null;
    Company?: Company | null;
    Rental?: Rental[];
    Diagnostic?: Diagnostic[];
  };
}

export const DeviceRelations: React.FC<DeviceRelationsProps> = ({ device }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Relations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Assignment */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Assigné à</h3>
            {device.Patient ? (
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-blue-500" />
                <Link href={`/roles/admin/renseignement/patient/${device.Patient.id}`} className="text-blue-600 hover:underline">
                  {device.Patient.firstName} {device.Patient.lastName}
                </Link>
              </div>
            ) : device.Company ? (
              <div className="flex items-center space-x-2">
                <BuildingIcon className="h-5 w-5 text-blue-500" />
                <Link href={`/roles/admin/companies/${device.Company.id}`} className="text-blue-600 hover:underline">
                  {device.Company.companyName}
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Non assigné</p>
            )}
          </div>

          {/* Rentals */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Locations</h3>
            {device.Rental && device.Rental.length > 0 ? (
              <div className="space-y-2">
                {device.Rental.slice(0, 3).map((rental) => (
                  <div key={rental.id} className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <Link href={`/roles/admin/rentals/${rental.id}`} className="text-blue-600 hover:underline">
                      Location du {new Date(rental.startDate).toLocaleDateString()} au {new Date(rental.endDate).toLocaleDateString()}
                    </Link>
                  </div>
                ))}
                {device.Rental.length > 3 && (
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Voir {device.Rental.length - 3} locations supplémentaires
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Aucune location</p>
            )}
          </div>

          {/* Diagnostics */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Diagnostics</h3>
            {device.Diagnostic && device.Diagnostic.length > 0 ? (
              <div className="space-y-2">
                {device.Diagnostic.slice(0, 3).map((diagnostic) => (
                  <div key={diagnostic.id} className="flex items-center space-x-2">
                    <ClipboardIcon className="h-5 w-5 text-blue-500" />
                    <Link href={`/roles/admin/diagnostics/${diagnostic.id}`} className="text-blue-600 hover:underline">
                      Diagnostic du {new Date(diagnostic.diagnosticDate).toLocaleDateString()}
                      {diagnostic.notes && ` - ${diagnostic.notes}`}
                    </Link>
                  </div>
                ))}
                {device.Diagnostic.length > 3 && (
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Voir {device.Diagnostic.length - 3} diagnostics supplémentaires
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Aucun diagnostic</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
