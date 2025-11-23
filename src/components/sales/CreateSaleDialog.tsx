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
  Plus, X, Package, Calendar, FileText, CreditCard, AlertCircle, Settings, Check
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

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

interface SaleArticle {
  id: string; // Temporary ID for UI
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
  parameters?: any; // Device configuration (only for patient devices)
}

interface SalePayment {
  id: string; // Temporary ID for UI
  method: string;
  amount: number;
  date: string;
  notes?: string;
  // Method-specific fields
  chequeNumber?: string;
  bank?: string;
  reference?: string;
  traiteNumber?: string;
  dueDate?: string;
  mandatNumber?: string;
  // CNAM fields
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

export function CreateSaleDialog({ open, onOpenChange }: CreateSaleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [clientType, setClientType] = useState<'PATIENT' | 'COMPANY'>('PATIENT');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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

  // Filter clients based on search
  const filteredClients = (clientType === 'PATIENT' ? patients : companies).filter(client => {
    const searchLower = clientSearch.toLowerCase();
    return client.name.toLowerCase().includes(searchLower) ||
           client.code?.toLowerCase().includes(searchLower) ||
           client.telephone?.toLowerCase().includes(searchLower);
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
    setStep(1);
    setClientType('PATIENT');
    setClientSearch('');
    setSelectedClient(null);
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
    setStep(2); // Auto-advance to articles
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (step === 1 && !selectedClient) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive'
      });
      return;
    }
    if (step === 2 && articles.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un article',
        variant: 'destructive'
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast({ title: 'Erreur', description: 'Client requis', variant: 'destructive' });
      return;
    }
    if (articles.length === 0) {
      toast({ title: 'Erreur', description: 'Au moins un article requis', variant: 'destructive' });
      return;
    }

    const payload = {
      saleDate: saleData.saleDate,
      status: 'COMPLETED',
      discount: saleData.discount,
      notes: saleData.notes,
      totalAmount: subtotal,
      finalAmount: finalAmount,
      processedById: session?.user?.id,
      assignedToId: session?.user?.id,
      // Client
      ...(selectedClient.type === 'PATIENT'
        ? { patientId: selectedClient.id }
        : { companyId: selectedClient.id }
      ),
      // Articles
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
      // Payments
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
        cnamInfo: payment.cnamInfo // Include CNAM bon details
      }))
    };

    await createMutation.mutateAsync(payload);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Sélectionner le Client';
      case 2: return 'Ajouter des Articles';
      case 3: return 'Ajouter des Paiements';
      case 4: return 'Finaliser la Vente';
      default: return 'Nouvelle Vente';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Choisissez un patient ou une société';
      case 2: return `Articles pour ${selectedClient?.name || ''}`;
      case 3: return 'Optionnel - peut être ajouté plus tard';
      case 4: return 'Vérifiez et confirmez la vente';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header - Compact */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-900">Nouvelle Vente</h2>
              <p className="text-sm text-green-700">{getStepDescription()}</p>
            </div>
          </div>
        </div>

        {/* Main Content - Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Steps Navigation */}
          <div className="w-64 border-r bg-gray-50 p-4 space-y-2">
            {/* Step 1 - Client */}
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
                <div className="text-sm font-medium">Client</div>
                {step === 1 && <div className="text-xs opacity-90">En cours</div>}
                {step > 1 && selectedClient && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-xs font-medium truncate">{selectedClient.name}</div>
                    {selectedClient.code && (
                      <div className="text-xs opacity-75 truncate">{selectedClient.code}</div>
                    )}
                    {selectedClient.telephone && (
                      <div className="text-xs opacity-75 truncate flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedClient.telephone}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Step 2 - Articles */}
            <button
              onClick={() => {
                if (selectedClient && (step > 2 || (step === 3 && articles.length > 0))) {
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
              disabled={!selectedClient || step < 2}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step === 2 ? 'bg-green-700' : step > 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <Check className="h-4 w-4 text-white" /> : <Package className="h-4 w-4" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium">Articles</div>
                {step === 2 && <div className="text-xs opacity-90">En cours</div>}
                {step > 2 && articles.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="text-xs font-medium">{articles.length} article{articles.length > 1 ? 's' : ''}</div>
                    {articles.slice(0, 2).map((article, idx) => (
                      <div key={idx} className="text-xs opacity-75 truncate">
                        {article.code || article.name}
                        {article.serialNumber && ` • ${article.serialNumber}`}
                      </div>
                    ))}
                    {articles.length > 2 && (
                      <div className="text-xs opacity-75">+{articles.length - 2} autre{articles.length - 2 > 1 ? 's' : ''}</div>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Step 3 - Paiements */}
            <button
              onClick={() => {
                if (articles.length > 0 && (step > 3 || step === 4)) {
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
              disabled={articles.length === 0 || step < 3}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step === 3 ? 'bg-green-700' : step > 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 3 ? <Check className="h-4 w-4 text-white" /> : <CreditCard className="h-4 w-4" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium">Paiements</div>
                {step === 3 && <div className="text-xs opacity-90">En cours</div>}
                {step >= 3 && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-xs font-medium">Total: {finalAmount.toFixed(2)} DT</div>
                    <div className="text-xs opacity-75">Payé: {totalPaid.toFixed(2)} DT</div>
                    {remaining > 0 && (
                      <div className="text-xs font-medium">Reste: {remaining.toFixed(2)} DT</div>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Step 4 - Finaliser */}
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
                <FileText className="h-4 w-4" />
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
              {/* Client Type Tabs */}
              <Tabs value={clientType} onValueChange={(val) => setClientType(val as 'PATIENT' | 'COMPANY')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="PATIENT" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patients
                  </TabsTrigger>
                  <TabsTrigger value="COMPANY" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Sociétés
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="PATIENT" className="mt-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, code, ou téléphone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  {/* Patient List */}
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {loadingPatients ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Chargement des patients...
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucun patient trouvé
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <Button
                            key={client.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-3 px-3 hover:bg-green-50"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 w-full">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{client.name}</span>
                                {client.code && (
                                  <Badge variant="outline" className="text-xs ml-auto bg-blue-50 text-blue-700">
                                    {client.code}
                                  </Badge>
                                )}
                              </div>
                              {client.telephone && (
                                <span className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.telephone}
                                </span>
                              )}
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="COMPANY" className="mt-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, code, ou téléphone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  {/* Company List */}
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {loadingCompanies ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Chargement des sociétés...
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucune société trouvée
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <Button
                            key={client.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-3 px-3 hover:bg-purple-50"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 w-full">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">{client.name}</span>
                                {client.code && (
                                  <Badge variant="outline" className="text-xs ml-auto bg-purple-50 text-purple-700">
                                    {client.code}
                                  </Badge>
                                )}
                              </div>
                              {client.telephone && (
                                <span className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.telephone}
                                </span>
                              )}
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

          {step === 2 && (
            <div className="space-y-4">
              {/* Compact Client Summary */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                selectedClient?.type === 'PATIENT' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  {selectedClient?.type === 'PATIENT' ? (
                    <User className="h-4 w-4 text-green-600" />
                  ) : (
                    <Building2 className="h-4 w-4 text-purple-600" />
                  )}
                  <span className="font-semibold">{selectedClient?.name}</span>
                  {selectedClient?.code && (
                    <Badge variant="outline" className="text-xs">{selectedClient.code}</Badge>
                  )}
                </div>
                <Badge className={`text-xs ${
                  selectedClient?.type === 'PATIENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedClient?.type === 'PATIENT' ? 'Patient' : 'Société'}
                </Badge>
              </div>

              {/* Compact Info */}
              <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                selectedClient?.type === 'PATIENT' ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'
              }`}>
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>
                  {selectedClient?.type === 'PATIENT'
                    ? 'Appareils: 1 max avec config | Produits: multiples'
                    : 'Appareils: multiples sans config | Produits: multiples'}
                </span>
              </div>

              {/* Add Article Button - Compact */}
              <Button
                onClick={() => setArticleDialogOpen(true)}
                className="w-full bg-green-600 hover:bg-green-700 h-9"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Article
              </Button>

              {/* Articles Table - Compact */}
              {articles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Package className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucun article</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-medium">Article</th>
                        <th className="text-center p-2 font-medium w-20">Qté</th>
                        <th className="text-right p-2 font-medium w-24">Prix U.</th>
                        <th className="text-right p-2 font-medium w-24">Remise</th>
                        <th className="text-right p-2 font-medium w-28">Total</th>
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
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">Configuré</Badge>
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
                          <td className="p-2 text-center font-medium">{article.quantity}</td>
                          <td className="p-2 text-right">{article.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right text-orange-600">
                            {article.discount > 0 ? `-${article.discount.toFixed(2)}` : '0'}
                          </td>
                          <td className="p-2 text-right font-bold text-green-600">
                            {article.itemTotal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setArticles(articles.filter(a => a.id !== article.id))}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 font-bold">
                      <tr>
                        <td colSpan={4} className="p-2 text-right">Sous-total ({articles.length} article{articles.length > 1 ? 's' : ''}):</td>
                        <td className="p-2 text-right text-green-600 text-lg">{subtotal.toFixed(2)} DT</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Payment Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Montant Total</p>
                    <p className="text-2xl font-bold text-gray-900">{finalAmount.toFixed(2)} DT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Payé</p>
                    <p className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} DT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reste à Payer</p>
                    <p className={`text-2xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining.toFixed(2)} DT
                    </p>
                  </div>
                </div>
              </div>

              {/* CNAM Info for Patients */}
              {selectedClient?.type === 'PATIENT' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Paiement CNAM disponible pour les patients</p>
                    <p>Le paiement CNAM créera automatiquement un bon CNAM lié à cette vente</p>
                  </div>
                </div>
              )}

              {/* Add Payment Button */}
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Paiement
              </Button>

              {/* Skip Payments Option */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Les paiements sont optionnels et peuvent être ajoutés plus tard
                </p>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="text-gray-600"
                >
                  Passer cette étape
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Payments List */}
              {payments.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Paiements ajoutés ({payments.length})</h3>
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs ${
                              payment.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                              payment.method === 'CHEQUE' ? 'bg-blue-100 text-blue-800' :
                              payment.method === 'CNAM' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.method}
                            </Badge>
                            <span className="font-bold text-green-600">{payment.amount.toFixed(2)} DT</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>Date: {new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                            {payment.notes && (
                              <span className="ml-4">• {payment.notes}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPayments(payments.filter(p => p.id !== payment.id))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-medium">Aucun paiement ajouté</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Vous pouvez ajouter des paiements maintenant ou plus tard
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {/* Client Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  {selectedClient?.type === 'PATIENT' ? (
                    <User className="h-4 w-4 text-green-600" />
                  ) : (
                    <Building2 className="h-4 w-4 text-purple-600" />
                  )}
                  Client
                </h3>
                <div className={`border rounded-lg p-4 ${
                  selectedClient?.type === 'PATIENT' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedClient?.name}</span>
                      {selectedClient?.code && (
                        <Badge variant="outline" className="text-xs">
                          {selectedClient.code}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${
                      selectedClient?.type === 'PATIENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedClient?.type === 'PATIENT' ? 'Patient' : 'Société'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Articles Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Articles ({articles.length})
                </h3>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {articles.map((article, index) => (
                    <div key={article.id} className="p-3 bg-white hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {article.code || `#${index + 1}`}
                          </Badge>
                          <span className="text-sm font-medium">{article.name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {article.itemTotal.toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Paiements ({payments.length})
                </h3>
                {payments.length === 0 ? (
                  <div className="border rounded-lg p-4 bg-gray-50 text-center">
                    <p className="text-sm text-gray-500">Aucun paiement ajouté - à compléter ultérieurement</p>
                  </div>
                ) : (
                  <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-3 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${
                            payment.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                            payment.method === 'CHEQUE' ? 'bg-blue-100 text-blue-800' :
                            payment.method === 'CNAM' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.method}
                          </Badge>
                          <span className="text-sm font-bold text-green-600">
                            {payment.amount.toFixed(2)} DT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sale Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                {/* Sale Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Date de vente <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={saleData.saleDate}
                    onChange={(e) => setSaleData({ ...saleData, saleDate: e.target.value })}
                  />
                </div>

                {/* Assigned To (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    Assigné à
                  </label>
                  <Input
                    value={session?.user?.name || 'Utilisateur actuel'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Remise globale (DT)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={subtotal}
                    value={saleData.discount}
                    onChange={(e) => setSaleData({ ...saleData, discount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Notes
                  </label>
                  <Textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Final Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-center">Résumé de la Vente</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Sous-total:</span>
                    <span className="font-bold text-gray-900">{subtotal.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Remise:</span>
                    <span className="font-bold text-orange-600">-{saleData.discount.toFixed(2)} DT</span>
                  </div>
                  <div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Montant Final:</span>
                    <span className="text-2xl font-bold text-green-600">{finalAmount.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Payé:</span>
                    <span className="font-bold text-blue-600">{totalPaid.toFixed(2)} DT</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Reste à Payer:</span>
                    <span className={`text-2xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining.toFixed(2)} DT
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning if no payments */}
              {payments.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Aucun paiement ajouté</p>
                    <p>Cette vente sera créée avec un solde impayé de {finalAmount.toFixed(2)} DT. Vous pourrez ajouter des paiements ultérieurement.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
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
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? 'Création...' : 'Créer la Vente'}
            </Button>
          )}
        </div>

        {/* Article Selection Dialog */}
        <SaleArticleSelectionDialog
          open={articleDialogOpen}
          onOpenChange={setArticleDialogOpen}
          clientType={selectedClient?.type || 'PATIENT'}
          existingArticles={articles}
          onArticlesSelected={(newArticles) => {
            setArticles([...articles, ...newArticles]);
            toast({
              title: 'Succès',
              description: `${newArticles.length} article${newArticles.length > 1 ? 's' : ''} ajouté${newArticles.length > 1 ? 's' : ''}`
            });
          }}
        />

        {/* Payment Dialog */}
        <SalePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clientType={selectedClient?.type || 'PATIENT'}
          remainingAmount={remaining}
          onPaymentAdded={(payment) => {
            setPayments([...payments, payment]);
            toast({
              title: 'Succès',
              description: 'Paiement ajouté avec succès'
            });
          }}
          onCNAMSelected={() => {
            // Open CNAM bon dialog
            setCnamBonDialogOpen(true);
          }}
        />

        {/* CNAM Bon Dialog (Patient only) */}
        {selectedClient?.type === 'PATIENT' && (
          <SaleCNAMBonDialog
            open={cnamBonDialogOpen}
            onOpenChange={setCnamBonDialogOpen}
            saleAmount={finalAmount}
            onCNAMBonCreated={(cnamBon, cnamPayment) => {
              // Add CNAM payment to payments list
              setPayments([...payments, cnamPayment]);
              toast({
                title: 'Succès',
                description: `Bon CNAM ${cnamBon.bonType} créé - Paiement de ${cnamPayment.amount} DT ajouté`
              });
            }}
          />
        )}

        {/* Product Parameter Dialog (Patient Medical Devices only) */}
        {currentArticleForConfig && (
          <SaleProductParameterDialog
            open={parameterDialogOpen}
            onOpenChange={setParameterDialogOpen}
            article={currentArticleForConfig}
            onParametersSaved={(articleId, parameters) => {
              // Update article with parameters
              setArticles(articles.map(a =>
                a.id === articleId ? { ...a, parameters } : a
              ));
              toast({
                title: 'Succès',
                description: 'Configuration enregistrée'
              });
              setCurrentArticleForConfig(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
