import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from 'next-auth/react';
import StockLocations from './components/StockLocations';
import StockTransfers from './components/StockTransfers';
import StockInventory from './components/StockInventory';
import TransferHistory from './components/TransferHistory';

export default function StockPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion du Stock</h1>
          <p className="text-gray-500">Gérez vos emplacements, transferts et inventaire</p>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="locations">Emplacements</TabsTrigger>
          <TabsTrigger value="transfers">Transferts</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <StockInventory />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <StockLocations />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <StockTransfers />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <TransferHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
