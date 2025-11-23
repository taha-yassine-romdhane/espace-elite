import React from 'react';
import { MedicalDevice } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DeviceHeaderProps {
  device: MedicalDevice & {
    stockLocation?: { name: string } | null;
    Rental?: Array<{ status: string }>;
    saleItems?: Array<{
      sale: {
        saleCode: string | null;
        patient?: { firstName: string; lastName: string; patientCode: string } | null;
        company?: { companyName: string; companyCode: string } | null;
      };
    }>;
  };
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({ device }) => {
  // Determine actual device status based on active rentals
  const hasActiveRental = device.Rental?.some(rental => rental.status === 'ACTIVE');
  const actualStatus = hasActiveRental ? 'RESERVED' : device.status;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'RETIRED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'SOLD':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Disponible';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'RETIRED':
        return 'Retiré';
      case 'RESERVED':
        return 'Réservé';
      case 'SOLD':
        return 'Vendu';
      default:
        return status;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'DIAGNOSTIC_DEVICE':
        return 'Appareil de diagnostic';
      case 'MEDICAL_DEVICE':
        return 'Appareil médical';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(actualStatus)} text-xs font-medium px-2 py-1`}>
              {getStatusLabel(actualStatus)}
            </Badge>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-600">{getDeviceTypeLabel(device.type)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Marque/Modèle:</span>
            <p className="font-medium">{device.brand} {device.model}</p>
          </div>

          {device.serialNumber && (
            <div>
              <span className="text-gray-500 text-xs">N° Série:</span>
              <p className="font-mono font-medium text-xs">{device.serialNumber}</p>
            </div>
          )}

          <div>
            <span className="text-gray-500 text-xs">Prix de vente:</span>
            <p className="font-semibold text-green-700">{device.sellingPrice ? `${device.sellingPrice} DT` : '—'}</p>
          </div>

          <div>
            <span className="text-gray-500 text-xs">Prix location:</span>
            <p className="font-semibold text-blue-700">{device.rentalPrice ? `${device.rentalPrice} DT/mois` : '—'}</p>
          </div>

          <div>
            <span className="text-gray-500 text-xs">Stock:</span>
            <p className="text-xs">{device.stockLocation?.name || <span className="text-orange-600 italic">Non assigné</span>}</p>
          </div>

          {device.technicalSpecs && (
            <div>
              <span className="text-gray-500 text-xs">Compteur:</span>
              <p className="font-semibold">{device.technicalSpecs}h</p>
            </div>
          )}
        </div>

        {device.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-700">{device.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
