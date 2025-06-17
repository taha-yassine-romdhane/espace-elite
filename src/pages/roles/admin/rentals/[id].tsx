import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import components
import RentalDetailsPatientInfo from './components/RentalDetailsPatientInfo';
import RentalDetailsPaymentInfo from './components/RentalDetailsPaymentInfo';
import RentalDetailsCNAMSteps from './components/RentalDetailsCNAMSteps';
import RentalDetailsDeviceConfig from './components/RentalDetailsDeviceConfig';

export default function RentalDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const rentalId = typeof id === 'string' ? id : '';

  // Fetch rental data
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

  const handleBack = () => {
    router.push('/roles/admin/dashboard');
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

  // Format rental duration in days
  const calculateDuration = () => {
    if (!rental.startDate || !rental.endDate) return '-';
    const start = new Date(rental.startDate);
    const end = new Date(rental.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jours`;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <h1 className="text-3xl font-bold mb-6 text-blue-900">Détails de la Location</h1>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
          {rental.payment?.method === 'CNAM' && (
            <TabsTrigger value="cnam">Dossier CNAM</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Rental Period Information */}
          <Card>
            <CardHeader>
              <CardTitle>Période de Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <CalendarRange className="h-5 w-5 mr-2 text-blue-600" />
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-700">Date de début</h3>
                      <p>{rental.startDate ? new Date(rental.startDate).toLocaleDateString('fr-TN') : '-'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Date de fin</h3>
                      <p>{rental.endDate ? new Date(rental.endDate).toLocaleDateString('fr-TN') : '-'}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium text-gray-700">Durée</h3>
                    <p>{calculateDuration()}</p>
                  </div>
                </div>
              </div>

              {rental.notes && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-1">Notes</h4>
                  <p className="text-sm text-gray-700">{rental.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <RentalDetailsPatientInfo patient={rental.patient} />

            {/* Device Configuration */}
            <RentalDetailsDeviceConfig 
              medicalDevice={rental.medicalDevice} 
              deviceParameters={rental.deviceParameters || rental.medicalDevice?.parameters} 
            />
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <RentalDetailsPaymentInfo payment={rental.payment} />
        </TabsContent>

        {rental.payment?.method === 'CNAM' && (
          <TabsContent value="cnam" className="space-y-6">
            <RentalDetailsCNAMSteps 
              payment={rental.payment} 
              paymentDetails={rental.payment?.paymentDetails} 
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
