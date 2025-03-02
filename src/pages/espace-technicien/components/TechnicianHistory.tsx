import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallationsHistory } from "./InstallationsHistory";
import { PaymentsHistory } from "./PaymentsHistory";
import { TransfersHistory } from "./TransfersHistory";
import { TasksHistory } from "./TasksHistory";
import { Button } from "@/components/ui/button";

interface TechnicianHistoryProps {
  technicianId: string;
}

export function TechnicianHistory({ technicianId }: TechnicianHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Portail Technicien</h2>
          <div className="flex space-x-4 mt-2">
            <span className="text-sm text-muted-foreground">Historique Technicien</span>
            <span className="text-sm text-muted-foreground">Espace Technicien</span>
          </div>
        </div>
        <Button variant="outline">Retour</Button>
      </div>

      <Tabs defaultValue="installations" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="installations">Installations</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="transfers">Transferts</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="installations">
          <InstallationsHistory technicianId={technicianId} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsHistory technicianId={technicianId} />
        </TabsContent>

        <TabsContent value="transfers">
          <TransfersHistory technicianId={technicianId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksHistory technicianId={technicianId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
