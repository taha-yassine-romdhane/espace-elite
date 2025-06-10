import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, User, CreditCard, FileText, Clock, CheckCircle } from 'lucide-react';

interface StepInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  key: string;
}

const RentStepperInfo: React.FC = () => {
  const rentSteps: StepInfo[] = [
    {
      key: "client-selection",
      title: "1. Sélection du Client",
      description: "Identifiez le client qui souhaite louer l'équipement. Vous pouvez rechercher un client existant ou créer un nouveau profil client avec toutes les informations nécessaires.",
      icon: <User className="h-8 w-8 text-green-500" />
    },
    {
      key: "equipment-selection",
      title: "2. Sélection de l'Équipement",
      description: "Choisissez l'équipement à louer parmi l'inventaire disponible. Vérifiez la disponibilité et l'état de l'équipement avant de procéder.",
      icon: <FileText className="h-8 w-8 text-green-500" />
    },
    {
      key: "rental-period",
      title: "3. Période de Location",
      description: "Définissez la durée de la location en spécifiant les dates de début et de fin. Le système calculera automatiquement le coût total en fonction de la durée.",
      icon: <Calendar className="h-8 w-8 text-green-500" />
    },
    {
      key: "payment-terms",
      title: "4. Modalités de Paiement",
      description: "Configurez les modalités de paiement, y compris le dépôt de garantie, le montant initial et les paiements récurrents si la location est à long terme.",
      icon: <CreditCard className="h-8 w-8 text-green-500" />
    },
    {
      key: "contract-review",
      title: "5. Révision du Contrat",
      description: "Passez en revue les termes et conditions du contrat de location avec le client. Assurez-vous que toutes les clauses sont comprises et acceptées.",
      icon: <Clock className="h-8 w-8 text-green-500" />
    },
    {
      key: "confirmation",
      title: "6. Confirmation et Remise",
      description: "Finalisez la location en confirmant tous les détails, générez le contrat et procédez à la remise de l'équipement au client avec vérification de l'état.",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-2">Processus de Location</h2>
        <p className="text-gray-600">
          Le stepper de location vous guide à travers le processus complet de location d'équipement médical,
          de la sélection du client jusqu'à la remise du matériel. Suivez ces étapes pour assurer
          une gestion efficace des locations.
        </p>
      </div>

      <div className="grid gap-6">
        {rentSteps.map((step) => (
          <Card key={step.key} className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 rounded-lg bg-green-50">
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

      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">Points importants pour les locations:</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Vérifiez toujours l'état de l'équipement avant et après la location</li>
          <li>Documentez clairement toute condition préexistante de l'équipement</li>
          <li>Expliquez au client comment utiliser correctement l'équipement</li>
          <li>Assurez-vous que le client comprend les responsabilités en cas de dommage</li>
          <li>Configurez des rappels pour le suivi et le retour de l'équipement</li>
          <li>Vérifiez que tous les accessoires sont inclus lors de la remise et du retour</li>
        </ul>
      </div>
    </div>
  );
};

export default RentStepperInfo;
