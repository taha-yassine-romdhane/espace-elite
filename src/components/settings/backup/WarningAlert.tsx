import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function WarningAlert() {
  return (
    <>
      <Separator className="my-6" />
      
      <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">Attention</h3>
          <p className="text-amber-700 text-sm">
            La restauration de la base de données remplacera toutes les données actuelles. 
            Cette opération est irréversible. Assurez-vous de créer une sauvegarde avant de procéder.
          </p>
        </div>
      </div>
    </>
  );
}
