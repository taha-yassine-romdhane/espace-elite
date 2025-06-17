import React from 'react';
import { MedicalDevice } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  ClipboardIcon, 
  CalendarIcon, 
  WrenchIcon, 
  ShoppingCartIcon, 
  UserIcon 
} from 'lucide-react';

interface DeviceActionsProps {
  device: MedicalDevice;
}

export const DeviceActions: React.FC<DeviceActionsProps> = ({ device }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {device.type.toUpperCase().includes('DIAGNOSTIC') && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => window.location.href = `/roles/admin/diagnostics/new?deviceId=${device.id}`}
            >
              <ClipboardIcon className="h-4 w-4" />
              <span>Nouveau diagnostic</span>
            </Button>
          )}
          
          {device.availableForRent && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => window.location.href = `/roles/admin/rentals/new?deviceId=${device.id}`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Nouvelle location</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2"
            onClick={() => window.location.href = `/roles/admin/maintenance/new?deviceId=${device.id}`}
          >
            <WrenchIcon className="h-4 w-4" />
            <span>Maintenance</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2"
            onClick={() => window.location.href = `/roles/admin/sales/new?deviceId=${device.id}`}
          >
            <ShoppingCartIcon className="h-4 w-4" />
            <span>Vendre</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2"
            onClick={() => window.location.href = `/roles/admin/appareils/${device.id}/edit`}
          >
            <ClipboardIcon className="h-4 w-4" />
            <span>Modifier</span>
          </Button>
          
          {!device.patientId && !device.companyId && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => window.location.href = `/roles/admin/appareils/${device.id}/assign`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Assigner</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};