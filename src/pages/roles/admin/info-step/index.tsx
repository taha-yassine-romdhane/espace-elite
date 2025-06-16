import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Calendar, Activity } from 'lucide-react';
import SaleStepperInfo from './components/SaleStepperInfo';
import RentStepperInfo from './components/RentStepperInfo';
import DiagnosticStepperInfo from './components/DiagnosticStepperInfo';

const StepperInfoPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Guide des Processus</h1>
        <p className="text-gray-600">
          Cette page fournit des informations détaillées sur les différents processus guidés (steppers) 
          disponibles dans l'application. Chaque processus est conçu pour vous guider étape par étape 
          à travers des tâches complexes.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="sale" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="sale" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Vente</span>
              </TabsTrigger>
              <TabsTrigger value="rent" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Location</span>
              </TabsTrigger>
              <TabsTrigger value="diagnostic" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Diagnostic</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sale" className="mt-0">
              <SaleStepperInfo />
            </TabsContent>
            
            <TabsContent value="rent" className="mt-0">
              <RentStepperInfo />
            </TabsContent>
            
            <TabsContent value="diagnostic" className="mt-0">
              <DiagnosticStepperInfo />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">Remarque importante:</h3>
        <p className="text-gray-700">
          Ces guides sont conçus pour vous aider à comprendre le flux de travail de chaque processus. 
          Pour une formation plus détaillée ou en cas de questions spécifiques, veuillez contacter 
          l'équipe de support technique.
        </p>
      </div>
    </div>
  );
};

export default StepperInfoPage;