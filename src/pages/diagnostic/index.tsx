import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PenSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Diagnostic {
  id: string;
  medicalDevice: {
    name: string;
    brand: string | null;
    model: string | null;
  };
  patient: {
    firstName: string;
    lastName: string;
    telephone: string;
  };
  Company: {
    companyName: string;
    telephone: string;
  } | null;
  result: string;
  notes: string | null;
  diagnosticDate: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  medicalDeviceId: string;
  patientId: string;
  companyId?: string;
  result: string;
  notes?: string;
  diagnosticDate: string;
}

interface MedicalDevice {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
}

export default function DiagnosticPage() {
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<{ diagnostics: Diagnostic[] }>({ diagnostics: [] });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState<FormData>({
    medicalDeviceId: '',
    patientId: '',
    result: 'EN_ATTENTE',
    diagnosticDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch('/api/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les diagnostics',
        variant: 'destructive',
      });
    }
  };

  const fetchMedicalDevices = async () => {
    try {
      const response = await fetch('/api/medical-devices/diagnostic-devices');
      const data = await response.json();
      setMedicalDevices(data.devices);
    } catch (error) {
      console.error('Error fetching medical devices:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les appareils',
        variant: 'destructive',
      });
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients/list');
      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les patients',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchMedicalDevices();
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalDeviceId: formData.medicalDeviceId,
          patientId: formData.patientId,
          result: formData.result,
          notes: formData.notes,
          diagnosticDate: new Date(formData.diagnosticDate).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create diagnostic');
      }

      await fetchDiagnostics();
      setIsAddDialogOpen(false);
      setFormData({
        medicalDeviceId: '',
        patientId: '',
        result: 'EN_ATTENTE',
        diagnosticDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      toast({
        title: 'Succès',
        description: 'Diagnostic créé avec succès',
      });
    } catch (error) {
      console.error('Error creating diagnostic:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la création du diagnostic',
        variant: 'destructive',
      });
    }
  };

  const getResultBadgeVariant = (result: string) => {
    switch (result) {
      case 'NORMAL':
        return 'default';
      case 'ABNORMAL':
        return 'destructive';
      case 'EN_ATTENTE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des Diagnostics</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Nouveau Diagnostic</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Appareil</TableHead>
              <TableHead>Résultat</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostics.diagnostics?.map((diagnostic) => (
              <TableRow key={diagnostic.id}>
                <TableCell>
                  {diagnostic.patient.firstName} {diagnostic.patient.lastName}
                </TableCell>
                <TableCell>{diagnostic.patient.telephone}</TableCell>
                <TableCell>
                  {diagnostic.medicalDevice.name}
                  {diagnostic.medicalDevice.brand && ` - ${diagnostic.medicalDevice.brand}`}
                  {diagnostic.medicalDevice.model && ` (${diagnostic.medicalDevice.model})`}
                </TableCell>
                <TableCell>
                  <Badge variant={getResultBadgeVariant(diagnostic.result)}>
                    {getResultBadgeVariant(diagnostic.result) === 'default' ? 'NORMAL' : getResultBadgeVariant(diagnostic.result) === 'destructive' ? 'ANORMAL' : 'EN_ATTENTE'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(diagnostic.diagnosticDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{diagnostic.notes || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <PenSquare className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Diagnostic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicalDeviceId">Appareil</Label>
                <Select
                  value={formData.medicalDeviceId}
                  onValueChange={(value) => setFormData({ ...formData, medicalDeviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un appareil" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicalDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                        {device.brand && ` - ${device.brand}`}
                        {device.model && ` (${device.model})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.telephone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="result">Résultat</Label>
                <Select
                  value={formData.result}
                  onValueChange={(value) => setFormData({ ...formData, result: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un résultat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN_ATTENTE">En Attente</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ABNORMAL">Anormal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosticDate">Date</Label>
                <Input
                  id="diagnosticDate"
                  type="date"
                  value={formData.diagnosticDate}
                  onChange={(e) => setFormData({ ...formData, diagnosticDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
