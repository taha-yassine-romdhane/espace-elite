import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, CreditCard, ClipboardCheck, Banknote, FileText, FileSpreadsheet, Building, FileCheck } from 'lucide-react';

interface StepInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  key: string;
}

const SaleStepperInfo: React.FC = () => {
  const saleSteps: StepInfo[] = [
    {
      key: "client-info",
      title: "1. Informations Client",
      description: "Entrez ou sélectionnez les informations du client. Si c'est un nouveau client, vous devrez remplir tous les champs requis incluant les coordonnées complètes et les préférences. Pour un client existant, vous pouvez rechercher par nom, numéro de téléphone ou identifiant unique.",
      icon: <ClipboardCheck className="h-8 w-8 text-blue-500" />
    },
    {
      key: "product-selection",
      title: "2. Sélection des Produits",
      description: "Sélectionnez les produits que le client souhaite acheter. Vous pouvez rechercher par nom, catégorie ou code produit. Le système vérifie automatiquement la disponibilité en stock et calcule le prix total incluant les remises applicables et les taxes.",
      icon: <ShoppingCart className="h-8 w-8 text-blue-500" />
    },
    {
      key: "payment",
      title: "3. Paiement",
      description: "Choisissez le mode de paiement et entrez les détails nécessaires. Notre système permet de combiner plusieurs méthodes de paiement pour une seule transaction et offre un suivi complet des paiements partiels et complets.",
      icon: <CreditCard className="h-8 w-8 text-blue-500" />
    }
  ];
  
  const paymentTypes = [
    {
      key: "especes",
      title: "Paiement en Espèces",
      description: "Permet d'enregistrer les paiements en espèces avec option d'acompte. Le système calcule automatiquement la monnaie à rendre et génère un reçu.",
      icon: <Banknote className="h-6 w-6 text-green-600" />
    },
    {
      key: "cheque",
      title: "Paiement par Chèque",
      description: "Enregistre les informations du chèque incluant le numéro, la banque émettrice et la date d'encaissement. Permet le suivi des chèques en attente.",
      icon: <CreditCard className="h-6 w-6 text-blue-600" />
    },
    {
      key: "virement",
      title: "Virement Bancaire",
      description: "Gère les paiements par virement avec suivi des références de transaction et dates de valeur. Permet de marquer les virements comme reçus ou en attente.",
      icon: <Building className="h-6 w-6 text-indigo-600" />
    },
    {
      key: "cnam",
      title: "CNAM",
      description: "Spécifique aux remboursements d'assurance maladie. Enregistre les numéros de dossier CNAM et les montants pris en charge.",
      icon: <FileCheck className="h-6 w-6 text-red-600" />
    },
    {
      key: "mandat",
      title: "Mandat",
      description: "Pour les paiements par mandat postal. Enregistre le numéro de mandat, le bureau d'émission et la date.",
      icon: <FileText className="h-6 w-6 text-orange-600" />
    },
    {
      key: "traite",
      title: "Traite",
      description: "Gère les paiements par traite avec échéancier. Permet de suivre les dates d'échéance et les statuts de paiement.",
      icon: <FileSpreadsheet className="h-6 w-6 text-purple-600" />
    }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Processus de Vente</h2>
        <p className="text-gray-600">
          Notre système de vente est structuré en trois étapes principales, avec une attention particulière 
          portée au mécanisme de paiement flexible qui permet de gérer diverses méthodes de paiement et 
          de suivre efficacement toutes les transactions.
        </p>
      </div>

      {/* Main Sale Steps */}
      <div className="grid gap-6">
        <h3 className="text-xl font-semibold text-blue-700">Étapes Principales</h3>
        {saleSteps.map((step) => (
          <Card key={step.key} className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 rounded-lg bg-blue-50">
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

      {/* Payment System Details */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-blue-700 mb-4">Système de Paiement</h3>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 mb-4">
              Notre mécanisme de paiement est conçu pour offrir une flexibilité maximale tout en assurant un suivi rigoureux. 
              Voici les principales caractéristiques :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
              <li><span className="font-medium">Paiements multiples</span> : Possibilité de combiner plusieurs méthodes de paiement pour une seule transaction</li>
              <li><span className="font-medium">Paiements partiels</span> : Suivi des acomptes et paiements échelonnés avec historique complet</li>
              <li><span className="font-medium">Récapitulatif automatique</span> : Calcul en temps réel du montant restant à payer</li>
              <li><span className="font-medium">Gestion des remboursements</span> : Traitement des annulations et remboursements partiels ou complets</li>
              <li><span className="font-medium">Historique détaillé</span> : Accès à l'historique complet des transactions par client</li>
            </ul>
          </CardContent>
        </Card>

        {/* Payment Types */}
        <h3 className="text-lg font-semibold text-blue-700 mb-4">Types de Paiement Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {paymentTypes.map((type) => (
            <Card key={type.key} className="h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-1 rounded-md bg-gray-50">
                  {type.icon}
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-700">{type.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Management */}
        <Card className="border-t-4 border-t-blue-500 mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Gestion des Paiements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Le système de gestion des paiements offre plusieurs fonctionnalités avancées :
            </p>
            <div className="grid gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Classification des Paiements</h4>
                <p className="text-sm text-gray-700">Les paiements sont classés par type, date, montant et statut (complet, partiel, en attente, validé). Cette classification permet un filtrage et une recherche efficaces.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Suivi des Échéances</h4>
                <p className="text-sm text-gray-700">Pour les paiements différés (chèques, traites), le système génère automatiquement un calendrier d'échéances et envoie des rappels avant chaque date d'encaissement.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Rapports Financiers</h4>
                <p className="text-sm text-gray-700">Génération de rapports détaillés sur les flux de trésorerie, les paiements en attente et les prévisions d'encaissement, avec visualisation graphique des tendances.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Intégration Comptable</h4>
                <p className="text-sm text-gray-700">Les données de paiement sont automatiquement intégrées au module comptable, assurant une cohérence entre les ventes et la comptabilité générale.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Bonnes Pratiques pour la Gestion des Paiements:</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Vérifiez toujours l'identité du payeur pour les transactions importantes</li>
          <li>Pour les paiements par chèque, notez le numéro de téléphone du client au dos du chèque</li>
          <li>Documentez clairement les accords de paiement échelonné avec le client</li>
          <li>Effectuez une réconciliation quotidienne des paiements reçus</li>
          <li>Utilisez les filtres de recherche pour retrouver rapidement l'historique des paiements d'un client</li>
          <li>Consultez régulièrement le tableau de bord des paiements en attente</li>
        </ul>
      </div>
    </div>
  );
};

export default SaleStepperInfo;
