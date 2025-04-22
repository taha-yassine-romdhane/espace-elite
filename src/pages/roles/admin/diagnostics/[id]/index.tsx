import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Printer, Edit, AlertCircle, History, FileText } from "lucide-react";
import { DiagnosticHeader } from "./components/DiagnosticHeader";
import { PatientInformation } from "./components/PatientInformation";
import { DeviceInformation } from "./components/DeviceInformation";
import { ParameterResults } from "./components/ParameterResults";
import { DiagnosticNotes } from "./components/DiagnosticNotes";
import { DiagnosticTasks } from "./components/DiagnosticTasks";

export default function DiagnosticDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  // Fetch diagnostic details
  const { data: diagnostic, isLoading, error } = useQuery({
    queryKey: ["diagnostic", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/diagnostics/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch diagnostic details");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-gray-600">Chargement des détails du diagnostic...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
          </div>
          <p className="text-gray-700 mb-4">
            Une erreur s'est produite lors du chargement des détails du diagnostic.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Handle not found
  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">Diagnostic non trouvé</h2>
          <p className="text-gray-700 mb-4">
            Le diagnostic que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/roles/admin/dashboard")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/roles/admin/dashboard">Tableau de bord</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Diagnostic</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" aria-current="page">Détails</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            {diagnostic.status === "PENDING" && (
              <Button
                className="bg-blue-900 hover:bg-blue-800 text-white flex items-center"
                onClick={() => router.push(`/roles/admin/diagnostics/${id}/results`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Saisir les résultats
              </Button>
            )}
          </div>
        </div>

        {/* Diagnostic Header */}
        <DiagnosticHeader diagnostic={diagnostic} />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="border-b border-gray-200 w-full rounded-none px-6 bg-gray-50">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="parameters">Paramètres et Résultats</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PatientInformation patient={diagnostic.patient} />
                <DeviceInformation device={diagnostic.medicalDevice} />
              </div>
              <DiagnosticNotes notes={diagnostic.notes} />
            </TabsContent>
            
            <TabsContent value="parameters" className="p-6">
              <ParameterResults 
                parameterValues={diagnostic.parameterValues || []} 
                status={diagnostic.status}
                diagnosticId={id as string}
              />
            </TabsContent>
            
            <TabsContent value="history" className="p-6">
              <Card>
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Historique
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-gray-500 italic">L'historique n'est pas disponible pour le moment</div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks" className="p-6">
              <DiagnosticTasks 
                diagnosticId={id as string} 
                resultDueDate={diagnostic.resultDueDate}
                patientId={diagnostic.patient?.id}
              />
            </TabsContent>
            
            <TabsContent value="documents" className="p-6">
              <Card>
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-gray-500 italic">Les documents ne sont pas disponibles pour le moment</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
