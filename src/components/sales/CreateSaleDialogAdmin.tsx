import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, ChevronRight, ChevronLeft, User, Building2, Search, Phone,
  Plus, X, Package, Calendar, FileText, CreditCard, AlertCircle, Settings, Check, UserCog
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaleArticleSelectionDialog } from './SaleArticleSelectionDialog';
import { SalePaymentDialog } from './SalePaymentDialog';
import { SaleCNAMBonDialog } from './SaleCNAMBonDialog';
import { SaleProductParameterDialog } from './SaleProductParameterDialog';

interface PreselectedPatient {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  patientCode?: string;
  telephone?: string;
}

interface CreateSaleDialogAdminProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatient?: PreselectedPatient;
}

interface Client {
  id: string;
  type: 'PATIENT' | 'COMPANY';
  name: string;
  code?: string;
  telephone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  patientCode?: string;
  companyCode?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface SaleArticle {
  id: string;
  type: 'PRODUCT' | 'MEDICAL_DEVICE' | 'ACCESSORY' | 'SPARE_PART';
  productId?: string;
  medicalDeviceId?: string;
  name: string;
  code?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  itemTotal: number;
  stockLocationId?: string;
  parameters?: any;
}

interface SalePayment {
  id: string;
  method: string;
  amount: number;
  date: string;
  notes?: string;
  chequeNumber?: string;
  bank?: string;
  reference?: string;
  traiteNumber?: string;
  dueDate?: string;
  mandatNumber?: string;
  cnamBonId?: string;
  dossierNumber?: string;
  cnamInfo?: {
    bonType: string;
    bonAmount: number;
    devicePrice: number;
    complementAmount: number;
    currentStep: number;
    totalSteps: number;
    status: string;
    notes?: string;
  };
}

export function CreateSaleDialogAdmin({ open, onOpenChange, preselectedPatient }: CreateSaleDialogAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Determine if we should skip client selection step
  const hasPreselectedPatient = !!preselectedPatient;
  const initialStep = hasPreselectedPatient ? 2 : 1;

  // Create preselected client from preselectedPatient
  const preselectedClient: Client | null = preselectedPatient ? {
    id: preselectedPatient.id,
    type: 'PATIENT' as const,
    name: preselectedPatient.name || `${preselectedPatient.firstName} ${preselectedPatient.lastName}`,
    firstName: preselectedPatient.firstName,
    lastName: preselectedPatient.lastName,
    code: preselectedPatient.patientCode,
    patientCode: preselectedPatient.patientCode,
    telephone: preselectedPatient.telephone
  } : null;

  const [step, setStep] = useState(initialStep);
  const [clientType, setClientType] = useState<'PATIENT' | 'COMPANY'>('PATIENT');
  const [clientSearch, setClientSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(preselectedClient);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [articles, setArticles] = useState<SaleArticle[]>([]);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [saleData, setSaleData] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    discount: 0,
    notes: ''
  });

  // Dialog states
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cnamBonDialogOpen, setCnamBonDialogOpen] = useState(false);
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [currentArticleForConfig, setCurrentArticleForConfig] = useState<SaleArticle | null>(null);

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

  // Fetch companies
  const { data: companiesData, isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      return data.companies || [];
    },
    enabled: open && !!session,
  });

  const patients: Client[] = (patientsData || []).map((p: any) => ({
    id: p.id,
    type: 'PATIENT' as const,
    name: `${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    code: p.patientCode,
    patientCode: p.patientCode,
    telephone: p.telephone
  }));

  const companies: Client[] = (companiesData || []).map((c: any) => ({
    id: c.id,
    type: 'COMPANY' as const,
    name: c.companyName,
    companyName: c.companyName,
    code: c.companyCode,
    companyCode: c.companyCode,
    telephone: c.telephone
  }));

  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : [];

  // Filter clients based on search
  const filteredClients = (clientType === 'PATIENT' ? patients : companies).filter(client => {
    const searchLower = clientSearch.toLowerCase();
    return client.name.toLowerCase().includes(searchLower) ||
           client.code?.toLowerCase().includes(searchLower) ||
           client.telephone?.toLowerCase().includes(searchLower);
  });

  // Filter employees based on search
  const filteredEmployees = employees.filter(employee => {
    const searchLower = employeeSearch.toLowerCase();
    const name = employee.name?.toLowerCase() || '';
    const email = employee.email?.toLowerCase() || '';
    return name.includes(searchLower) || email.includes(searchLower);
  });

  // Calculate totals
  const subtotal = articles.reduce((sum, article) => sum + article.itemTotal, 0);
  const finalAmount = subtotal - saleData.discount;
  const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const remaining = finalAmount - totalPaid;

  // Create sale mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sale');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Succès',
        description: `Vente ${data.sale.saleCode} créée avec succès`
      });
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

  const handleClose = () => {
    setStep(initialStep);
    setClientType('PATIENT');
    setClientSearch('');
    setEmployeeSearch('');
    // Only reset client if no preselected patient
    setSelectedClient(hasPreselectedPatient ? preselectedClient : null);
    setSelectedEmployee(null);
    setArticles([]);
    setPayments([]);
    setSaleData({
      saleDate: new Date().toISOString().split('T')[0],
      discount: 0,
      notes: ''
    });
    onOpenChange(false);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setStep(2); // Advance to employee selection
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setStep(3); // Advance to articles
  };

  const handleNext = () => {
    if (step === 1 && !selectedClient) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un client', variant: 'destructive' });
      return;
    }
    if (step === 2 && !selectedEmployee) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un employé', variant: 'destructive' });
      return;
    }
    if (step === 3 && articles.length === 0) {
      toast({ title: 'Erreur', description: 'Veuillez ajouter au moins un article', variant: 'destructive' });
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

  const handleSubmit = async () => {
    if (!selectedClient || !selectedEmployee || articles.length === 0) {
      toast({ title: 'Erreur', description: 'Données manquantes', variant: 'destructive' });
      return;
    }

    const payload = {
      saleDate: saleData.saleDate,
      status: 'COMPLETED',
      discount: saleData.discount,
      notes: saleData.notes,
      totalAmount: subtotal,
      finalAmount: finalAmount,
      processedById: selectedEmployee.id,
      assignedToId: selectedEmployee.id,
      ...(selectedClient.type === 'PATIENT'
        ? { patientId: selectedClient.id }
        : { companyId: selectedClient.id }
      ),
      items: articles.map(article => ({
        quantity: article.quantity,
        unitPrice: article.unitPrice,
        discount: article.discount,
        itemTotal: article.itemTotal,
        serialNumber: article.serialNumber,
        stockLocationId: article.stockLocationId,
        productId: article.productId || null,
        medicalDeviceId: article.medicalDeviceId || null,
        parameters: article.parameters || null
      })),
      payment: payments.map(payment => ({
        type: payment.method.toLowerCase(),
        amount: payment.amount,
        paymentDate: payment.date,
        classification: 'principale',
        notes: payment.notes,
        chequeNumber: payment.chequeNumber,
        bank: payment.bank,
        reference: payment.reference,
        traiteNumber: payment.traiteNumber,
        dueDate: payment.dueDate,
        mondatNumber: payment.mandatNumber,
        dossierNumber: payment.dossierNumber,
        cnamInfo: payment.cnamInfo
      }))
    };

    await createMutation.mutateAsync(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900">Nouvelle Vente</h2>
              <p className="text-sm text-blue-700">
                {step === 1 ? 'Choisissez un patient ou une société' :
                 step === 2 ? 'Assignez à un employé' :
                 step === 3 ? `Articles pour ${selectedClient?.name || ''}` :
                 step === 4 ? 'Optionnel - peut être ajouté plus tard' :
                 'Vérifiez et confirmez la vente'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Steps */}
          <div className="w-64 border-r bg-gray-50 p-4 space-y-2">
            {/* Step 1: Client */}
            <div className={`p-3 rounded-lg ${step === 1 ? 'bg-blue-600 text-white' : (step > 1 || hasPreselectedPatient) ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-700' : (step > 1 || hasPreselectedPatient) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {(step > 1 || hasPreselectedPatient) ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Client</div>
                  {(step > 1 || hasPreselectedPatient) && selectedClient && (
                    <div className="text-xs truncate">{selectedClient.name}</div>
                  )}
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
                  {step > 2 && selectedEmployee && (
                    <div className="text-xs truncate">{selectedEmployee.name}</div>
                  )}
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
                  {step > 3 && <div className="text-xs">{articles.length} article{articles.length > 1 ? 's' : ''}</div>}
                </div>
              </div>
            </div>

            {/* Step 4: Payments */}
            <div className={`p-3 rounded-lg ${step === 4 ? 'bg-blue-600 text-white' : step > 4 ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-400'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 4 ? 'bg-blue-700' : step > 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {step > 4 ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Paiements</div>
                </div>
              </div>
            </div>

            {/* Step 5: Finalize */}
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
            {/* Step 1: Client Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <Tabs value={clientType} onValueChange={(val) => setClientType(val as 'PATIENT' | 'COMPANY')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="PATIENT"><User className="h-4 w-4 mr-2" />Patients</TabsTrigger>
                    <TabsTrigger value="COMPANY"><Building2 className="h-4 w-4 mr-2" />Sociétés</TabsTrigger>
                  </TabsList>
                  <TabsContent value="PATIENT" className="mt-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-8" />
                    </div>
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="p-2 space-y-1">
                        {loadingPatients ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Chargement...</div>
                        ) : filteredClients.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Aucun patient</div>
                        ) : (
                          filteredClients.map((client) => (
                            <Button key={client.id} variant="ghost" className="w-full justify-start h-auto py-3 hover:bg-blue-50" onClick={() => handleClientSelect(client)}>
                              <div className="flex flex-col items-start w-full">
                                <div className="flex items-center gap-2 w-full">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{client.name}</span>
                                  {client.code && <Badge variant="outline" className="text-xs ml-auto">{client.code}</Badge>}
                                </div>
                                {client.telephone && <span className="text-xs text-muted-foreground ml-6">{client.telephone}</span>}
                              </div>
                            </Button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="COMPANY" className="mt-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-8" />
                    </div>
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="p-2 space-y-1">
                        {loadingCompanies ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Chargement...</div>
                        ) : filteredClients.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Aucune société</div>
                        ) : (
                          filteredClients.map((client) => (
                            <Button key={client.id} variant="ghost" className="w-full justify-start h-auto py-3 hover:bg-purple-50" onClick={() => handleClientSelect(client)}>
                              <div className="flex flex-col items-start w-full">
                                <div className="flex items-center gap-2 w-full">
                                  <Building2 className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium">{client.name}</span>
                                  {client.code && <Badge variant="outline" className="text-xs ml-auto">{client.code}</Badge>}
                                </div>
                                {client.telephone && <span className="text-xs text-muted-foreground ml-6">{client.telephone}</span>}
                              </div>
                            </Button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 2: Employee Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedClient?.type === 'PATIENT' ? <User className="h-4 w-4 text-blue-600" /> : <Building2 className="h-4 w-4 text-blue-600" />}
                    <span className="font-medium">Client:</span>
                    <span className="text-blue-700">{selectedClient?.name}</span>
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

            {/* Steps 3, 4, 5: Same as employee but with blue theme - Simplified for brevity */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{selectedClient?.name}</span>
                    <span className="text-gray-500">→</span>
                    <UserCog className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{selectedEmployee?.name}</span>
                  </div>
                </div>

                {/* Info for patient vs company */}
                {selectedClient?.type === 'PATIENT' && (
                  <div className="flex items-center gap-2 p-2 rounded text-xs bg-blue-50 text-blue-800">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>Appareils: 1 max avec config | Produits: multiples</span>
                  </div>
                )}

                <Button onClick={() => setArticleDialogOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />Ajouter un Article
                </Button>
                {articles.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Aucun article</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-2">Article</th>
                          <th className="text-center p-2 w-20">Qté</th>
                          <th className="text-right p-2 w-24">Prix</th>
                          <th className="text-right p-2 w-28">Total</th>
                          <th className="w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {articles.map((article, index) => (
                          <tr key={article.id} className="hover:bg-gray-50">
                            <td className="p-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {article.code || `#${index + 1}`}
                                  </Badge>
                                  <span className="font-medium">{article.name}</span>
                                </div>
                                {article.serialNumber && (
                                  <span className="text-xs text-gray-500 font-mono">SN: {article.serialNumber}</span>
                                )}
                                <div className="flex gap-1 flex-wrap">
                                  {article.parameters && (
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">Configuré</Badge>
                                  )}
                                  {selectedClient?.type === 'PATIENT' && article.type === 'MEDICAL_DEVICE' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setCurrentArticleForConfig(article);
                                        setParameterDialogOpen(true);
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      {article.parameters ? 'Modifier' : 'Configurer'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-center">{article.quantity}</td>
                            <td className="p-2 text-right">{article.unitPrice.toFixed(2)}</td>
                            <td className="p-2 text-right font-bold text-blue-600">{article.itemTotal.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <Button variant="ghost" size="sm" onClick={() => setArticles(articles.filter(a => a.id !== article.id))} className="h-8 w-8 p-0 text-red-600">
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 font-bold">
                        <tr>
                          <td colSpan={3} className="p-2 text-right">Sous-total:</td>
                          <td className="p-2 text-right text-blue-600 text-lg">{subtotal.toFixed(2)} DT</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-sm text-gray-600">Total</p><p className="text-xl font-bold">{finalAmount.toFixed(2)} DT</p></div>
                  <div><p className="text-sm text-gray-600">Payé</p><p className="text-xl font-bold text-green-600">{totalPaid.toFixed(2)} DT</p></div>
                  <div><p className="text-sm text-gray-600">Reste</p><p className="text-xl font-bold text-red-600">{remaining.toFixed(2)} DT</p></div>
                </div>
                <Button onClick={() => setPaymentDialogOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />Ajouter un Paiement
                </Button>
                <Button variant="outline" onClick={handleNext} className="w-full">Passer cette étape<ChevronRight className="h-4 w-4 ml-2" /></Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                {/* Client & Employee Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Client</div>
                    <div className="font-medium flex items-center gap-2">
                      {selectedClient?.type === 'PATIENT' ? <User className="h-4 w-4 text-blue-600" /> : <Building2 className="h-4 w-4 text-purple-600" />}
                      {selectedClient?.name}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Employé</div>
                    <div className="font-medium flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-600" />
                      {selectedEmployee?.name}
                    </div>
                  </div>
                </div>

                {/* Articles Summary with Parameters */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Articles ({articles.length})
                  </h3>
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {articles.map((article, index) => (
                      <div key={article.id} className="p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{article.code || `#${index + 1}`}</Badge>
                            <span className="text-sm font-medium">{article.name}</span>
                            {article.serialNumber && <span className="text-xs text-gray-500 font-mono">SN: {article.serialNumber}</span>}
                          </div>
                          <span className="text-sm font-bold text-blue-600">{article.itemTotal.toFixed(2)} DT</span>
                        </div>
                        {/* Device Parameters */}
                        {article.parameters && Object.keys(article.parameters).length > 0 && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Settings className="h-3 w-3 text-purple-600" />
                              <span className="font-medium text-purple-800">Configuration {article.parameters.deviceType || 'Appareil'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                              {article.parameters.pression && <div>Pression: <span className="font-medium">{article.parameters.pression} cmH2O</span></div>}
                              {article.parameters.pressionRampe && <div>P. Rampe: <span className="font-medium">{article.parameters.pressionRampe} cmH2O</span></div>}
                              {article.parameters.dureeRampe && <div>Durée Rampe: <span className="font-medium">{article.parameters.dureeRampe} min</span></div>}
                              {article.parameters.epr && <div>EPR: <span className="font-medium">Niveau {article.parameters.epr}</span></div>}
                              {article.parameters.autoPression && <div>Auto-Pression: <span className="font-medium text-green-600">Oui</span></div>}
                              {article.parameters.autoRampe && <div>Auto-Rampe: <span className="font-medium text-green-600">Oui</span></div>}
                              {article.parameters.ipap && <div>IPAP: <span className="font-medium">{article.parameters.ipap} cmH2O</span></div>}
                              {article.parameters.epap && <div>EPAP: <span className="font-medium">{article.parameters.epap} cmH2O</span></div>}
                              {article.parameters.aid && <div>AI/D: <span className="font-medium">{article.parameters.aid}</span></div>}
                              {article.parameters.mode && <div>Mode: <span className="font-medium">{article.parameters.mode}</span></div>}
                              {article.parameters.frequenceRespiratoire && <div>Fréq. Resp.: <span className="font-medium">{article.parameters.frequenceRespiratoire}/min</span></div>}
                              {article.parameters.volumeCourant && <div>Vol. Courant: <span className="font-medium">{article.parameters.volumeCourant} mL</span></div>}
                              {article.parameters.debit && <div>Débit O2: <span className="font-medium">{article.parameters.debit} L/min</span></div>}
                            </div>
                            {article.parameters.notes && (
                              <div className="mt-1 pt-1 border-t border-purple-200 text-gray-600">
                                <span className="font-medium">Notes:</span> {article.parameters.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sale Details Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de vente</label>
                    <Input type="date" value={saleData.saleDate} onChange={(e) => setSaleData({ ...saleData, saleDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Remise (DT)</label>
                    <Input type="number" step="0.01" value={saleData.discount} onChange={(e) => setSaleData({ ...saleData, discount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea value={saleData.notes} onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })} rows={2} />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <h3 className="font-bold text-center mb-4">Résumé Financier</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Sous-total:</span><span className="font-bold">{subtotal.toFixed(2)} DT</span></div>
                    <div className="flex justify-between"><span>Remise:</span><span className="font-bold text-orange-600">-{saleData.discount.toFixed(2)} DT</span></div>
                    <div className="border-t-2 pt-2 flex justify-between"><span className="text-lg font-bold">Total:</span><span className="text-2xl font-bold text-blue-600">{finalAmount.toFixed(2)} DT</span></div>
                    <div className="flex justify-between"><span>Payé:</span><span className="font-bold text-green-600">{totalPaid.toFixed(2)} DT</span></div>
                    {remaining > 0 && (
                      <div className="flex justify-between border-t pt-2"><span className="font-bold">Reste:</span><span className="font-bold text-red-600">{remaining.toFixed(2)} DT</span></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={(step === 1 || (hasPreselectedPatient && step === 2)) ? handleClose : handleBack}>
            {(step === 1 || (hasPreselectedPatient && step === 2)) ? 'Annuler' : <><ChevronLeft className="h-4 w-4 mr-2" />Retour</>}
          </Button>
          {step < 5 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">Suivant<ChevronRight className="h-4 w-4 ml-2" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {createMutation.isPending ? 'Création...' : 'Créer la Vente'}
            </Button>
          )}
        </div>

        {/* Sub-dialogs */}
        <SaleArticleSelectionDialog
          open={articleDialogOpen}
          onOpenChange={setArticleDialogOpen}
          clientType={selectedClient?.type || 'PATIENT'}
          existingArticles={articles}
          onArticlesSelected={(newArticles) => {
            setArticles([...articles, ...newArticles]);
            toast({ title: 'Succès', description: `${newArticles.length} article${newArticles.length > 1 ? 's' : ''} ajouté${newArticles.length > 1 ? 's' : ''}` });
          }}
        />
        <SalePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clientType={selectedClient?.type || 'PATIENT'}
          remainingAmount={remaining}
          onPaymentAdded={(payment) => {
            setPayments([...payments, payment]);
            toast({ title: 'Succès', description: 'Paiement ajouté' });
          }}
          onCNAMSelected={() => setCnamBonDialogOpen(true)}
        />
        {selectedClient?.type === 'PATIENT' && (
          <SaleCNAMBonDialog
            open={cnamBonDialogOpen}
            onOpenChange={setCnamBonDialogOpen}
            saleAmount={finalAmount}
            onCNAMBonCreated={(cnamBon, cnamPayment) => {
              setPayments([...payments, cnamPayment]);
              toast({ title: 'Succès', description: `Bon CNAM créé` });
            }}
          />
        )}
        {currentArticleForConfig && (
          <SaleProductParameterDialog
            open={parameterDialogOpen}
            onOpenChange={setParameterDialogOpen}
            article={currentArticleForConfig}
            onParametersSaved={(articleId, parameters) => {
              setArticles(articles.map(a => a.id === articleId ? { ...a, parameters } : a));
              toast({ title: 'Succès', description: 'Configuration enregistrée' });
              setCurrentArticleForConfig(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
