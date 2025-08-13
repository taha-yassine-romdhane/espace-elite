import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  CalendarRange, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Package, 
  CreditCard,
  Clock,
  Settings,
  FileText,
  AlertTriangle,
  History,
  PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

// Import enhanced components
import EnhancedRentalOverview from '@/components/rentals/EnhancedRentalOverview';
import CNAMBondsManagement from '@/components/rentals/CNAMBondsManagement';
import RentalPeriodsManagement from '@/components/rentals/RentalPeriodsManagement';
import RentalDeviceParameters from '@/components/rentals/RentalDeviceParameters';

export default function RentalDetailsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { id } = router.query;
  const rentalId = typeof id === 'string' ? id : '';

  // Fetch rental data with enhanced relationships
  const { data: rental, isLoading, error } = useQuery({
    queryKey: ['rental', rentalId],
    queryFn: async () => {
      if (!rentalId) return null;
      
      const response = await fetch(`/api/rentals/${rentalId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rental details');
      }
      
      const data = await response.json();
      return data.rental;
    },
    enabled: !!rentalId,
  });

  // Mutation for updating rental data
  const updateRentalMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update rental');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental', rentalId] });
      toast({
        title: "Location mise à jour",
        description: "Les modifications ont été sauvegardées avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
      });
    },
  });

  const handleBack = () => {
    router.push('/roles/admin/dashboard');
  };

  const handleUpdateRental = (updateData: any) => {
    updateRentalMutation.mutate(updateData);
  };

  const handleUpdateCNAMBonds = (bonds: any[]) => {
    handleUpdateRental({ cnamBonds: bonds });
  };

  const handleUpdateRentalPeriods = (periods: any[]) => {
    handleUpdateRental({ rentalPeriods: periods });
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement des détails de la location...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Impossible de charger les détails de cette location. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert>
          <AlertDescription>
            Location non trouvée. Elle a peut-être été supprimée.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            ID: {rental.id}
          </Badge>
          {rental.configuration?.urgentRental && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgent
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion de Location
          </h1>
          <p className="text-gray-600">
            {rental.medicalDevice?.name} - {rental.patient ? 
              `${rental.patient.firstName} ${rental.patient.lastName}` : 
              rental.company?.companyName
            }
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="cnam" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Bonds CNAM
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Finances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EnhancedRentalOverview 
            rental={rental} 
            onUpdate={handleUpdateRental}
          />
        </TabsContent>

        <TabsContent value="cnam" className="space-y-6">
          <CNAMBondsManagement 
            rental={rental}
            cnamBonds={rental.cnamBonds || []}
            onUpdate={handleUpdateCNAMBonds}
          />
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
          <RentalPeriodsManagement 
            rental={rental}
            rentalPeriods={rental.rentalPeriods || []}
            onUpdate={handleUpdateRentalPeriods}
          />
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6">
          <RentalDeviceParameters 
            rental={rental}
            deviceParameters={
              // TODO: Fetch proper device parameters from MedicalDeviceParametre table
              // For now, show accessories information
              rental.accessories?.reduce((params: any, accessory: any) => {
                params[accessory.productId] = {
                  productName: accessory.product?.name || 'Accessoire',
                  quantity: accessory.quantity,
                  unitPrice: accessory.unitPrice,
                  type: 'ACCESSORY'
                };
                return params;
              }, {}) || {}
            }
          />
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Location</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rental.configuration?.totalPaymentAmount?.toFixed(2) || '0.00'} TND
                </div>
                <p className="text-xs text-muted-foreground">
                  Montant total des périodes facturées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dépôt de Garantie</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rental.configuration?.depositAmount?.toFixed(2) || '0.00'} TND
                </div>
                <p className="text-xs text-muted-foreground">
                  {rental.configuration?.depositMethod || 'Aucun dépôt'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Couverture CNAM</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(rental.cnamBonds?.reduce((sum: number, bond: any) => sum + Number(bond.totalAmount), 0) || 0).toFixed(2)} TND
                </div>
                <p className="text-xs text-muted-foreground">
                  {rental.cnamBonds?.length || 0} bond(s) CNAM
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {rental.payment ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{rental.payment.method}</div>
                      <div className="text-sm text-gray-600">
                        Statut: {rental.payment.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{rental.payment.amount} TND</div>
                      <div className="text-sm text-gray-600">
                        {new Date(rental.payment.createdAt || rental.createdAt).toLocaleDateString('fr-TN')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun paiement enregistré
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Status Indicator */}
      {updateRentalMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sauvegarde en cours...
        </div>
      )}
    </div>
  );
}
