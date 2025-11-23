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
  X
} from 'lucide-react';

interface RentalCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (rentalId: string) => void;
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

export function RentalCreationDialog({ open, onOpenChange, onSuccess }: RentalCreationDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Step state
  const [step, setStep] = useState(1);

  // Form state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientCode, setPatientCode] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
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
  const totalSteps = 4; // Patient → Articles → Configuration → Review

  // Fetch patients (only assigned to employee)
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", "assignedToMe"],
    queryFn: async () => {
      const response = await fetch("/api/renseignements/patients?assignedToMe=true");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return data.patients || [];
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

  // Filter patients based on search
  const filteredPatients = patients.filter((patient: any) => {
    const searchLower = patientSearch.toLowerCase();
    return patient.name.toLowerCase().includes(searchLower) ||
           patient.code?.toLowerCase().includes(searchLower) ||
           patient.telephone?.toLowerCase().includes(searchLower);
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
    setStep(1);
    setPatientSearch('');
    setPatientId('');
    setPatientName('');
    setPatientCode('');
    setPatientPhone('');
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
    // Auto-advance
    setTimeout(() => setStep(2), 300);
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
    // Validate current step before proceeding
    if (step === 1 && !patientId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un patient',
        variant: 'destructive'
      });
      return;
    }
    if (step === 2 && !medicalDeviceId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un appareil médical',
        variant: 'destructive'
      });
      return;
    }
    if (step === 3 && (!startDate || !rentalRate || parseFloat(rentalRate) <= 0)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive'
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    // Final validation
    if (!patientId || !medicalDeviceId || !startDate || !rentalRate || parseFloat(rentalRate) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    // Build request data
    const rentalData = {
      patientId,
      medicalDeviceId,
      startDate,
      endDate: isOpenEnded ? null : (endDate || null),
      status,
      createdById: session?.user?.id,
      assignedToId: session?.user?.id,
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

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Choisissez le patient pour cette location';
      case 2: return `Sélectionnez l'appareil et les accessoires pour ${patientName || 'le patient'}`;
      case 3: return 'Configurez les détails de la location';
      case 4: return 'Vérifiez et confirmez la location';
      default: return '';
    }
  };

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
          <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-900">Nouvelle Location</h2>
                <p className="text-sm text-green-700">{getStepDescription()}</p>
              </div>
            </div>
          </div>

          {/* Main Content - Sidebar + Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Steps Navigation */}
            <div className="w-64 border-r bg-gray-50 p-4 space-y-2">
              {/* Step 1 - Patient */}
              <button
                onClick={() => {
                  if (step > 1) setStep(1);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                  step === 1
                    ? 'bg-green-600 text-white shadow-md'
                    : step > 1
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-400 cursor-not-allowed'
                }`}
                disabled={step === 1}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step === 1 ? 'bg-green-700' : step > 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 1 ? <Check className="h-4 w-4 text-white" /> : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium">Patient</div>
                  {step === 1 && <div className="text-xs opacity-90">En cours</div>}
                  {step > 1 && patientName && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-medium truncate">{patientName}</div>
                      {patientCode && (
                        <div className="text-xs opacity-75 truncate">{patientCode}</div>
                      )}
                      {patientPhone && (
                        <div className="text-xs opacity-75 truncate flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patientPhone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Step 2 - Articles (Device + Accessories) */}
              <button
                onClick={() => {
                  if (patientId && (step > 2 || step === 3 || step === 4)) {
                    setStep(2);
                  }
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                  step === 2
                    ? 'bg-green-600 text-white shadow-md'
                    : step > 2
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-400 cursor-not-allowed'
                }`}
                disabled={!patientId || step < 2}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step === 2 ? 'bg-green-700' : step > 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 2 ? <Check className="h-4 w-4 text-white" /> : <Package className="h-4 w-4" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium">Articles</div>
                  {step === 2 && <div className="text-xs opacity-90">En cours</div>}
                  {step > 2 && (deviceName || accessories.length > 0) && (
                    <div className="mt-1 space-y-0.5">
                      {deviceName && (
                        <div className="text-xs font-medium truncate flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {deviceName}
                        </div>
                      )}
                      {accessories.length > 0 && (
                        <div className="text-xs opacity-75">
                          + {accessories.length} accessoire{accessories.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Step 3 - Configuration */}
              <button
                onClick={() => {
                  if (medicalDeviceId && (step > 3 || step === 4)) {
                    setStep(3);
                  }
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                  step === 3
                    ? 'bg-green-600 text-white shadow-md'
                    : step > 3
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-400 cursor-not-allowed'
                }`}
                disabled={!medicalDeviceId || step < 3}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step === 3 ? 'bg-green-700' : step > 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 3 ? <Check className="h-4 w-4 text-white" /> : <Settings className="h-4 w-4" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium">Configuration</div>
                  {step === 3 && <div className="text-xs opacity-90">En cours</div>}
                  {step > 3 && rentalRate && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-medium">
                        {parseFloat(rentalRate).toFixed(2)} DT/{
                          billingCycle === 'DAILY' ? 'jour' :
                          billingCycle === 'WEEKLY' ? 'sem' : 'mois'
                        }
                      </div>
                      <div className="text-xs opacity-75">
                        {isOpenEnded ? 'Durée indéterminée' : `Jusqu'au ${endDate}`}
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* Step 4 - Review */}
              <button
                onClick={() => {
                  // Can't go back to step 4, only forward
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                  step === 4
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-400 cursor-not-allowed'
                }`}
                disabled={step !== 4}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step === 4 ? 'bg-green-700' : 'bg-gray-200'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium">Finaliser</div>
                  {step === 4 && (
                    <div className="mt-1">
                      <div className="text-xs opacity-90">Vérification finale</div>
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {step === 1 && (
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Sélection du Patient</h3>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, code, ou téléphone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  {/* Patient List */}
                  <ScrollArea className="flex-1 rounded-md border">
                    <div className="p-2 space-y-1">
                      {loadingPatients ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Chargement des patients...
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucun patient trouvé
                        </div>
                      ) : (
                        filteredPatients.map((patient: any) => (
                          <Button
                            key={patient.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-3 px-3 hover:bg-green-50"
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 w-full">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{patient.name}</span>
                                {patient.code && (
                                  <Badge variant="outline" className="text-xs ml-auto bg-blue-50 text-blue-700">
                                    {patient.code}
                                  </Badge>
                                )}
                              </div>
                              {patient.telephone && (
                                <span className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.telephone}
                                </span>
                              )}
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Sélection des Articles</h3>
                  </div>

                  {/* Patient Summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{patientName}</span>
                      {patientCode && (
                        <Badge variant="outline" className="text-xs">{patientCode}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Big Selection Button */}
                  <Button
                    onClick={() => setShowArticleDialog(true)}
                    className="w-full h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold shadow-lg"
                    size="lg"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Package className="h-6 w-6" />
                      <span>Sélectionner Appareil & Accessoires</span>
                    </div>
                  </Button>

                  {/* Selected Device */}
                  {medicalDeviceId && (
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-blue-900">Appareil Médical Sélectionné</span>
                          </div>
                          <div className="ml-7">
                            <p className="font-medium text-gray-900">{deviceName}</p>
                            {deviceCode && (
                              <p className="text-sm text-gray-600">Code: {deviceCode}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMedicalDeviceId('');
                            setDeviceName('');
                            setDeviceCode('');
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Selected Accessories */}
                  {accessories.length > 0 && (
                    <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold text-orange-900">
                            Accessoires Sélectionnés ({accessories.length})
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {accessories.map((acc) => (
                          <div key={acc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{acc.name}</p>
                              {acc.code && (
                                <p className="text-xs text-gray-500">Code: {acc.code}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min="1"
                                value={acc.quantity}
                                onChange={(e) => updateAccessoryQuantity(acc.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8"
                              />
                              <span className="text-sm text-gray-600">×</span>
                              <span className="text-sm font-medium w-20 text-right">
                                {acc.unitPrice.toFixed(2)} DT
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAccessory(acc.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Total Accessoires:</span>
                          <span className="text-lg font-bold text-orange-700">
                            {accessories.reduce((sum, acc) => sum + acc.totalPrice, 0).toFixed(2)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!medicalDeviceId && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <AlertCircle className="inline h-4 w-4 mr-1" />
                        Vous devez sélectionner au moins un appareil médical pour continuer
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Configuration de la Location</h3>
                  </div>

                  {/* Compact Summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{patientName}</span>
                      <span className="text-gray-400">•</span>
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{deviceName}</span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-1">
                        Date de Début <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de Fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isSubmitting || isOpenEnded}
                        placeholder={isOpenEnded ? "Ouvert" : ""}
                      />
                    </div>
                  </div>

                  {/* Open Ended Toggle */}
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border">
                    <Switch
                      id="openEnded"
                      checked={isOpenEnded}
                      onCheckedChange={(checked) => {
                        setIsOpenEnded(checked);
                        if (checked) setEndDate('');
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="openEnded" className="cursor-pointer font-medium">
                      Location à durée indéterminée
                    </Label>
                  </div>

                  {/* Rental Rate and Billing Cycle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rentalRate" className="flex items-center gap-1">
                        Tarif de Location <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="rentalRate"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={rentalRate}
                          onChange={(e) => setRentalRate(e.target.value)}
                          disabled={isSubmitting}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          DT
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingCycle" className="flex items-center gap-1">
                        Cycle de Facturation <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={billingCycle}
                        onValueChange={(value: 'DAILY' | 'MONTHLY' | 'WEEKLY') => setBillingCycle(value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="billingCycle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Par jour</SelectItem>
                          <SelectItem value="WEEKLY">Par semaine</SelectItem>
                          <SelectItem value="MONTHLY">Par mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut Initial</Label>
                    <Select
                      value={status}
                      onValueChange={(value: 'PENDING' | 'ACTIVE' | 'PAUSED') => setStatus(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="PAUSED">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CNAM Eligible */}
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border">
                    <Switch
                      id="cnamEligible"
                      checked={cnamEligible}
                      onCheckedChange={setCnamEligible}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <Label htmlFor="cnamEligible" className="cursor-pointer font-medium">
                        Éligible CNAM
                      </Label>
                      <p className="text-xs text-gray-500">
                        Le patient peut bénéficier du remboursement CNAM
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Récapitulatif de la Location</h3>
                  </div>

                  {/* Patient Summary */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      Patient
                    </h3>
                    <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{patientName}</span>
                          {patientCode && (
                            <Badge variant="outline" className="text-xs">
                              {patientCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device Summary */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      Appareil Médical
                    </h3>
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{deviceName}</span>
                          {deviceCode && (
                            <Badge variant="outline" className="text-xs">
                              {deviceCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Date de Début</p>
                        <p className="font-medium">{new Date(startDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date de Fin</p>
                        <p className="font-medium">
                          {isOpenEnded ? 'Indéterminée' : new Date(endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tarif</p>
                        <p className="font-medium text-green-700">
                          {parseFloat(rentalRate).toFixed(2)} DT / {
                            billingCycle === 'DAILY' ? 'jour' :
                            billingCycle === 'WEEKLY' ? 'semaine' : 'mois'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Statut</p>
                        <Badge>
                          {status === 'PENDING' ? 'En attente' :
                           status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">CNAM</p>
                        <Badge variant={cnamEligible ? "default" : "outline"}>
                          {cnamEligible ? 'Éligible' : 'Non éligible'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Accessories Summary */}
                  {accessories.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        Accessoires ({accessories.length})
                      </h3>
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {accessories.map((acc) => (
                          <div key={acc.id} className="p-3 bg-white hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {acc.code}
                                </Badge>
                                <span className="text-sm font-medium">{acc.name} × {acc.quantity}</span>
                              </div>
                              <span className="text-sm font-bold text-green-600">
                                {acc.totalPrice.toFixed(2)} DT
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="p-3 bg-gray-50 flex justify-between font-semibold">
                          <span>Total:</span>
                          <span className="text-green-700">
                            {accessories.reduce((sum, acc) => sum + acc.totalPrice, 0).toFixed(2)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Cette location sera automatiquement assignée à vous.
                      Le code de location sera généré automatiquement après la création.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
              disabled={isSubmitting}
            >
              {step === 1 ? (
                'Annuler'
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour
                </>
              )}
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Créer la Location
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rental Article Selection Dialog */}
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
