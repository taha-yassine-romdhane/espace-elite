import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MedicalDeviceImportExportProps {
  onImportSuccess: () => void;
  stockLocations: Array<{ id: string; name: string }>;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface MedicalDeviceRow {
  deviceCode?: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  stockLocationName?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  rentalPrice?: number;
  technicalSpecs?: string;
  destination?: string;
  status?: string;
}

export function MedicalDeviceImportExport({ onImportSuccess, stockLocations }: MedicalDeviceImportExportProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [previewData, setPreviewData] = useState<MedicalDeviceRow[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Template structure with all device types
  const getTemplateData = () => {
    // Use only available locations - all examples will use the first location
    const firstLocationName = stockLocations.length > 0 ? stockLocations[0].name : 'Bureau Principal';

    return [
      {
        name: 'CPAP',
        type: 'MEDICAL_DEVICE',
        brand: 'Philips',
        model: 'DreamStation 2',
        serialNumber: 'DS2-2024-001',
        stockLocationName: firstLocationName,
        purchasePrice: 1500.0,
        sellingPrice: 2200.0,
        rentalPrice: 45.0,
        technicalSpecs: 'Auto-CPAP avec humidificateur intégré, pression 4-20 cmH2O',
        destination: 'FOR_RENT',
        status: 'ACTIVE'
      },
      {
        name: 'VNI',
        type: 'MEDICAL_DEVICE',
        brand: 'ResMed',
        model: 'Stellar 150',
        serialNumber: 'ST150-2024-002',
        stockLocationName: firstLocationName,
        purchasePrice: 2800.0,
        sellingPrice: 3500.0,
        rentalPrice: 65.0,
        technicalSpecs: 'Ventilateur non invasif bi-level, modes ST, CPAP, BIPAP',
        destination: 'FOR_RENT',
        status: 'ACTIVE'
      },
      {
        name: 'Concentrateur O²',
        type: 'MEDICAL_DEVICE',
        brand: 'Invacare',
        model: 'Platinum 10',
        serialNumber: 'PLT10-2024-003',
        stockLocationName: firstLocationName,
        purchasePrice: 1200.0,
        sellingPrice: 1800.0,
        rentalPrice: 35.0,
        technicalSpecs: 'Concentrateur 10L/min, pureté O2 93% ±3%',
        destination: 'FOR_RENT',
        status: 'ACTIVE'
      },
      {
        name: 'Vi',
        type: 'MEDICAL_DEVICE',
        brand: 'AirSep',
        model: 'VisionAire 5',
        serialNumber: 'VA5-2024-004',
        stockLocationName: firstLocationName,
        purchasePrice: 900.0,
        sellingPrice: 1400.0,
        rentalPrice: 28.0,
        technicalSpecs: 'Concentrateur 5L/min, faible consommation',
        destination: 'FOR_SALE',
        status: 'ACTIVE'
      },
      {
        name: 'Bouteil O²',
        type: 'MEDICAL_DEVICE',
        brand: 'Air Liquide',
        model: 'B50',
        serialNumber: 'B50-2024-005',
        stockLocationName: firstLocationName,
        purchasePrice: 150.0,
        sellingPrice: 250.0,
        rentalPrice: 12.0,
        technicalSpecs: 'Bouteille 50L, pression 200 bar, avec manodétendeur',
        destination: 'FOR_RENT',
        status: 'ACTIVE'
      }
    ];
  };

  const downloadTemplate = () => {
    const templateData = getTemplateData();
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appareils_Medicaux');

    // Add headers with instructions
    const locationNames = stockLocations.map(loc => loc.name).join(', ');
    const headers = [
      'Nom (CPAP, VNI, Concentrateur O², Vi, Bouteil O², Autre)',
      'Type (MEDICAL_DEVICE)',
      'Marque',
      'Modèle',
      'Numéro de Série (obligatoire)',
      `Lieu de Stockage (${locationNames})`,
      'Prix d\'Achat (DT)',
      'Prix de Vente (DT)',
      'Prix de Location/jour (DT)',
      'Spécifications Techniques',
      'Destination (FOR_SALE, FOR_RENT, IN_REPAIR, OUT_OF_SERVICE)',
      'Statut (ACTIVE, MAINTENANCE, RETIRED, RESERVED)',
      'Note: Le code appareil (APP0001, APP0002...) sera généré automatiquement'
    ];

    XLSX.utils.sheet_add_aoa(wb.Sheets['Appareils_Medicaux'], [headers], { origin: 'A1' });

    XLSX.writeFile(wb, 'template_appareils_medicaux.xlsx');

    toast({
      title: 'Succès',
      description: 'Template téléchargé avec succès avec 5 exemples (CPAP, VNI, Concentrateur, Vi, Bouteille O²)',
    });
  };

  const validateRow = (row: MedicalDeviceRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: index + 2,
        field: 'name',
        message: 'Le nom est obligatoire'
      });
    }

    // Type validation
    if (!row.type || row.type !== 'MEDICAL_DEVICE') {
      errors.push({
        row: index + 2,
        field: 'type',
        message: 'Le type doit être MEDICAL_DEVICE'
      });
    }

    // Serial number validation (recommended but not strictly required)
    if (!row.serialNumber || row.serialNumber.trim() === '') {
      errors.push({
        row: index + 2,
        field: 'serialNumber',
        message: 'Le numéro de série est fortement recommandé'
      });
    }

    // Location validation
    if (row.stockLocationName && row.stockLocationName.trim() !== '') {
      const locationExists = stockLocations.some(
        loc => loc.name.toLowerCase() === row.stockLocationName?.toLowerCase()
      );
      if (!locationExists) {
        errors.push({
          row: index + 2,
          field: 'stockLocationName',
          message: `Emplacement "${row.stockLocationName}" non trouvé. Emplacements disponibles: ${stockLocations.map(l => l.name).join(', ')}`
        });
      }
    }

    // Price validation
    if (row.purchasePrice !== undefined && row.purchasePrice < 0) {
      errors.push({
        row: index + 2,
        field: 'purchasePrice',
        message: 'Le prix d\'achat doit être positif'
      });
    }

    if (row.sellingPrice !== undefined && row.sellingPrice < 0) {
      errors.push({
        row: index + 2,
        field: 'sellingPrice',
        message: 'Le prix de vente doit être positif'
      });
    }

    if (row.rentalPrice !== undefined && row.rentalPrice < 0) {
      errors.push({
        row: index + 2,
        field: 'rentalPrice',
        message: 'Le prix de location doit être positif'
      });
    }

    // Status validation
    const validStatuses = ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'RESERVED'];
    if (row.status && !validStatuses.includes(row.status)) {
      errors.push({
        row: index + 2,
        field: 'status',
        message: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`
      });
    }

    // Destination validation
    const validDestinations = ['FOR_SALE', 'FOR_RENT', 'IN_REPAIR', 'OUT_OF_SERVICE'];
    if (row.destination && !validDestinations.includes(row.destination)) {
      errors.push({
        row: index + 2,
        field: 'destination',
        message: `Destination invalide. Valeurs autorisées: ${validDestinations.join(', ')}`
      });
    }

    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast({
            title: 'Erreur',
            description: 'Le fichier Excel doit contenir au moins une ligne de données',
            variant: 'destructive',
          });
          return;
        }

        // Skip header row and convert to objects (device code will be auto-generated)
        const rows = jsonData.slice(1)
          .filter((row: any) => row[0] && row[0].toString().trim() !== '') // Filter rows with name
          .map((row: any) => ({
            name: row[0]?.toString().trim() || '',
            type: row[1]?.toString().trim() || 'MEDICAL_DEVICE',
            brand: row[2]?.toString().trim() || '',
            model: row[3]?.toString().trim() || '',
            serialNumber: row[4]?.toString().trim() || '',
            stockLocationName: row[5]?.toString().trim() || '',
            purchasePrice: row[6] ? Number(row[6]) : undefined,
            sellingPrice: row[7] ? Number(row[7]) : undefined,
            rentalPrice: row[8] ? Number(row[8]) : undefined,
            technicalSpecs: row[9]?.toString().trim() || '',
            destination: row[10]?.toString().trim() || 'FOR_SALE',
            status: row[11]?.toString().trim() || 'ACTIVE',
          })) as MedicalDeviceRow[];

        // Validate all rows
        const allErrors: ValidationError[] = [];
        rows.forEach((row, index) => {
          const errors = validateRow(row, index);
          allErrors.push(...errors);
        });

        if (allErrors.length > 0) {
          setValidationErrors(allErrors);
          setShowErrorDialog(true);
          return;
        }

        // Show preview if validation passes
        setPreviewData(rows);
        setShowPreviewDialog(true);

      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la lecture du fichier Excel',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    setIsProcessing(true);
    try {
      const devicesToImport = previewData.map(row => {
        const stockLocation = stockLocations.find(
          loc => loc.name.toLowerCase() === row.stockLocationName?.toLowerCase()
        );

        return {
          // deviceCode will be auto-generated by the API (APP0001, APP0002, etc.)
          name: row.name,
          type: 'MEDICAL_DEVICE',
          brand: row.brand || null,
          model: row.model || null,
          serialNumber: row.serialNumber || null,
          stockLocationId: stockLocation?.id || null,
          purchasePrice: row.purchasePrice || null,
          sellingPrice: row.sellingPrice || null,
          rentalPrice: row.rentalPrice || null,
          technicalSpecs: row.technicalSpecs || null,
          destination: row.destination || 'FOR_SALE',
          status: row.status || 'ACTIVE',
        };
      });

      const response = await fetch('/api/medical-devices/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ devices: devicesToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'importation');
      }

      const result = await response.json();

      toast({
        title: 'Succès',
        description: `${result.imported} appareils médicaux importés avec succès`,
      });

      setShowPreviewDialog(false);
      setIsImportOpen(false);
      setPreviewData([]);
      onImportSuccess();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'importation des appareils',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportDevices = async () => {
    try {
      const response = await fetch('/api/medical-devices?type=MEDICAL_DEVICE');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des appareils médicaux');
      }

      const devices = await response.json();

      if (devices.length === 0) {
        toast({
          title: 'Information',
          description: 'Aucun appareil médical à exporter',
        });
        return;
      }

      // Transform devices for export
      const exportData = devices.map((device: any) => ({
        'Code Appareil': device.deviceCode || '',
        'Nom': device.name || '',
        'Type': device.type || 'MEDICAL_DEVICE',
        'Marque': device.brand || '',
        'Modèle': device.model || '',
        'Numéro de Série': device.serialNumber || '',
        'Lieu de Stockage': device.stockLocation?.name || '',
        'Prix d\'Achat': device.purchasePrice || '',
        'Prix de Vente': device.sellingPrice || '',
        'Prix de Location': device.rentalPrice || '',
        'Spécifications': device.technicalSpecs || '',
        'Destination': device.destination || '',
        'Statut': device.status || 'ACTIVE',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Appareils_Medicaux');

      const fileName = `appareils_medicaux_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Succès',
        description: `${devices.length} appareils médicaux exportés avec succès`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'exportation des appareils médicaux',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Template Download Button */}
      <Button variant="outline" onClick={downloadTemplate}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Template
      </Button>

      {/* Import Button */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des Appareils Médicaux</DialogTitle>
            <DialogDescription>
              Téléchargez d'abord le template, remplissez-le avec vos données, puis importez-le ici.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Fichier Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Button */}
      <Button variant="outline" onClick={exportDevices}>
        <Download className="mr-2 h-4 w-4" />
        Exporter
      </Button>

      {/* Validation Errors Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Erreurs de validation ({validationErrors.length})
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier contient des erreurs. Veuillez les corriger et réessayer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                <span className="font-semibold">Ligne {error.row}</span> - {error.field}: {error.message}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <AlertDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Aperçu des appareils à importer ({previewData.length})
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vérifiez les données avant de confirmer l'importation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="mb-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Note: Les codes d'appareil (APP0001, APP0002...) seront générés automatiquement
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Marque</th>
                  <th className="p-2 text-left">Modèle</th>
                  <th className="p-2 text-left">N° Série</th>
                  <th className="p-2 text-left">Emplacement</th>
                  <th className="p-2 text-left">Destination</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.brand || '-'}</td>
                    <td className="p-2">{row.model || '-'}</td>
                    <td className="p-2">{row.serialNumber || '-'}</td>
                    <td className="p-2">{row.stockLocationName || '-'}</td>
                    <td className="p-2">{row.destination || 'FOR_SALE'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={processImport} disabled={isProcessing}>
              {isProcessing ? 'Importation...' : 'Confirmer l\'importation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MedicalDeviceImportExport;
