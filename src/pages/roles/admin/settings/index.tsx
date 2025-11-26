import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "../AdminLayout";

function SettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold">Paramètres Généraux</h1>
      </div>

      <Separator className="my-4" />

      <div className="mt-6">
        <GeneralSettings />
      </div>
    </div>
  );
}

// Add layout wrapper
SettingsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default SettingsPage;