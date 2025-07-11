import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiagnosticResultType {
  id: string;
  iah: number | null;
  idValue: number | null;
  remarque: string | null;
  status: string;
}

interface DiagnosticResultDialogProps {
  result: DiagnosticResultType | null;
  trigger?: React.ReactNode; // Optional custom trigger
}

export function DiagnosticResultDialog({ result, trigger }: DiagnosticResultDialogProps) {
  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="sm"
      className="flex items-center justify-start gap-2 p-1 w-full hover:bg-gray-100 rounded-md"
    >
      <ClipboardList className="h-4 w-4 text-blue-600" />
      <span className="text-sm">
        {result ? (
          <span className="text-green-600">Résultats disponibles</span>
        ) : (
          <span className="text-yellow-600">En attente</span>
        )}
      </span>
      <span className="ml-auto text-xs text-gray-500">
        Afficher
      </span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Résultats du diagnostic</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">IAH</h4>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">
                      {result.iah !== null ? result.iah : "Non renseigné"}
                    </span>
                    {result.iah !== null && (
                      <span className="ml-2 text-xs text-gray-500">(Normal: &lt;5)</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">ID</h4>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">
                      {result.idValue !== null ? result.idValue : "Non renseigné"}
                    </span>
                    {result.idValue !== null && (
                      <span className="ml-2 text-xs text-gray-500">(Normal: &lt;10)</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Remarque</h4>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-md border border-gray-100">
                  {result.remarque || "Aucune remarque"}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Statut</h4>
                <div>
                  {result.status === "COMPLETED" ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Complété
                    </Badge>
                  ) : result.status === "PENDING" ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      En attente
                    </Badge>
                  ) : (
                    <Badge variant="outline">{result.status}</Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Résultats en attente</h3>
              <p className="text-gray-500">
                Aucun résultat n'a encore été enregistré pour ce diagnostic.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DiagnosticResultDialog;
