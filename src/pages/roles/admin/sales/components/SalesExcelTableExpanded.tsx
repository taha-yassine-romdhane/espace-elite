import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Eye,
  CreditCard,
  Package,
  User,
  Building2,
  Calendar,
  FileText,
  Minus,
  Activity,
  Wrench,
  Stethoscope,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/priceUtils';
import { useRouter } from 'next/router';
import { PatientSelectorDialog } from '@/components/dialogs/PatientSelectorDialog';

interface Sale {
  id: string;
  saleCode: string;
  saleDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: string;
  notes: string;
  patientId?: string;
  companyId?: string;
  processedById: string;
  patient?: any;
  company?: any;
  processedBy?: any;
  payment?: any[];
  items?: any[];
}

export default function SalesExcelTableExpanded() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // New sale state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedClientType, setSelectedClientType] = useState<'patient' | 'company' | ''>('');
  const [newSaleData, setNewSaleData] = useState<any>({
    saleDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    totalAmount: 0,
    discount: 0,
    finalAmount: 0,
    notes: '',
    items: [],
    payments: [],
    cnamBons: [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  // Fetch sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await fetch('/api/sales');
      if (!response.ok) throw new Error('Failed to fetch sales');
      const data = await response.json();
      return data.sales || [];
    },
  });

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/societes');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
  });

  // Fetch products for items
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch medical devices
  const { data: medicalDevices } = useQuery({
    queryKey: ['medical-devices'],
    queryFn: async () => {
      const response = await fetch('/api/medical-devices');
      if (!response.ok) throw new Error('Failed to fetch medical devices');
      return response.json();
    },
  });

  // Fetch users (employees)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Fetch diagnostic devices
  const { data: diagnosticDevices } = useQuery({
    queryKey: ['diagnostic-devices'],
    queryFn: async () => {
      const response = await fetch('/api/diagnostic-devices');
      if (!response.ok) throw new Error('Failed to fetch diagnostic devices');
      return response.json();
    },
  });

  // Fetch accessories
  const { data: accessories } = useQuery({
    queryKey: ['accessories'],
    queryFn: async () => {
      const response = await fetch('/api/accessories');
      if (!response.ok) throw new Error('Failed to fetch accessories');
      return response.json();
    },
  });

  // Fetch spare parts
  const { data: spareParts } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: async () => {
      const response = await fetch('/api/spare-parts');
      if (!response.ok) throw new Error('Failed to fetch spare parts');
      return response.json();
    },
  });

  useEffect(() => {
    if (salesData && Array.isArray(salesData)) {
      setSales(salesData);
    }
  }, [salesData]);

  // Filter sales
  const filteredSales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    return sales.filter((sale) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        sale.saleCode?.toLowerCase().includes(searchLower) ||
        sale.patient?.firstName?.toLowerCase().includes(searchLower) ||
        sale.patient?.lastName?.toLowerCase().includes(searchLower) ||
        sale.company?.companyName?.toLowerCase().includes(searchLower) ||
        sale.notes?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      const matchesClient =
        clientFilter === 'all' ||
        (clientFilter === 'patient' && sale.patientId) ||
        (clientFilter === 'company' && sale.companyId);

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [sales, searchTerm, statusFilter, clientFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newSale: any) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSale),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sale');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({ title: 'Succès', description: 'Vente créée avec succès' });
      setIsAddingNew(false);
      setExpandedRow(null);
      resetNewSaleData();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la vente',
        variant: 'destructive'
      });
    },
  });

  const resetNewSaleData = () => {
    setNewSaleData({
      saleDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      totalAmount: 0,
      discount: 0,
      finalAmount: 0,
      notes: '',
      items: [],
      payments: [],
    });
  };

  const handleStartAddNew = () => {
    setIsAddingNew(true);
    setExpandedRow('new');
    resetNewSaleData();
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setExpandedRow(null);
    resetNewSaleData();
  };

  const handleAddItem = (type: 'product' | 'medicalDevice' | 'diagnosticDevice' | 'accessory' | 'sparePart' = 'product') => {
    const newItem = {
      id: `temp-${Date.now()}`,
      itemType: type,
      productId: '',
      medicalDeviceId: '',
      diagnosticDeviceId: '',
      accessoryId: '',
      sparePartId: '',
      serialNumber: '', // For medical/diagnostic devices
      deviceCode: '', // For medical/diagnostic devices
      quantity: type === 'accessory' || type === 'sparePart' ? 1 : 1, // Quantity always 1 for devices
      unitPrice: 0,
      discount: 0,
      itemTotal: 0,
    };
    setNewSaleData({
      ...newSaleData,
      items: [...(newSaleData.items || []), newItem],
    });
  };

  const handleAddCNAMBon = () => {
    const newBon = {
      id: `temp-${Date.now()}`,
      bonType: 'CPAP',
      bondAmount: 0,
      devicePrice: 0,
      complementAmount: 0,
      currentStep: 1,
      totalSteps: 10,
      status: 'EN_ATTENTE_APPROBATION',
    };
    setNewSaleData({
      ...newSaleData,
      cnamBons: [...(newSaleData.cnamBons || []), newBon],
    });
  };

  const handleRemoveCNAMBon = (index: number) => {
    const cnamBons = [...(newSaleData.cnamBons || [])];
    cnamBons.splice(index, 1);
    setNewSaleData({ ...newSaleData, cnamBons });
  };

  const handleCNAMBonChange = (index: number, field: string, value: any) => {
    const cnamBons = [...(newSaleData.cnamBons || [])];
    cnamBons[index] = { ...cnamBons[index], [field]: value };

    // Auto-calculate complement amount
    if (field === 'bondAmount' || field === 'devicePrice') {
      const devicePrice = Number(cnamBons[index].devicePrice) || 0;
      const bondAmount = Number(cnamBons[index].bondAmount) || 0;
      cnamBons[index].complementAmount = devicePrice - bondAmount;
    }

    setNewSaleData({ ...newSaleData, cnamBons });
  };

  const handleRemoveItem = (index: number) => {
    const items = [...(newSaleData.items || [])];
    items.splice(index, 1);
    updateTotals({ ...newSaleData, items });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...(newSaleData.items || [])];
    items[index] = { ...items[index], [field]: value };

    // When itemType changes, clear the opposite field
    if (field === 'itemType') {
      if (value === 'product') {
        items[index].medicalDeviceId = '';
      } else if (value === 'medicalDevice') {
        items[index].productId = '';
      }
    }

    // Recalculate item total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const quantity = Number(items[index].quantity) || 0;
      const unitPrice = Number(items[index].unitPrice) || 0;
      const discount = Number(items[index].discount) || 0;
      items[index].itemTotal = (quantity * unitPrice) - discount;
    }

    updateTotals({ ...newSaleData, items });
  };

  const handleAddPayment = () => {
    const newPayment = {
      id: `temp-${Date.now()}`,
      type: 'cash',
      amount: 0,
      classification: 'principale',
    };
    setNewSaleData({
      ...newSaleData,
      payments: [...(newSaleData.payments || []), newPayment],
    });
  };

  const handleRemovePayment = (index: number) => {
    const payments = [...(newSaleData.payments || [])];
    payments.splice(index, 1);
    setNewSaleData({ ...newSaleData, payments });
  };

  const handlePaymentChange = (index: number, field: string, value: any) => {
    const payments = [...(newSaleData.payments || [])];
    payments[index] = { ...payments[index], [field]: value };
    setNewSaleData({ ...newSaleData, payments });
  };

  const updateTotals = (data: any) => {
    const totalAmount = (data.items || []).reduce((sum: number, item: any) => sum + (Number(item.itemTotal) || 0), 0);
    const finalAmount = totalAmount - (Number(data.discount) || 0);
    setNewSaleData({ ...data, totalAmount, finalAmount });
  };

  const handleSaveNew = () => {
    if (!newSaleData.patientId && !newSaleData.companyId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive'
      });
      return;
    }

    if (!newSaleData.items || newSaleData.items.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un article',
        variant: 'destructive'
      });
      return;
    }

    if (!newSaleData.payments || newSaleData.payments.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un paiement',
        variant: 'destructive'
      });
      return;
    }

    const salePayload = {
      ...newSaleData,
      saleDate: new Date(newSaleData.saleDate),
      payment: newSaleData.payments,
      cnamBons: newSaleData.cnamBons || [], // Include CNAM bons
    };

    createMutation.mutate(salePayload);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      COMPLETED: { label: 'Terminé', className: 'bg-green-100 text-green-700' },
      PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
      CANCELLED: { label: 'Annulé', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Button */}
      <div className="mb-4">
        <Button
          onClick={handleStartAddNew}
          disabled={isAddingNew}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Ajouter une Vente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="COMPLETED">Terminé</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="CANCELLED">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Facture</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Créé par</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Assigné à</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">Montant</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Notes</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New Sale Row */}
            {isAddingNew && (
              <>
                <tr className="bg-green-50 border-b-2 border-green-200">
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRow(expandedRow === 'new' ? null : 'new')}
                      className="h-6 w-6 p-0"
                    >
                      {expandedRow === 'new' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Badge variant="outline">Nouveau</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-xs text-slate-400">
                      Auto
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="date"
                      value={newSaleData.saleDate}
                      onChange={(e) => setNewSaleData({ ...newSaleData, saleDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PatientSelectorDialog
                      onSelect={(type, id, name) => {
                        setSelectedClientName(name);
                        setSelectedClientType(type);
                        setNewSaleData({
                          ...newSaleData,
                          patientId: type === 'patient' ? id : undefined,
                          companyId: type === 'company' ? id : undefined,
                        });
                      }}
                      selectedId={newSaleData.patientId || newSaleData.companyId}
                      selectedName={selectedClientName}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {selectedClientType === 'patient' && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <User className="h-3 w-3 mr-1" />
                        Patient
                      </Badge>
                    )}
                    {selectedClientType === 'company' && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        Société
                      </Badge>
                    )}
                    {!selectedClientType && (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Badge variant="outline" className="bg-blue-50">
                      {session?.user?.name || 'Vous'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={newSaleData.assignedToId || ''}
                      onValueChange={(value) => setNewSaleData({ ...newSaleData, assignedToId: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner employé" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter((user: any) => user.role === 'EMPLOYEE').map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {formatCurrency(newSaleData.finalAmount || 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Select
                      value={newSaleData.status}
                      onValueChange={(value) => setNewSaleData({ ...newSaleData, status: value })}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="COMPLETED">Terminé</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Notes..."
                      value={newSaleData.notes || ''}
                      onChange={(e) => setNewSaleData({ ...newSaleData, notes: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveNew}
                        className="h-8 px-2 hover:bg-green-100"
                        title="Sauvegarder"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNew}
                        className="h-8 px-2 hover:bg-red-100"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Content for New Sale - Excel Style */}
                {expandedRow === 'new' && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={12} className="p-2">
                      <div className="overflow-x-auto border-l-2 border-green-500">
                        {/* Articles Table */}
                        <div className="mb-2">
                          <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-3 border-b-2 border-blue-300">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2 text-sm font-bold text-blue-900">
                                <Package className="h-5 w-5" /> Articles ({newSaleData.items?.length || 0})
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => handleAddItem('medicalDevice')}
                                size="sm"
                                className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                <Activity className="h-4 w-4" />
                                Appareil Médical
                              </Button>
                              <Button
                                onClick={() => handleAddItem('diagnosticDevice')}
                                size="sm"
                                className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                <Stethoscope className="h-4 w-4" />
                                Appareil Diagnostic
                              </Button>
                              <Button
                                onClick={() => handleAddItem('accessory')}
                                size="sm"
                                className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                <Package className="h-4 w-4" />
                                Accessoire
                              </Button>
                              <Button
                                onClick={() => handleAddItem('sparePart')}
                                size="sm"
                                className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                <Wrench className="h-4 w-4" />
                                Pièce de Rechange
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-1 py-1 text-left w-16">#</th>
                                  <th className="px-1 py-1 text-left w-32">Type</th>
                                  <th className="px-1 py-1 text-left min-w-[200px]">Article</th>
                                  <th className="px-1 py-1 text-left w-32">N° Série</th>
                                  <th className="px-1 py-1 text-left w-24">Code</th>
                                  <th className="px-1 py-1 text-right w-16">Qté</th>
                                  <th className="px-1 py-1 text-right w-24">Prix U.</th>
                                  <th className="px-1 py-1 text-right w-24">Total</th>
                                  <th className="px-1 py-1 w-8"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {newSaleData.items?.map((item: any, index: number) => (
                                  <tr key={item.id} className="border-b hover:bg-slate-50">
                                    <td className="px-1 py-1">{index + 1}</td>
                                    <td className="px-1 py-1">
                                      <Badge variant="outline" className={`text-xs ${
                                        item.itemType === 'medicalDevice' ? 'bg-blue-50 text-blue-700' :
                                        item.itemType === 'diagnosticDevice' ? 'bg-purple-50 text-purple-700' :
                                        item.itemType === 'accessory' ? 'bg-orange-50 text-orange-700' :
                                        item.itemType === 'sparePart' ? 'bg-slate-50 text-slate-700' :
                                        'bg-green-50 text-green-700'
                                      }`}>
                                        {item.itemType === 'medicalDevice' && 'App. Médical'}
                                        {item.itemType === 'diagnosticDevice' && 'App. Diagnostic'}
                                        {item.itemType === 'accessory' && 'Accessoire'}
                                        {item.itemType === 'sparePart' && 'Pièce'}
                                        {item.itemType === 'product' && 'Produit'}
                                      </Badge>
                                    </td>
                                    <td className="px-1 py-1">
                                      {item.itemType === 'medicalDevice' && (
                                        <Select value={item.medicalDeviceId} onValueChange={(value) => handleItemChange(index, 'medicalDeviceId', value)}>
                                          <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {medicalDevices?.map((device: any) => (
                                              <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {item.itemType === 'diagnosticDevice' && (
                                        <Select value={item.diagnosticDeviceId} onValueChange={(value) => handleItemChange(index, 'diagnosticDeviceId', value)}>
                                          <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {diagnosticDevices?.map((device: any) => (
                                              <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {item.itemType === 'accessory' && (
                                        <Select value={item.accessoryId} onValueChange={(value) => handleItemChange(index, 'accessoryId', value)}>
                                          <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {accessories?.map((accessory: any) => (
                                              <SelectItem key={accessory.id} value={accessory.id}>{accessory.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {item.itemType === 'sparePart' && (
                                        <Select value={item.sparePartId} onValueChange={(value) => handleItemChange(index, 'sparePartId', value)}>
                                          <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {spareParts?.map((part: any) => (
                                              <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {item.itemType === 'product' && (
                                        <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                                          <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {products?.map((product: any) => (
                                              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </td>
                                    {/* Serial Number - only for medical/diagnostic devices */}
                                    <td className="px-1 py-1">
                                      {(item.itemType === 'medicalDevice' || item.itemType === 'diagnosticDevice') && (
                                        <Input
                                          type="text"
                                          value={item.serialNumber || ''}
                                          onChange={(e) => handleItemChange(index, 'serialNumber', e.target.value)}
                                          placeholder="N° Série"
                                          className="h-6 text-xs border-0 bg-transparent"
                                        />
                                      )}
                                    </td>
                                    {/* Device Code - only for medical/diagnostic devices */}
                                    <td className="px-1 py-1">
                                      {(item.itemType === 'medicalDevice' || item.itemType === 'diagnosticDevice') && (
                                        <Input
                                          type="text"
                                          value={item.deviceCode || ''}
                                          onChange={(e) => handleItemChange(index, 'deviceCode', e.target.value)}
                                          placeholder="Code"
                                          className="h-6 text-xs border-0 bg-transparent"
                                        />
                                      )}
                                    </td>
                                    {/* Quantity - only for accessories/spare parts */}
                                    <td className="px-1 py-1">
                                      {(item.itemType === 'accessory' || item.itemType === 'sparePart') ? (
                                        <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="h-6 text-xs text-right border-0 bg-transparent" />
                                      ) : (
                                        <span className="text-xs text-slate-400">1</span>
                                      )}
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="h-6 text-xs text-right border-0 bg-transparent" />
                                    </td>
                                    <td className="px-1 py-1 text-right font-semibold">{item.itemTotal?.toFixed(2)}</td>
                                    <td className="px-1 py-1">
                                      <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)} className="h-6 w-6 p-0 hover:bg-red-100">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                                {(!newSaleData.items || newSaleData.items.length === 0) && (
                                  <tr><td colSpan={9} className="text-center text-slate-400 py-2">Aucun article</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Payments Table */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between bg-green-100 px-2 py-1 text-xs font-semibold">
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" /> Paiements
                            </span>
                            <Button onClick={handleAddPayment} size="sm" variant="ghost" className="h-6 px-2">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-1 py-1 text-left w-16">#</th>
                                  <th className="px-1 py-1 text-left min-w-[120px]">Méthode</th>
                                  <th className="px-1 py-1 text-right w-24">Montant</th>
                                  <th className="px-1 py-1 text-left w-32">Classification</th>
                                  <th className="px-1 py-1 w-8"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {newSaleData.payments?.map((payment: any, index: number) => (
                                  <tr key={payment.id} className="border-b hover:bg-slate-50">
                                    <td className="px-1 py-1">{index + 1}</td>
                                    <td className="px-1 py-1">
                                      <Select value={payment.type} onValueChange={(value) => handlePaymentChange(index, 'type', value)}>
                                        <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cash">Espèces</SelectItem>
                                          <SelectItem value="cheque">Chèque</SelectItem>
                                          <SelectItem value="virement">Virement</SelectItem>
                                          <SelectItem value="cnam">CNAM</SelectItem>
                                          <SelectItem value="traite">Traite</SelectItem>
                                          <SelectItem value="mandat">Mandat</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input type="number" step="0.01" value={payment.amount} onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)} className="h-6 text-xs text-right border-0 bg-transparent" />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Select value={payment.classification} onValueChange={(value) => handlePaymentChange(index, 'classification', value)}>
                                        <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="principale">Principale</SelectItem>
                                          <SelectItem value="complementaire">Complémentaire</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-1 py-1">
                                      <Button variant="ghost" size="sm" onClick={() => handleRemovePayment(index)} className="h-6 w-6 p-0 hover:bg-red-100">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                                {(!newSaleData.payments || newSaleData.payments.length === 0) && (
                                  <tr><td colSpan={5} className="text-center text-slate-400 py-2">Aucun paiement</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* CNAM Bons Table */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between bg-red-100 px-2 py-1 text-xs font-semibold">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Bons CNAM
                            </span>
                            <Button onClick={handleAddCNAMBon} size="sm" variant="ghost" className="h-6 px-2">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-1 py-1 text-left w-16">#</th>
                                  <th className="px-1 py-1 text-left w-32">Type</th>
                                  <th className="px-1 py-1 text-right w-24">Mnt CNAM</th>
                                  <th className="px-1 py-1 text-right w-24">Prix App.</th>
                                  <th className="px-1 py-1 text-right w-24">Complément</th>
                                  <th className="px-1 py-1 text-left w-28">Statut</th>
                                  <th className="px-1 py-1 w-8"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {newSaleData.cnamBons?.map((bon: any, index: number) => (
                                  <tr key={bon.id} className="border-b hover:bg-slate-50">
                                    <td className="px-1 py-1">{index + 1}</td>
                                    <td className="px-1 py-1">
                                      <Select value={bon.bonType} onValueChange={(value) => handleCNAMBonChange(index, 'bonType', value)}>
                                        <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="CPAP">CPAP</SelectItem>
                                          <SelectItem value="VNI">VNI</SelectItem>
                                          <SelectItem value="CONCENTRATEUR">Concentrateur</SelectItem>
                                          <SelectItem value="AUTRE">Autre</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input type="number" step="0.01" value={bon.bondAmount} onChange={(e) => handleCNAMBonChange(index, 'bondAmount', e.target.value)} className="h-6 text-xs text-right border-0 bg-transparent" />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input type="number" step="0.01" value={bon.devicePrice} onChange={(e) => handleCNAMBonChange(index, 'devicePrice', e.target.value)} className="h-6 text-xs text-right border-0 bg-transparent" />
                                    </td>
                                    <td className="px-1 py-1 text-right font-semibold bg-amber-50">{bon.complementAmount?.toFixed(2)}</td>
                                    <td className="px-1 py-1">
                                      <Select value={bon.status} onValueChange={(value) => handleCNAMBonChange(index, 'status', value)}>
                                        <SelectTrigger className="h-6 text-xs border-0 bg-transparent">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="EN_ATTENTE_APPROBATION">En Attente</SelectItem>
                                          <SelectItem value="APPROUVE">Approuvé</SelectItem>
                                          <SelectItem value="REJETE">Rejeté</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-1 py-1">
                                      <Button variant="ghost" size="sm" onClick={() => handleRemoveCNAMBon(index)} className="h-6 w-6 p-0 hover:bg-red-100">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                                {(!newSaleData.cnamBons || newSaleData.cnamBons.length === 0) && (
                                  <tr><td colSpan={7} className="text-center text-slate-400 py-2">Aucun bon CNAM</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-blue-50 px-2 py-1 flex items-center justify-end gap-4 text-xs">
                          <span>Total: <strong>{formatCurrency(newSaleData.totalAmount)}</strong></span>
                          <span className="flex items-center gap-1">
                            Remise: <Input type="number" step="0.01" value={newSaleData.discount} onChange={(e) => {
                              const discount = Number(e.target.value) || 0;
                              setNewSaleData({ ...newSaleData, discount, finalAmount: newSaleData.totalAmount - discount });
                            }} className="h-6 w-20 text-xs text-right" />
                          </span>
                          <span className="font-bold text-green-700">Final: {formatCurrency(newSaleData.finalAmount)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}

            {/* Existing Sales */}
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRow(expandedRow === sale.id ? null : sale.id)}
                    className="h-6 w-6 p-0"
                  >
                    {expandedRow === sale.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {sale.saleCode}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  <Badge variant="outline" className="font-mono">
                    {sale.invoiceNumber || 'N/A'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(sale.saleDate).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-xs">
                  {sale.patient
                    ? `${sale.patient.firstName} ${sale.patient.lastName}`
                    : sale.company?.companyName || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {sale.patient && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      <User className="h-3 w-3 mr-1" />
                      Patient
                    </Badge>
                  )}
                  {sale.company && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      Société
                    </Badge>
                  )}
                  {!sale.patient && !sale.company && (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <Badge variant="outline" className="bg-blue-50 text-xs">
                    {sale.processedBy?.name || sale.processedBy?.firstName || 'N/A'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  <Badge variant="outline" className="bg-green-50 text-xs">
                    {sale.assignedTo?.name || sale.assignedTo?.firstName || '-'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-700 text-xs">
                  {formatCurrency(Number(sale.finalAmount))}
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(sale.status)}
                </td>
                <td className="px-4 py-3 text-xs truncate max-w-[200px]" title={sale.notes || ''}>
                  {sale.notes || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/roles/admin/sales/${sale.id}`)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-slate-600">
          {filteredSales.length} vente(s) au total
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <span className="text-sm">
            Page {currentPage} sur {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
