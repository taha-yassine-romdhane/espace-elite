import React from 'react';
import { MedicalDevice } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface DeviceHeaderProps {
  device: MedicalDevice & { stockLocation?: { name: string } | null };
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({ device }) => {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RETIRED':
        return 'bg-red-100 text-red-800';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{device.name}</CardTitle>
            <p className="text-gray-500">
              {device.brand} / {device.model} {device.serialNumber && `• SN: ${device.serialNumber}`}
            </p>
          </div>
          <Badge className={getStatusColor(device.status)}>
            {device.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Type</h3>
            <p>{device.type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Prix de vente</h3>
            <p>{device.sellingPrice ? `${device.sellingPrice} DT` : 'Non défini'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Prix de location</h3>
            <p>{device.rentalPrice ? `${device.rentalPrice} DT` : 'Non défini'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Disponible pour location</h3>
            <p>{device.availableForRent ? 'Oui' : 'Non'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nécessite maintenance</h3>
            <p>{device.requiresMaintenance ? 'Oui' : 'Non'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Emplacement</h3>
            <p>{device.stockLocation?.name || 'Non défini'}</p>
          </div>
        </div>
        {device.description && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{device.description}</p>
          </div>
        )}
        {device.technicalSpecs && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Spécifications techniques</h3>
            <p className="mt-1">{device.technicalSpecs}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
