import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SaleDetailsTabsWithCNAM from '../dashboard/components/sales/SaleDetailsTabsWithCNAM';

export default function SaleDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const saleId = typeof id === 'string' ? id : '';

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

  const handleBack = () => {
    router.push('/roles/admin/dashboard');
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

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Impossible de charger les détails de cette vente. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert>
          <AlertDescription>
            Vente non trouvée. Elle a peut-être été supprimée.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <h1 className="text-3xl font-bold mb-6 text-blue-900">Détails de la Vente</h1>

      <SaleDetailsTabsWithCNAM saleId={saleId}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Référence</h3>
                <p>{sale.reference || '-'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Date</h3>
                <p>{new Date(sale.createdAt).toLocaleDateString('fr-TN')}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Statut</h3>
                <p>{sale.status}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Montant Total</h3>
                <p>{typeof sale?.totalAmount === 'number' ? sale.totalAmount.toFixed(3) : parseFloat(String(sale?.totalAmount || 0)).toFixed(3)} DT</p>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sale.patient ? (
                <>
                  <div>
                    <h3 className="font-medium text-gray-700">Type</h3>
                    <p>Patient</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Nom</h3>
                    <p>{`${sale.patient.firstName} ${sale.patient.lastName}`}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Téléphone</h3>
                    <p>{sale.patient.telephone || '-'}</p>
                  </div>
                  {sale.patient.telephoneTwo && (
                    <div>
                      <h3 className="font-medium text-gray-700">Téléphone 2</h3>
                      <p>{sale.patient.telephoneTwo}</p>
                    </div>
                  )}
                  {sale.patient.cin && (
                    <div>
                      <h3 className="font-medium text-gray-700">CIN</h3>
                      <p>{sale.patient.cin}</p>
                    </div>
                  )}
                  {sale.patient.cnamId && (
                    <div>
                      <h3 className="font-medium text-gray-700">ID CNAM</h3>
                      <p>{sale.patient.cnamId}</p>
                    </div>
                  )}
                  {sale.patient.address && (
                    <div>
                      <h3 className="font-medium text-gray-700">Adresse</h3>
                      <p>{sale.patient.address}</p>
                    </div>
                  )}
                  {sale.patient.affiliation && (
                    <div>
                      <h3 className="font-medium text-gray-700">Affiliation</h3>
                      <p>{sale.patient.affiliation}</p>
                    </div>
                  )}
                  {sale.patient.beneficiaryType && (
                    <div>
                      <h3 className="font-medium text-gray-700">Type de bénéficiaire</h3>
                      <p>{sale.patient.beneficiaryType}</p>
                    </div>
                  )}
                </>
              ) : sale.company ? (
                <>
                  <div>
                    <h3 className="font-medium text-gray-700">Type</h3>
                    <p>Entreprise</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Nom</h3>
                    <p>{sale.company.companyName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Contact</h3>
                    <p>{sale.company.contactName || '-'}</p>
                  </div>
                </>
              ) : (
                <p>Aucune information client disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Produits</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.items && sale.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border-b">Produit</th>
                        <th className="text-left p-2 border-b">Quantité</th>
                        <th className="text-left p-2 border-b">Prix Unitaire</th>
                        <th className="text-left p-2 border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div className="font-medium">{item.medicalDevice?.name || 'Produit inconnu'}</div>
                            {item.product?.category && (
                              <div className="text-xs text-gray-500">Catégorie: {item.product.category.name}</div>
                            )}
                            {item.medicalDevice && (
                              <div className="mt-1 text-sm">
                                {item.medicalDevice.name && (
                                  <div className="text-xs">Nom: {item.medicalDevice.name}</div>
                                )}
                                {item.medicalDevice.model && (
                                  <div className="text-xs">Modèle: {item.medicalDevice.model}</div>
                                )}
                                {item.medicalDevice.serialNumber && (
                                  <div className="text-xs">N° Série: {item.medicalDevice.serialNumber}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">{typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(3) : parseFloat(String(item.unitPrice || 0)).toFixed(3)} DT</td>
                          <td className="p-2">{typeof item.quantity === 'number' && typeof item.unitPrice === 'number' ? 
                            (item.quantity * item.unitPrice).toFixed(3) : 
                            (parseFloat(String(item.quantity || 0)) * parseFloat(String(item.unitPrice || 0))).toFixed(3)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td className="p-2" colSpan={3}>Total</td>
                        <td className="p-2">{typeof sale?.totalAmount === 'number' ? sale.totalAmount.toFixed(3) : parseFloat(String(sale?.totalAmount || 0)).toFixed(3)} DT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Aucun produit dans cette vente</p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              
              {sale?.payment ? (
                <div className="overflow-x-auto">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg">Résumé du paiement</h3>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Montant total:</span>
                        <span className="font-medium">{typeof sale?.totalAmount === 'number' ? sale.totalAmount.toFixed(3) : parseFloat(String(sale?.totalAmount || 0)).toFixed(3)} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Statut:</span>
                        <span className="font-medium">{sale?.payment?.status || 'Non spécifié'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-lg mt-6 mb-3">Détails des paiements</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border-b">Méthode</th>
                        <th className="text-left p-2 border-b">Montant</th>
                        <th className="text-left p-2 border-b">Date</th>
                        <th className="text-left p-2 border-b">Détails</th>
                      </tr>
                    </thead>
                    <tbody>                      
                      {/* Payment details */}
                      {sale?.payment?.paymentDetails?.map((detail: any, idx: number) => {
                        // Log the detail object for debugging
                        console.log(`Payment Detail [${idx}]:`, detail);
                        
                        // Extract date from payment ID (format: 'payment-{timestamp}') or use available date fields
                        const extractDateFromId = (id: string) => {
                          const timestamp = id.replace('payment-', '');
                          const timestampNum = parseInt(timestamp, 10);
                          return !isNaN(timestampNum) ? new Date(timestampNum) : null;
                        };
                        
                        // Try to get date from various possible fields, then fall back to ID
                        const dateFromId = extractDateFromId(detail?.id || '');
                        let dateValue = detail?.date || detail?.createdAt || detail?.timestamp || detail?.paymentDate || dateFromId;
                        
                        return (
                          <tr key={idx} className={`border-b ${detail?.method?.toLowerCase() === 'cnam' ? 'bg-blue-50' : ''}`}>
                            <td className="p-2">
                              {detail?.method}
                              {detail?.method?.toLowerCase() === 'cnam' && detail?.etatDossier && (
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  detail?.etatDossier === 'accepte' ? 'bg-green-100 text-green-800' : 
                                  detail?.etatDossier === 'refuse' ? 'bg-red-100 text-red-800' : 
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {detail?.etatDossier === 'accepte' ? 'Accepté' : 
                                   detail?.etatDossier === 'refuse' ? 'Refusé' : 
                                   detail?.etatDossier === 'en_attente' ? 'En attente' : 
                                   detail?.etatDossier === 'en_cours' ? 'En cours' : 
                                   detail?.etatDossier === 'complement_dossier' ? 'Complément requis' : 
                                   detail?.etatDossier}
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              {typeof detail?.amount === 'number' 
                                ? detail.amount.toFixed(3) 
                                : parseFloat(String(detail?.amount || 0)).toFixed(3)} DT
                            </td>
                            <td className="p-2">
                              {dateValue 
                                ? new Date(dateValue).toLocaleDateString('fr-TN') 
                                : '-'}
                            </td>
                            <td className="p-2">
                              {detail?.classification && <span className="mr-2">{detail.classification}</span>}
                              {detail?.reference && <span className="text-gray-500">Réf: {detail.reference}</span>}
                              {detail?.dossierReference && <span className="block text-blue-600">Dossier: {detail.dossierReference}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* CNAM Specific Information if present */}
                  {sale?.payment?.paymentDetails?.some((detail: any) => detail?.method?.toLowerCase() === 'cnam') && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h4 className="font-medium mb-2 text-blue-800">Information CNAM</h4>
                      <p className="text-sm text-blue-700">Cette vente contient des paiements CNAM. Consultez l'onglet "Dossiers CNAM" pour plus de détails et la gestion des dossiers.</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Aucun paiement enregistré pour cette vente</p>
              )}
            </CardContent>
          </Card>
        </div>
      </SaleDetailsTabsWithCNAM>
    </div>
  );
}
