import React, { useState } from 'react';
import { MedicalDevice } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { WrenchIcon, Pencil } from 'lucide-react';
import { RepairDeviceDialog } from './dialogs/RepairDeviceDialog';
import { EditDeviceDialog } from './dialogs/EditDeviceDialog';
import { useRouter } from 'next/router';

interface DeviceActionsProps {
  device: MedicalDevice;
  stockLocations: Array<{ id: string; name: string }>;
}

export const DeviceActions: React.FC<DeviceActionsProps> = ({ device, stockLocations }) => {
  const router = useRouter();
  const [isRepairDialogOpen, setIsRepairDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSuccess = () => {
    router.reload();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsRepairDialogOpen(true)}
        >
          <WrenchIcon className="h-4 w-4" />
          <span>Maintenance</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          <span>Modifier</span>
        </Button>
      </div>

      <RepairDeviceDialog
        isOpen={isRepairDialogOpen}
        onOpenChange={setIsRepairDialogOpen}
        device={device}
        onSuccess={handleSuccess}
      />

      <EditDeviceDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        device={device}
        onSuccess={handleSuccess}
        stockLocations={stockLocations}
      />
    </>
  );
};

export default DeviceActions;
