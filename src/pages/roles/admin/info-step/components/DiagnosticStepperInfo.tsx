import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stethoscope, ClipboardList, FileSearch, Activity, FileText, CheckCircle } from 'lucide-react';

interface StepInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  key: string;
}

const DiagnosticStepperInfo: React.FC = () => {
  const diagnosticSteps: StepInfo[] = [
    {
      key: "patient-info",
      title: "1. Informations Patient",
      description: "Enregistrez ou sélectionnez les informations du patient. Pour un nouveau patient, collectez toutes les données personnelles et médicales nécessaires. Pour un patient existant, vérifiez et mettez à jour les informations si nécessaire.",
      icon: <ClipboardList className="h-8 w-8 text-purple-500" />
    },
    {
      key: "diagnostic-type",
      title: "2. Type de Diagnostic",
      description: "Sélectionnez le type de diagnostic à réaliser en fonction des besoins du patient et des symptômes présentés. Chaque type de diagnostic peut nécessiter des équipements ou des procédures spécifiques.",
      icon: <FileSearch className="h-8 w-8 text-purple-500" />
    },
    {
      key: "examination",
      title: "3. Examen et Mesures",
      description: "Procédez à l'examen du patient et prenez les mesures nécessaires. Enregistrez toutes les données pertinentes dans le système pour une analyse précise.",
      icon: <Stethoscope className="h-8 w-8 text-purple-500" />
    },
    {
      key: "results-analysis",
      title: "4. Analyse des Résultats",
      description: "Analysez les résultats des examens et des mesures. Le système peut fournir des indications basées sur les données collectées pour aider à l'interprétation.",
      icon: <Activity className="h-8 w-8 text-purple-500" />
    },
    {
      key: "report-generation",
      title: "5. Génération du Rapport",
      description: "Générez un rapport détaillé du diagnostic avec toutes les observations, mesures et recommandations. Ce rapport peut être personnalisé selon les besoins spécifiques.",
      icon: <FileText className="h-8 w-8 text-purple-500" />
    },
    {
      key: "conclusion",
      title: "6. Conclusion et Suivi",
      description: "Finalisez le diagnostic avec une conclusion et des recommandations de suivi. Planifiez les prochaines étapes si nécessaire, comme des rendez-vous de suivi ou des traitements.",
      icon: <CheckCircle className="h-8 w-8 text-purple-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Processus de Diagnostic</h2>
        <p className="text-gray-600">
          Le stepper de diagnostic vous guide à travers le processus complet d'évaluation médicale,
          de l'enregistrement du patient jusqu'à la conclusion et aux recommandations. Suivez ces étapes
          pour assurer un diagnostic précis et complet.
        </p>
      </div>

      <div className="grid gap-6">
        {diagnosticSteps.map((step) => (
          <Card key={step.key} className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 rounded-lg bg-purple-50">
                {step.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-700">{step.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-800 mb-2">Bonnes pratiques pour les diagnostics:</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Assurez-vous d'avoir un historique médical complet du patient</li>
          <li>Documentez toutes les observations avec précision</li>
          <li>Calibrez les équipements de diagnostic avant chaque utilisation</li>
          <li>Expliquez clairement la procédure au patient avant de commencer</li>
          <li>Conservez tous les résultats bruts pour référence future</li>
          <li>Utilisez un langage clair et accessible dans les rapports destinés aux patients</li>
        </ul>
      </div>
    </div>
  );
};

export default DiagnosticStepperInfo;
