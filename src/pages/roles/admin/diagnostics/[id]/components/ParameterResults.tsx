import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Save, CheckCircle, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface ParameterResultsProps {
  parameterValues: any[];
  status: string;
  diagnosticId: string;
}

export function ParameterResults({ parameterValues, status, diagnosticId }: ParameterResultsProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Initialize parameter values from existing data
  React.useEffect(() => {
    const initialValues: Record<string, string> = {};
    parameterValues.forEach(paramValue => {
      initialValues[paramValue.parameterId] = paramValue.value || '';
    });
    setParamValues(initialValues);
  }, [parameterValues]);

  // Mutation for saving parameter values
  const saveParametersMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save parameters');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic', diagnosticId] });
      setIsEditing(false);
      toast({
        title: "Paramètres enregistrés",
        description: "Les valeurs des paramètres ont été mises à jour avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'enregistrement des paramètres.",
        variant: "destructive",
      });
    },
  });

  // Handle parameter value change
  const handleParamChange = (paramId: string, value: string) => {
    setParamValues(prev => ({
      ...prev,
      [paramId]: value,
    }));
  };

  // Handle save parameters
  const handleSaveParameters = () => {
    const parameterData = Object.entries(paramValues).map(([paramId, value]) => ({
      parameterId: paramId,
      value,
    }));
    
    saveParametersMutation.mutate({ parameters: parameterData });
  };

  if (!parameterValues || parameterValues.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Paramètres et Résultats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-gray-500 italic">Aucun paramètre disponible pour cet appareil</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Paramètres et Résultats
        </CardTitle>
        
        {status === "PENDING" && (
          <div>
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Modifier les résultats
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
                <Button 
                  size="sm"
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  onClick={handleSaveParameters}
                  disabled={saveParametersMutation.isPending}
                >
                  {saveParametersMutation.isPending ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                      Enregistrement...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Save className="h-4 w-4 mr-1" />
                      Enregistrer
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {parameterValues.map((paramValue) => {
            // Get parameter details from the relationship
            const param = paramValue.parameter;
            // Since we don't have direct task relationship, we'll use the parameter type to determine status
            const isResultParameter = param.parameterType === 'RESULT';
            const isDueToday = false; // We don't have task due dates directly
            const isTaskOverdue = false;
            
            return (
              <div 
                key={paramValue.id} 
                className={`p-4 rounded-lg border ${isTaskOverdue ? 'border-red-200 bg-red-50' : isDueToday ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{param.title}</h3>
                        {param.parameterType === 'RESULT' && (
                          <p className="text-sm text-gray-600 mt-1">Résultat attendu</p>
                        )}
                        
                        {/* Unit information */}
                        {param.unit && (
                          <div className="text-xs text-gray-500 mt-1">
                            Unité: {param.unit}
                          </div>
                        )}
                        
                        {/* Normal range information */}
                        {(param.minValue !== undefined || param.maxValue !== undefined) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Plage normale: 
                            {param.minValue !== undefined ? ` ${param.minValue}` : ' -'} 
                            {param.maxValue !== undefined ? ` à ${param.maxValue}` : ' et plus'}
                            {param.unit ? ` ${param.unit}` : ''}
                          </div>
                        )}
                        
                        {/* Parameter type information */}
                        {isResultParameter && (
                          <div className="mt-2 flex items-center gap-1">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Résultat à renseigner
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-64">
                    {isEditing ? (
                      param.type === 'TEXT' ? (
                        <Textarea
                          value={paramValues[paramValue.parameterId] || ''}
                          onChange={(e) => handleParamChange(paramValue.parameterId, e.target.value)}
                          placeholder="Entrez le résultat..."
                          className="w-full"
                        />
                      ) : (
                        <Input
                          type={param.type === 'NUMBER' ? 'number' : 'text'}
                          value={paramValues[paramValue.parameterId] || ''}
                          onChange={(e) => handleParamChange(paramValue.parameterId, e.target.value)}
                          placeholder="Entrez le résultat..."
                          className="w-full"
                        />
                      )
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 min-h-[40px]">
                        {paramValue.value ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {paramValue.value} {param.unit}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic text-sm">Résultat non renseigné</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ParameterResults;
