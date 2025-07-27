import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  Edit2, 
  Save, 
  X,
  Plus,
  Trash2,
  Settings,
  CreditCard,
  Package,
  User,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

// Import print styles
import '@/styles/print.css';

// Import payment components
import { ProductPaymentMatrixEnhanced } from '@/components/payment/components/ProductPaymentMatrixEnhanced';
import ProductParameterDialog from '@/pages/roles/admin/dashboard/components/steps/product/ProductParameterDialog';

// Additional icons
import { Stethoscope, Phone } from 'lucide-react';

interface SaleDetailsPageProps {}

export default function EnhancedSaleDetailsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const saleId = typeof id === 'string' ? id : '';

  // State for editing modes
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isEditingProducts, setIsEditingProducts] = useState(false);
  const [isEditingPayments, setIsEditingPayments] = useState(false);
  const [editedSale, setEditedSale] = useState<any>(null);
  
  // Product configuration dialog
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<any>(null);
  
  // Payment management
  const [paymentAssignments, setPaymentAssignments] = useState<any[]>([]);

  // Fetch sale data
  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => {
      if (!saleId) return null;
      
      const response = await fetch(`/api/sales/${saleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sale details');
      }
      
      const data = await response.json();
      return data.sale;
    },
    enabled: !!saleId,
  });

  // Use useEffect to handle data initialization
  React.useEffect(() => {
    if (sale) {
      setEditedSale(sale);
      // Initialize payment assignments from existing payments
      if (sale?.payment?.paymentDetails) {
        const assignments = sale.payment.paymentDetails.map((detail: any) => ({
          id: detail.id,
          productIds: detail.metadata?.productIds || [],
          groupName: detail.metadata?.groupName || detail.reference || 'Paiement',
          paymentMethod: detail.method,
          amount: detail.amount,
          paymentDetails: detail.metadata || {},
          cnamInfo: detail.metadata?.cnamInfo
        }));
        setPaymentAssignments(assignments);
      }
    }
  }, [sale]);

  // Update sale mutation
  const updateSaleMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sale');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      toast({
        title: 'Succès',
        description: 'La vente a été mise à jour avec succès',
      });
      setIsEditingGeneral(false);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la vente',
        variant: 'destructive',
      });
    },
  });

  // Update product configuration
  const updateProductConfigMutation = useMutation({
    mutationFn: async ({ itemId, parameters }: { itemId: string; parameters: any }) => {
      const response = await fetch(`/api/sales/${saleId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceConfiguration: parameters }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      toast({
        title: 'Succès',
        description: 'La configuration du produit a été mise à jour',
      });
    },
  });

  // Update payments
  const updatePaymentsMutation = useMutation({
    mutationFn: async (payments: any[]) => {
      const response = await fetch(`/api/sales/${saleId}/payments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payments }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payments');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      toast({
        title: 'Succès',
        description: 'Les paiements ont été mis à jour',
      });
      setIsEditingPayments(false);
    },
  });

  const handleBack = () => {
    router.push('/roles/admin/dashboard');
  };

  const handleSaveGeneralInfo = () => {
    updateSaleMutation.mutate({
      status: editedSale.status,
      notes: editedSale.notes,
      discount: editedSale.discount,
      finalAmount: editedSale.finalAmount,
    });
  };

  const handleConfigureProduct = (item: any) => {
    setSelectedProductForConfig(item);
    setParameterDialogOpen(true);
  };

  const handleSaveProductConfig = (productId: string, parameters: any) => {
    const item = sale?.items?.find((i: any) => 
      i.medicalDeviceId === productId || i.productId === productId
    );
    
    if (item) {
      updateProductConfigMutation.mutate({
        itemId: item.id,
        parameters,
      });
    }
    
    setParameterDialogOpen(false);
  };

  const handleSavePayments = () => {
    // Convert payment assignments to the format expected by the API
    const payments = paymentAssignments.map(assignment => ({
      type: assignment.paymentMethod,
      amount: assignment.amount,
      ...assignment.paymentDetails,
      metadata: {
        groupName: assignment.groupName,
        productIds: assignment.productIds,
        ...assignment.paymentDetails,
        ...(assignment.cnamInfo && { cnamInfo: assignment.cnamInfo })
      }
    }));
    
    updatePaymentsMutation.mutate(payments);
  };

  // Payment assignment handlers
  const handleCreatePaymentGroup = (assignment: any) => {
    setPaymentAssignments(prev => [...prev, assignment]);
  };

  const handleUpdatePaymentGroup = (id: string, assignment: any) => {
    setPaymentAssignments(prev => 
      prev.map(p => p.id === id ? assignment : p)
    );
  };

  const handleDeletePaymentGroup = (id: string) => {
    setPaymentAssignments(prev => prev.filter(p => p.id !== id));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement des détails de la vente...</span>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error ? 'Impossible de charger les détails de cette vente.' : 'Vente non trouvée.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Transform products for payment matrix
  const transformedProducts = sale.items?.map((item: any) => ({
    id: item.medicalDeviceId || item.productId || item.id,
    name: item.name || item.medicalDevice?.name || item.product?.name || 'Produit',
    type: item.medicalDevice?.type || item.product?.type || 'UNKNOWN',
    sellingPrice: Number(item.unitPrice || 0),
    quantity: Number(item.quantity || 1)
  })) || [];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <h1 className="text-3xl font-bold text-blue-900">Détails de la Vente #{sale.invoiceNumber}</h1>
        <div className="w-[100px]"></div> {/* Spacer for alignment */}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <FileText className="mr-2 h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="client">
            {sale.patient ? <User className="mr-2 h-4 w-4" /> : <Building2 className="mr-2 h-4 w-4" />}
            Client
          </TabsTrigger>
          <TabsTrigger value="receipt">
            <FileText className="mr-2 h-4 w-4" />
            Reçu
          </TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informations Générales</CardTitle>
              {!isEditingGeneral ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditingGeneral(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditingGeneral(false);
                    setEditedSale(sale);
                  }}>
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSaveGeneralInfo}>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Numéro de Reçu</Label>
                  <p className="font-medium">{sale.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{new Date(sale.saleDate).toLocaleDateString('fr-TN')}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  {isEditingGeneral ? (
                    <Select
                      value={editedSale?.status || sale.status}
                      onValueChange={(value) => setEditedSale({ ...editedSale, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="COMPLETED">Complété</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {sale.status}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>Montant Total</Label>
                  <p className="font-medium">{Number(sale.totalAmount).toFixed(2)} DT</p>
                </div>
                <div>
                  <Label>Remise</Label>
                  {isEditingGeneral ? (
                    <Input
                      type="number"
                      value={editedSale?.discount || 0}
                      onChange={(e) => setEditedSale({ 
                        ...editedSale, 
                        discount: parseFloat(e.target.value) || 0,
                        finalAmount: Number(sale.totalAmount) - (parseFloat(e.target.value) || 0)
                      })}
                    />
                  ) : (
                    <p className="font-medium">{Number(sale.discount || 0).toFixed(2)} DT</p>
                  )}
                </div>
                <div>
                  <Label>Montant Final</Label>
                  <p className="font-medium text-lg text-blue-600">
                    {Number(editedSale?.finalAmount || sale.finalAmount).toFixed(2)} DT
                  </p>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                {isEditingGeneral ? (
                  <Textarea
                    value={editedSale?.notes || ''}
                    onChange={(e) => setEditedSale({ ...editedSale, notes: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{sale.notes || 'Aucune note'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Package className="h-5 w-5" />
                Produits Vendus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {sale.items?.map((item: any, index: number) => {
                  const product = item.medicalDevice || item.product;
                  const hasParameters = item.deviceConfiguration && Object.keys(item.deviceConfiguration).length > 0;
                  
                  return (
                    <div key={item.id} className="border-2 border-gray-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {item.medicalDevice ? (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                Appareil Médical
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                <Package className="w-3 h-3 mr-1" />
                                Accessoire
                              </Badge>
                            )}
                            <h4 className="font-semibold text-lg text-gray-800">{product?.name || 'Produit inconnu'}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {product?.brand && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">Marque:</span>
                                <span className="text-sm text-gray-700">{product.brand}</span>
                              </div>
                            )}
                            {product?.model && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">Modèle:</span>
                                <span className="text-sm text-gray-700">{product.model}</span>
                              </div>
                            )}
                            {item.serialNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">N° Série:</span>
                                <span className="text-sm text-gray-700">{item.serialNumber}</span>
                              </div>
                            )}
                            {item.warranty && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">Garantie:</span>
                                <span className="text-sm text-gray-700">{item.warranty}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-6">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Quantité</p>
                                <p className="text-xl font-bold text-blue-600">{item.quantity}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Prix Unitaire</p>
                                <p className="text-xl font-bold text-green-600">{Number(item.unitPrice).toFixed(2)} DT</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-xl font-bold text-purple-600">
                                  {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)} DT
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Display configuration */}
                          {hasParameters && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings className="h-4 w-4 text-blue-600" />
                                <p className="font-semibold text-blue-900">Configuration de l'Appareil</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {item.deviceConfiguration.debit && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">Débit:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.debit}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.pression && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">Pression:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.pression}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.pressionRampe && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">Pression Rampe:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.pressionRampe}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.dureeRampe && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">Durée Rampe:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.dureeRampe} min</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.epr && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">EPR:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.epr}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.ipap && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">IPAP:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.ipap}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.epap && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">EPAP:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.epap}</span>
                                  </div>
                                )}
                                {item.deviceConfiguration.mode && (
                                  <div className="bg-white p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-medium">Mode:</span>
                                    <span className="text-sm text-blue-800 ml-2 font-semibold">{item.deviceConfiguration.mode}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {item.medicalDevice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfigureProduct(item)}
                            className="ml-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {hasParameters ? 'Modifier Config' : 'Configurer'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestion des Paiements</CardTitle>
              {!isEditingPayments ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditingPayments(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Modifier les paiements
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditingPayments(false);
                    // Reset payment assignments
                    if (sale?.payment?.paymentDetails) {
                      const assignments = sale.payment.paymentDetails.map((detail: any) => ({
                        id: detail.id,
                        productIds: detail.metadata?.productIds || [],
                        groupName: detail.metadata?.groupName || detail.reference || 'Paiement',
                        paymentMethod: detail.method,
                        amount: detail.amount,
                        paymentDetails: detail.metadata || {},
                        cnamInfo: detail.metadata?.cnamInfo
                      }));
                      setPaymentAssignments(assignments);
                    }
                  }}>
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSavePayments}>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isEditingPayments ? (
                <ProductPaymentMatrixEnhanced
                  products={transformedProducts}
                  paymentAssignments={paymentAssignments}
                  onCreatePaymentGroup={handleCreatePaymentGroup}
                  onUpdatePaymentGroup={handleUpdatePaymentGroup}
                  onDeletePaymentGroup={handleDeletePaymentGroup}
                  isCompany={!sale.patient}
                  selectedClient={sale.patient || sale.company}
                />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Montant Total</p>
                        <p className="text-2xl font-bold">{Number(sale.finalAmount).toFixed(2)} DT</p>
                      </div>
                      <Badge 
                        variant={sale.payment?.status === 'PAID' ? 'default' : 'secondary'}
                        className="text-lg px-4 py-2"
                      >
                        {sale.payment?.status === 'PAID' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                  
                  {sale.payment?.paymentDetails?.map((detail: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{detail.displayMethod || detail.method}</h4>
                          {detail.metadata?.groupName && (
                            <p className="text-sm text-gray-600">{detail.metadata.groupName}</p>
                          )}
                          {detail.reference && (
                            <p className="text-sm text-gray-500">Réf: {detail.reference}</p>
                          )}
                        </div>
                        <p className="text-lg font-medium">{Number(detail.amount).toFixed(2)} DT</p>
                      </div>
                      
                      {detail.metadata?.cnamInfo && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-900">Dossier CNAM</p>
                          <p className="text-sm text-blue-700">
                            Type: {detail.metadata.cnamInfo.bondType} | 
                            Étape: {detail.metadata.cnamInfo.currentStep}/{detail.metadata.cnamInfo.totalSteps}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Tab */}
        <TabsContent value="client">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-green-900">
                {sale.patient ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                {sale.patient ? 'Informations Patient' : 'Informations Société'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {sale.patient ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informations Personnelles
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Nom complet</Label>
                        <p className="font-semibold text-gray-800">{sale.patient.fullName}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Prénom</Label>
                        <p className="font-semibold text-gray-800">{sale.patient.firstName}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Nom de famille</Label>
                        <p className="font-semibold text-gray-800">{sale.patient.lastName}</p>
                      </div>
                      {sale.patient.cin && (
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-sm text-gray-500">CIN</Label>
                          <p className="font-semibold text-gray-800">{sale.patient.cin}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Informations de Contact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Téléphone Principal</Label>
                        <p className="font-semibold text-gray-800">{sale.patient.telephone || '-'}</p>
                      </div>
                      {sale.patient.telephoneTwo && (
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-sm text-gray-500">Téléphone Secondaire</Label>
                          <p className="font-semibold text-gray-800">{sale.patient.telephoneTwo}</p>
                        </div>
                      )}
                    </div>
                    {sale.patient.address && (
                      <div className="mt-4 bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Adresse Complète</Label>
                        <p className="font-semibold text-gray-800">{sale.patient.address}</p>
                      </div>
                    )}
                  </div>

                  {/* CNAM Information */}
                  {(sale.patient.cnamId || sale.patient.affiliation || sale.patient.beneficiaryType) && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Informations CNAM
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {sale.patient.cnamId && (
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-sm text-gray-500">Numéro CNAM</Label>
                            <p className="font-semibold text-gray-800">{sale.patient.cnamId}</p>
                          </div>
                        )}
                        {sale.patient.affiliation && (
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-sm text-gray-500">Affiliation</Label>
                            <p className="font-semibold text-gray-800">{sale.patient.affiliation}</p>
                          </div>
                        )}
                        {sale.patient.beneficiaryType && (
                          <div className="bg-white p-3 rounded border col-span-2">
                            <Label className="text-sm text-gray-500">Type de Bénéficiaire</Label>
                            <p className="font-semibold text-gray-800">{sale.patient.beneficiaryType}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : sale.company ? (
                <div className="space-y-6">
                  {/* Company Information */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Informations Société
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Nom de la société</Label>
                        <p className="font-semibold text-gray-800">{sale.company.companyName}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <Label className="text-sm text-gray-500">Téléphone</Label>
                        <p className="font-semibold text-gray-800">{sale.company.telephone || '-'}</p>
                      </div>
                      {sale.company.fiscalNumber && (
                        <div className="bg-white p-3 rounded border col-span-2">
                          <Label className="text-sm text-gray-500">Matricule Fiscal</Label>
                          <p className="font-semibold text-gray-800">{sale.company.fiscalNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Aucune information client disponible
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt/Report Tab */}
        <TabsContent value="receipt">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5" />
                Reçu de Vente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-white" id="receipt-content">
              {/* Company Header */}
              <div className="text-center border-b-2 border-blue-200 pb-6 mb-6">
                <h1 className="text-2xl font-bold text-blue-900">ESPACE ELITE</h1>
                <p className="text-gray-600 mt-2">Équipements Médicaux</p>
                <p className="text-sm text-gray-500">Adresse de l'entreprise • Téléphone • Email</p>
              </div>

              {/* Receipt Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">REÇU DE VENTE</h2>
                  <p className="text-gray-600">N° {sale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Date: {new Date(sale.saleDate).toLocaleDateString('fr-TN')}</p>
                  <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'} className="mt-2">
                    {sale.status === 'COMPLETED' ? 'Payé' : 'En attente'}
                  </Badge>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Facturé à:</h3>
                {sale.patient ? (
                  <div>
                    <p className="font-medium">{sale.patient.fullName}</p>
                    {sale.patient.cin && <p className="text-sm text-gray-600">CIN: {sale.patient.cin}</p>}
                    {sale.patient.telephone && <p className="text-sm text-gray-600">Tél: {sale.patient.telephone}</p>}
                    {sale.patient.address && <p className="text-sm text-gray-600">{sale.patient.address}</p>}
                  </div>
                ) : sale.company ? (
                  <div>
                    <p className="font-medium">{sale.company.companyName}</p>
                    {sale.company.telephone && <p className="text-sm text-gray-600">Tél: {sale.company.telephone}</p>}
                    {sale.company.fiscalNumber && <p className="text-sm text-gray-600">Matricule: {sale.company.fiscalNumber}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Client non spécifié</p>
                )}
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border border-gray-300">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Qté</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Prix Unit.</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item: any, index: number) => {
                      const product = item.medicalDevice || item.product;
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-4 py-2">
                            <div>
                              <p className="font-medium">{product?.name || 'Produit inconnu'}</p>
                              {product?.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                              {item.serialNumber && <p className="text-xs text-gray-500">S/N: {item.serialNumber}</p>}
                              {item.deviceConfiguration && Object.keys(item.deviceConfiguration).length > 0 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Configuration: {Object.entries(item.deviceConfiguration)
                                    .filter(([_, value]) => value)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{Number(item.unitPrice).toFixed(2)} DT</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)} DT
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-1/3">
                  <div className="flex justify-between py-2">
                    <span>Sous-total:</span>
                    <span>{Number(sale.totalAmount).toFixed(2)} DT</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between py-2 text-red-600">
                      <span>Remise:</span>
                      <span>-{Number(sale.discount).toFixed(2)} DT</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
                    <span>Total:</span>
                    <span>{Number(sale.finalAmount).toFixed(2)} DT</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {sale.payment?.paymentDetails && sale.payment.paymentDetails.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">Détails du Paiement:</h3>
                  {sale.payment.paymentDetails.map((detail: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-green-700">{detail.displayMethod || detail.method}</span>
                      <span className="font-medium text-green-800">{Number(detail.amount).toFixed(2)} DT</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {sale.notes && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-800 mb-2">Notes:</h3>
                  <p className="text-yellow-700">{sale.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>Merci pour votre confiance</p>
                <p className="mt-1">Ce reçu fait foi de paiement</p>
              </div>

              {/* Print Button */}
              <div className="flex justify-center mt-6 no-print">
                <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Imprimer le Reçu
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Parameter Dialog */}
      <ProductParameterDialog
        isOpen={parameterDialogOpen}
        onClose={() => setParameterDialogOpen(false)}
        product={selectedProductForConfig?.medicalDevice || selectedProductForConfig?.product}
        onSaveParameters={handleSaveProductConfig}
        initialParameters={selectedProductForConfig?.deviceConfiguration}
      />
    </div>
  );
}