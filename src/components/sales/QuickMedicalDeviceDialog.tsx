import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, AlertTriangle, Package, ArrowRightLeft, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuickMedicalDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceCreated: () => void;
}

export function QuickMedicalDeviceDialog({
  open,
  onOpenChange,
  onDeviceCreated
}: QuickMedicalDeviceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [deviceData, setDeviceData] = useState({
    name: '',
    customName: '',
    brand: '',
    serialNumber: '',
    sellingPrice: '',
    destination: 'FOR_SALE',
    description: `Créé par ${session?.user?.name || 'Employee'}`
  });

  const [existingDevice, setExistingDevice] = useState<any>(null);
  const [checkingSerial, setCheckingSerial] = useState(false);
  const [serialVerified, setSerialVerified] = useState(false);

  // Standard device names from admin form
  const deviceNames = [
    { value: 'CPAP', label: 'CPAP' },
    { value: 'VNI', label: 'VNI' },
    { value: 'Concentrateur O²', label: 'Concentrateur O²' },
    { value: 'Vi', label: 'Vi' },
    { value: 'Bouteil O²', label: 'Bouteille O²' },
    { value: 'Autre', label: 'Autre (personnalisé)' }
  ];

  const updateField = (field: string, value: any) => {
    setDeviceData({ ...deviceData, [field]: value });

    // Clear existing device warning and verification status when name or serial changes
    if (field === 'name' || field === 'serialNumber' || field === 'customName') {
      setExistingDevice(null);
      setSerialVerified(false);
    }
  };

  // Manual check if serial number exists
  const checkSerialNumber = async () => {
    if (!deviceData.serialNumber || deviceData.serialNumber.length < 3) {
      toast({
        title: 'Attention',
        description: 'Veuillez entrer un numéro de série (min. 3 caractères)',
        variant: 'destructive'
      });
      return;
    }

    if (!deviceData.name) {
      toast({
        title: 'Attention',
        description: 'Veuillez d\'abord sélectionner un nom d\'appareil',
        variant: 'destructive'
      });
      return;
    }

    const finalName = deviceData.name === 'Autre' ? deviceData.customName : deviceData.name;
    if (!finalName) {
      toast({
        title: 'Attention',
        description: 'Veuillez entrer un nom personnalisé',
        variant: 'destructive'
      });
      return;
    }

    setCheckingSerial(true);
    setExistingDevice(null);
    setSerialVerified(false);

    try {
      // Send both serialNumber AND name to the API for server-side filtering
      const response = await fetch(
        `/api/medical-devices?serialNumber=${encodeURIComponent(deviceData.serialNumber)}&name=${encodeURIComponent(finalName)}`
      );

      if (response.ok) {
        const devices = await response.json();

        // API already filtered by name and serial number
        if (devices.length > 0) {
          setExistingDevice(devices[0]);
          setSerialVerified(false);
          toast({
            title: 'Appareil existant trouvé',
            description: `Un ${finalName} avec ce numéro de série existe déjà`,
            variant: 'destructive'
          });
        } else {
          setSerialVerified(true);
          toast({
            title: 'Numéro de série disponible',
            description: 'Aucun appareil avec ce nom et ce numéro de série trouvé',
          });
        }
      }
    } catch (error) {
      console.error('Error checking serial number:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la vérification',
        variant: 'destructive'
      });
    } finally {
      setCheckingSerial(false);
    }
  };

  // Create device mutation
  const createDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/medical-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create device');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Succès',
        description: 'Appareil médical créé avec succès'
      });
      onDeviceCreated();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive'
      });
    },
  });

  // Transfer device mutation
  const transferDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch('/api/medical-devices/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          toUserId: session?.user?.id,
          notes: `Transfer for sale - requested by ${session?.user?.name}`
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer device');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Succès',
        description: 'Appareil transféré à votre stock avec succès'
      });
      onDeviceCreated();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du transfert',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = async () => {
    // Validation
    if (!deviceData.name) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un nom d\'appareil',
        variant: 'destructive'
      });
      return;
    }

    // If "Autre" is selected, check customName
    if (deviceData.name === 'Autre' && (!deviceData.customName || deviceData.customName.length < 2)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom personnalisé (min. 2 caractères)',
        variant: 'destructive'
      });
      return;
    }

    if (!deviceData.serialNumber) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de série',
        variant: 'destructive'
      });
      return;
    }

    if (!deviceData.sellingPrice || Number(deviceData.sellingPrice) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un prix de vente valide',
        variant: 'destructive'
      });
      return;
    }

    // If device exists in another location, don't create
    if (existingDevice) {
      toast({
        title: 'Attention',
        description: 'Ce numéro de série existe déjà. Veuillez utiliser le bouton de transfert.',
        variant: 'destructive'
      });
      return;
    }

    // Prepare the final name (use customName if "Autre" is selected)
    const finalName = deviceData.name === 'Autre' ? deviceData.customName : deviceData.name;

    const payload = {
      name: finalName,
      brand: deviceData.brand || null,
      model: null, // Not needed for quick creation
      serialNumber: deviceData.serialNumber,
      sellingPrice: Number(deviceData.sellingPrice),
      rentalPrice: null,
      purchasePrice: null,
      description: deviceData.description,
      destination: deviceData.destination,
      status: 'ACTIVE',
      type: 'MEDICAL_DEVICE',
      // Will be auto-assigned to user's stock location by API
      assignToMe: true
    };

    await createDeviceMutation.mutateAsync(payload);
  };

  const handleTransfer = async () => {
    if (!existingDevice) return;
    await transferDeviceMutation.mutateAsync(existingDevice.id);
  };

  const handleClose = () => {
    setDeviceData({
      name: '',
      customName: '',
      brand: '',
      serialNumber: '',
      sellingPrice: '',
      destination: 'FOR_SALE',
      description: `Créé par ${session?.user?.name || 'Employee'}`
    });
    setExistingDevice(null);
    setSerialVerified(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Création Rapide d'Appareil Médical
          </DialogTitle>
          <DialogDescription>
            Créez un nouvel appareil pour votre stock ou transférez-en un existant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-2">
          {/* Device Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nom de l'appareil <span className="text-red-500">*</span>
            </label>
            <Select value={deviceData.name} onValueChange={(val) => updateField('name', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un nom" />
              </SelectTrigger>
              <SelectContent>
                {deviceNames.map(device => (
                  <SelectItem key={device.value} value={device.value}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Name (if "Autre" selected) */}
          {deviceData.name === 'Autre' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nom personnalisé <span className="text-red-500">*</span>
              </label>
              <Input
                value={deviceData.customName}
                onChange={(e) => updateField('customName', e.target.value)}
                placeholder="Ex: Nébuliseur portable"
              />
            </div>
          )}

          {/* Brand (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Marque (optionnel)
            </label>
            <Input
              value={deviceData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Ex: ResMed, Philips, etc."
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Numéro de série <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={deviceData.serialNumber}
                  onChange={(e) => updateField('serialNumber', e.target.value)}
                  placeholder="Ex: CPAP-2024-001"
                  className={serialVerified ? 'pr-10' : ''}
                />
                {serialVerified && (
                  <CheckCircle className="absolute right-3 top-2.5 h-5 w-5 text-green-600" />
                )}
              </div>
              <Button
                type="button"
                onClick={checkSerialNumber}
                disabled={checkingSerial || !deviceData.serialNumber || !deviceData.name}
                variant={serialVerified ? "default" : "outline"}
                className={serialVerified ? "flex-shrink-0 bg-green-600 hover:bg-green-700" : "flex-shrink-0"}
              >
                {checkingSerial ? 'Vérification...' : serialVerified ? 'Vérifié' : 'Vérifier'}
              </Button>
            </div>
            {!deviceData.name && deviceData.serialNumber && (
              <p className="text-xs text-orange-600">Sélectionnez d'abord un nom d'appareil</p>
            )}
            {serialVerified && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Numéro de série vérifié et disponible
              </p>
            )}
          </div>

          {/* Existing Device Warning */}
          {existingDevice && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-900 mb-2">
                    Appareil existant trouvé !
                  </p>
                  <div className="space-y-1 text-xs text-yellow-800 mb-3">
                    <p><strong>Nom:</strong> {existingDevice.deviceName || existingDevice.name}</p>
                    <p><strong>Code:</strong> {existingDevice.deviceCode}</p>
                    <p><strong>Emplacement:</strong> {existingDevice.stockLocation?.name || 'Non assigné'}</p>
                    <p><strong>Statut:</strong> {existingDevice.status}</p>
                  </div>
                  <Button
                    onClick={handleTransfer}
                    disabled={transferDeviceMutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {transferDeviceMutation.isPending ? 'Transfert...' : 'Transférer à mon stock'}
                  </Button>
                  <p className="text-xs text-yellow-700 mt-2 italic">
                    Ou changez le numéro de série pour créer un nouvel appareil
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selling Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Prix de vente (DT) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={deviceData.sellingPrice}
              onChange={(e) => updateField('sellingPrice', e.target.value)}
              placeholder="Ex: 1500.00"
            />
          </div>

          {/* Description (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description
            </label>
            <Input
              value={deviceData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Notes additionnelles..."
            />
            <p className="text-xs text-gray-500">
              Créateur: {session?.user?.name || 'Utilisateur'}
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Package className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Création rapide - Appareil médical</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Type: MEDICAL_DEVICE</li>
                <li>Code appareil: Généré automatiquement (APP0001, APP0002...)</li>
                <li>Destination: {deviceData.destination === 'FOR_SALE' ? 'À vendre' : 'À louer'}</li>
                <li>Assigné automatiquement à votre stock</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createDeviceMutation.isPending || !!existingDevice}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createDeviceMutation.isPending ? 'Création...' : 'Créer l\'appareil'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
