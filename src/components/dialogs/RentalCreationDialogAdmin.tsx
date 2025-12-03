import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { RentalArticleSelectionDialog } from "./RentalArticleSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Stethoscope,
  Settings,
  Package,
  CheckCircle,
  Trash2,
  Phone,
  Check,
  CalendarClock,
  AlertCircle,
  Search,
  X,
  UserCog
} from 'lucide-react';

interface PreselectedPatient {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  patientCode?: string;
  telephone?: string;
}

interface RentalCreationDialogAdminProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (rentalId: string) => void;
  preselectedPatient?: PreselectedPatient;
}

interface SelectedAccessory {
  type: 'accessory' | 'spare-part';
  id: string;
  name: string;
  code?: string;
  brand?: string;
  model?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export function RentalCreationDialogAdmin({ open, onOpenChange, onSuccess, preselectedPatient }: RentalCreationDialogAdminProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Determine if we should skip patient selection step
  const hasPreselectedPatient = !!preselectedPatient;
  const initialStep = hasPreselectedPatient ? 2 : 1;

  // Step state (5 steps for admin, but start at step 2 if patient is preselected)
  const [step, setStep] = useState(initialStep);

  // Form state - initialize with preselected patient if provided
  const [patientSearch, setPatientSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [patientId, setPatientId] = useState<string>(preselectedPatient?.id || '');
  const [patientName, setPatientName] = useState<string>(
    preselectedPatient?.name || (preselectedPatient ? `${preselectedPatient.firstName} ${preselectedPatient.lastName}` : '')
  );
  const [patientCode, setPatientCode] = useState<string>(preselectedPatient?.patientCode || '');
  const [patientPhone, setPatientPhone] = useState<string>(preselectedPatient?.telephone || '');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeEmail, setEmployeeEmail] = useState<string>('');
  const [medicalDeviceId, setMedicalDeviceId] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceCode, setDeviceCode] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(true);
  const [rentalRate, setRentalRate] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'DAILY' | 'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [cnamEligible, setCnamEligible] = useState<boolean>(false);
  const [status, setStatus] = useState<'PENDING' | 'ACTIVE' | 'PAUSED'>('PENDING');

  // Accessories state
  const [accessories, setAccessories] = useState<SelectedAccessory[]>([]);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const totalSteps = 5; // Patient → Employee → Articles → Configuration → Review

  // Fetch ALL patients (admin can see all)
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: async () => {
      const response = await fetch("/api/renseignements/patients");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return data.patients || [];
    },
    enabled: open && !!session,
  });

  // Fetch ALL employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=EMPLOYEE");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      return data.users || [];
    },
    enabled: open && !!session,
  });

  const patients = (patientsData || []).map((p: any) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    code: p.patientCode,
    patientCode: p.patientCode,
    telephone: p.telephone
  }));

  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : [];

  // Filter patients based on search
  const filteredPatients = patients.filter((patient: any) => {
    const searchLower = patientSearch.toLowerCase();
    return patient.name.toLowerCase().includes(searchLower) ||
           patient.code?.toLowerCase().includes(searchLower) ||
           patient.telephone?.toLowerCase().includes(searchLower);
  });

  // Filter employees based on search
  const filteredEmployees = employees.filter(employee => {
    const searchLower = employeeSearch.toLowerCase();
    const name = employee.name?.toLowerCase() || '';
    const email = employee.email?.toLowerCase() || '';
    return name.includes(searchLower) || email.includes(searchLower);
  });

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/rentals/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create rental');
      }
      return response.json();
    },
    onSuccess: async (rentalData) => {
      // If there are accessories, create rental accessories
      if (accessories.length > 0) {
        try {
          await Promise.all(
            accessories.map((acc) =>
              fetch('/api/rental-accessories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rentalId: rentalData.id,
                  productId: acc.id,
                  quantity: acc.quantity,
                  unitPrice: acc.unitPrice,
                }),
              })
            )
          );
        } catch (error) {
          console.error('Error adding accessories:', error);
          toast({
            title: "Avertissement",
            description: "Location créée mais erreur lors de l'ajout des accessoires",
            variant: "destructive",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['rentals-comprehensive'] });
      queryClient.invalidateQueries({ queryKey: ['rental-statistics'] });
      toast({
        title: "Succès",
        description: `Location créée avec succès: ${rentalData.rentalCode}`,
      });
      handleReset();
      onOpenChange(false);
      if (onSuccess && rentalData.id) {
        onSuccess(rentalData.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    setStep(initialStep);
    setPatientSearch('');
    setEmployeeSearch('');
    // Only reset patient data if no preselected patient
    if (!hasPreselectedPatient) {
      setPatientId('');
      setPatientName('');
      setPatientCode('');
      setPatientPhone('');
    } else {
      // Re-initialize with preselected patient data
      setPatientId(preselectedPatient?.id || '');
      setPatientName(preselectedPatient?.name || (preselectedPatient ? `${preselectedPatient.firstName} ${preselectedPatient.lastName}` : ''));
      setPatientCode(preselectedPatient?.patientCode || '');
      setPatientPhone(preselectedPatient?.telephone || '');
    }
    setEmployeeId('');
    setEmployeeName('');
    setEmployeeEmail('');
    setMedicalDeviceId('');
    setDeviceName('');
    setDeviceCode('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsOpenEnded(true);
    setRentalRate('');
    setBillingCycle('MONTHLY');
    setCnamEligible(false);
    setStatus('PENDING');
    setAccessories([]);
  };

  const handlePatientSelect = (patient: any) => {
    setPatientId(patient.id);
    setPatientName(patient.name);
    setPatientCode(patient.code || '');
    setPatientPhone(patient.telephone || '');
    setTimeout(() => setStep(2), 300);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeeId(employee.id);
    setEmployeeName(employee.name);
    setEmployeeEmail(employee.email);
    setTimeout(() => setStep(3), 300);
  };

  const handleDeviceSelect = (device: any) => {
    setMedicalDeviceId(device.id);
    setDeviceName(device.name);
    setDeviceCode(device.code || '');
    setShowArticleDialog(false);
  };

  const handleAccessoriesSelect = (selectedAccessories: any[]) => {
    const formattedAccessories: SelectedAccessory[] = selectedAccessories.map(acc => ({
      type: 'accessory',
      id: acc.id,
      name: acc.name,
      code: acc.code,
      brand: acc.brand,
      model: acc.model,
      unitPrice: acc.unitPrice,
      quantity: 1,
      totalPrice: acc.unitPrice
    }));
    setAccessories(formattedAccessories);
    setShowArticleDialog(false);
  };

  const updateAccessoryQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setAccessories(
      accessories.map(acc =>
        acc.id === id
          ? { ...acc, quantity, totalPrice: acc.unitPrice * quantity }
          : acc
      )
    );
  };

  const removeAccessory = (id: string) => {
    setAccessories(accessories.filter(acc => acc.id !== id));
  };

  const handleNext = () => {
    if (step === 1 && !patientId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient', variant: 'destructive' });
      return;
    }
    if (step === 2 && !employeeId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un employé', variant: 'destructive' });
      return;
    }
    if (step === 3 && !medicalDeviceId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un appareil médical', variant: 'destructive' });
      return;
    }
    if (step === 4 && (!startDate || !rentalRate || parseFloat(rentalRate) <= 0)) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs requis', variant: 'destructive' });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    // Don't go back to step 1 if patient is preselected
    if (hasPreselectedPatient && step === 2) {
      return;
    }
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!patientId || !employeeId || !medicalDeviceId || !startDate || !rentalRate || parseFloat(rentalRate) <= 0) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }

    const rentalData = {
      patientId,
      medicalDeviceId,
      startDate,
      endDate: isOpenEnded ? null : (endDate || null),
      status,
      createdById: employeeId,
      assignedToId: employeeId,
      configuration: {
        rentalRate: parseFloat(rentalRate),
        billingCycle,
        isGlobalOpenEnded: isOpenEnded,
        cnamEligible,
      },
    };

    createRentalMutation.mutate(rentalData);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const isSubmitting = createRentalMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && !isSubmitting) {
          handleClose();
        }
      }}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-blue-900">Nouvelle Location</h2>
                <p className="text-sm text-blue-700">
                  {step === 1 ? 'Choisissez le patient' :
                   step === 2 ? 'Assignez à un employé' :
                   step === 3 ? 'Sélectionnez appareil et accessoires' :
                   step === 4 ? 'Configurez les détails' :
                   'Vérifiez et confirmez'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-gray-50 p-4 space-y-2">
              {/* Step 1: Patient */}
              <div className={`p-3 rounded-lg ${step === 1 ? 'bg-blue-600 text-white' : (step > 1 || hasPreselectedPatient) ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-700' : (step > 1 || hasPreselectedPatient) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {(step > 1 || hasPreselectedPatient) ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Patient</div>
                    {(step > 1 || hasPreselectedPatient) && patientName && <div className="text-xs truncate">{patientName}</div>}
                  </div>
                </div>
              </div>

              {/* Step 2: Employee */}
              <div className={`p-3 rounded-lg ${step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-700' : step > 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {step > 2 ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Employé</div>
                    {step > 2 && employeeName && <div className="text-xs truncate">{employeeName}</div>}
                  </div>
                </div>
              </div>

              {/* Step 3: Articles */}
              <div className={`p-3 rounded-lg ${step === 3 ? 'bg-blue-600 text-white' : step > 3 ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 3 ? 'bg-blue-700' : step > 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {step > 3 ? <Check className="h-4 w-4" /> : '3'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Articles</div>
                    {step > 3 && deviceName && <div className="text-xs truncate">{deviceName}</div>}
                  </div>
                </div>
              </div>

              {/* Step 4: Configuration */}
              <div className={`p-3 rounded-lg ${step === 4 ? 'bg-blue-600 text-white' : step > 4 ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 4 ? 'bg-blue-700' : step > 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {step > 4 ? <Check className="h-4 w-4" /> : '4'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Configuration</div>
                  </div>
                </div>
              </div>

              {/* Step 5: Review */}
              <div className={`p-3 rounded-lg ${step === 5 ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 5 ? 'bg-blue-700' : 'bg-gray-200'}`}>
                    5
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Finaliser</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Patient Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="pl-8" />
                  </div>
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {loadingPatients ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">Chargement...</div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">Aucun patient</div>
                      ) : (
                        filteredPatients.map((patient: any) => (
                          <Button key={patient.id} variant="ghost" className="w-full justify-start h-auto py-3 hover:bg-blue-50" onClick={() => handlePatientSelect(patient)}>
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 w-full">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{patient.name}</span>
                                {patient.code && <Badge variant="outline" className="text-xs ml-auto">{patient.code}</Badge>}
                              </div>
                              {patient.telephone && <span className="text-xs text-muted-foreground ml-6">{patient.telephone}</span>}
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Step 2: Employee Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Patient:</span>
                      <span className="text-blue-700">{patientName}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un employé..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="pl-8" />
                  </div>
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {loadingEmployees ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">Chargement...</div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">Aucun employé</div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <Button key={employee.id} variant="ghost" className="w-full justify-start h-auto py-3 hover:bg-blue-50" onClick={() => handleEmployeeSelect(employee)}>
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{employee.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground ml-6">{employee.email}</span>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Steps 3, 4, 5: Similar to employee but simplified and with blue theme */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-600" />
                      <span>{patientName}</span>
                      <span className="text-gray-400">→</span>
                      <UserCog className="h-4 w-4 text-blue-600" />
                      <span>{employeeName}</span>
                    </div>
                  </div>
                  <Button onClick={() => setShowArticleDialog(true)} className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-lg">
                    <Package className="h-6 w-6 mr-2" />Sélectionner Appareil & Accessoires
                  </Button>
                  {medicalDeviceId && (
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-blue-600" /><span className="font-medium">{deviceName}</span></div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de Début *</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de Fin</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isOpenEnded} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border">
                    <Switch checked={isOpenEnded} onCheckedChange={setIsOpenEnded} />
                    <Label>Durée indéterminée</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tarif *</Label>
                      <Input type="number" step="0.01" value={rentalRate} onChange={(e) => setRentalRate(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cycle *</Label>
                      <Select value={billingCycle} onValueChange={(v: any) => setBillingCycle(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Par jour</SelectItem>
                          <SelectItem value="WEEKLY">Par semaine</SelectItem>
                          <SelectItem value="MONTHLY">Par mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="PAUSED">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border">
                    <Switch checked={cnamEligible} onCheckedChange={setCnamEligible} />
                    <Label>Éligible CNAM</Label>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="space-y-2 text-sm">
                      <div><strong>Patient:</strong> {patientName}</div>
                      <div><strong>Employé:</strong> {employeeName}</div>
                      <div><strong>Appareil:</strong> {deviceName}</div>
                      <div><strong>Tarif:</strong> {parseFloat(rentalRate).toFixed(2)} DT / {billingCycle === 'DAILY' ? 'jour' : billingCycle === 'WEEKLY' ? 'sem' : 'mois'}</div>
                      <div><strong>Début:</strong> {new Date(startDate).toLocaleDateString('fr-FR')}</div>
                      <div><strong>Fin:</strong> {isOpenEnded ? 'Indéterminée' : new Date(endDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <Button variant="outline" onClick={(step === 1 || (hasPreselectedPatient && step === 2)) ? handleClose : handleBack} disabled={isSubmitting}>
              {(step === 1 || (hasPreselectedPatient && step === 2)) ? 'Annuler' : <><ChevronLeft className="h-4 w-4 mr-2" />Retour</>}
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>Suivant<ChevronRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</> : <><CheckCircle className="h-4 w-4 mr-2" />Créer</>}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RentalArticleSelectionDialog
        open={showArticleDialog}
        onClose={() => setShowArticleDialog(false)}
        onDeviceSelect={handleDeviceSelect}
        onAccessoriesSelect={handleAccessoriesSelect}
        selectedDeviceId={medicalDeviceId}
        selectedAccessoryIds={accessories.map(a => a.id)}
      />
    </>
  );
}
