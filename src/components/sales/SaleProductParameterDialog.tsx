import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Settings, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaleProductParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: any; // The selected medical device article
  onParametersSaved: (articleId: string, parameters: any) => void;
}

export function SaleProductParameterDialog({
  open,
  onOpenChange,
  article,
  onParametersSaved
}: SaleProductParameterDialogProps) {
  const { toast } = useToast();

  const [parameters, setParameters] = useState<Record<string, any>>({});

  // Fetch device parameter template
  const { data: deviceData, isLoading } = useQuery({
    queryKey: ['medical-device', article?.medicalDeviceId],
    queryFn: async () => {
      if (!article?.medicalDeviceId) return null;
      const response = await fetch(`/api/medical-devices/${article.medicalDeviceId}`);
      if (!response.ok) throw new Error('Failed to fetch device');
      return response.json();
    },
    enabled: open && !!article?.medicalDeviceId,
  });

  // Fetch device parameters (templates)
  const { data: paramTemplatesData } = useQuery({
    queryKey: ['device-parameters', deviceData?.id],
    queryFn: async () => {
      if (!deviceData?.id) return [];
      const response = await fetch(`/api/device-parameters?medicalDeviceId=${deviceData.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && !!deviceData?.id,
  });

  const paramTemplates = Array.isArray(paramTemplatesData) ? paramTemplatesData : [];

  // Initialize parameters from existing or create new
  useEffect(() => {
    if (article?.parameters) {
      setParameters(article.parameters);
    } else if (paramTemplates.length > 0) {
      // Initialize with empty values
      const initial: Record<string, any> = {};
      paramTemplates.forEach((template: any) => {
        initial[template.parameterName] = template.defaultValue || '';
      });
      setParameters(initial);
    }
  }, [article, paramTemplates]);

  const updateParameter = (name: string, value: any) => {
    setParameters({ ...parameters, [name]: value });
  };

  const handleSubmit = () => {
    // Validate required parameters
    const missingRequired = paramTemplates.filter((template: any) =>
      template.required && !parameters[template.parameterName]
    );

    if (missingRequired.length > 0) {
      toast({
        title: 'Erreur',
        description: `Paramètres requis manquants: ${missingRequired.map((t: any) => t.parameterName).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    onParametersSaved(article.id, parameters);
    handleClose();
  };

  const handleClose = () => {
    setParameters({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Configuration de l'Appareil
          </DialogTitle>
          <DialogDescription>
            {article?.name} - Paramètres du dispositif médical
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-2">
          {/* Device Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-900">{article?.name}</h3>
                {article?.code && (
                  <p className="text-sm text-purple-700 mt-1">Code: {article.code}</p>
                )}
                {article?.serialNumber && (
                  <p className="text-sm text-purple-700">SN: {article.serialNumber}</p>
                )}
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                Appareil Médical
              </Badge>
            </div>
          </div>

          {/* Info Alert */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Configuration requise pour les patients</p>
              <p>Ces paramètres seront associés à l'appareil vendu au patient</p>
            </div>
          </div>

          {/* Parameters Form */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement des paramètres...
            </div>
          ) : paramTemplates.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Aucun paramètre configuré</p>
              <p className="text-sm text-gray-500 mt-1">
                Cet appareil n'a pas de modèle de paramètres défini.
                <br />
                Vous pouvez continuer sans configuration ou ajouter des paramètres manuellement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Paramètres du Dispositif ({paramTemplates.length})
              </h3>
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4">
                  {paramTemplates.map((template: any) => (
                    <div key={template.id} className="space-y-2 border-b pb-4">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {template.parameterName}
                        {template.required && <span className="text-red-500">*</span>}
                        {template.unit && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            {template.unit}
                          </Badge>
                        )}
                      </label>
                      {template.description && (
                        <p className="text-xs text-gray-500">{template.description}</p>
                      )}

                      {template.parameterType === 'NUMBER' ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={parameters[template.parameterName] || ''}
                          onChange={(e) => updateParameter(template.parameterName, e.target.value)}
                          placeholder={template.defaultValue || 'Entrez une valeur'}
                        />
                      ) : template.parameterType === 'TEXT' ? (
                        <Input
                          type="text"
                          value={parameters[template.parameterName] || ''}
                          onChange={(e) => updateParameter(template.parameterName, e.target.value)}
                          placeholder={template.defaultValue || 'Entrez un texte'}
                        />
                      ) : template.parameterType === 'BOOLEAN' ? (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={template.parameterName}
                              checked={parameters[template.parameterName] === true}
                              onChange={() => updateParameter(template.parameterName, true)}
                              className="w-4 h-4 text-green-600"
                            />
                            <span className="text-sm">Oui</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={template.parameterName}
                              checked={parameters[template.parameterName] === false}
                              onChange={() => updateParameter(template.parameterName, false)}
                              className="w-4 h-4 text-green-600"
                            />
                            <span className="text-sm">Non</span>
                          </label>
                        </div>
                      ) : (
                        <Input
                          type="text"
                          value={parameters[template.parameterName] || ''}
                          onChange={(e) => updateParameter(template.parameterName, e.target.value)}
                          placeholder={template.defaultValue || 'Entrez une valeur'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {paramTemplates.length === 0 ? 'Continuer sans configuration' : 'Enregistrer la configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
