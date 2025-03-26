import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";

interface ParameterValue {
  id?: string;
  value: string;
  parameterId: string;
  medicalDeviceId: string;
}

interface Parameter {
  id?: string;
  title: string;
  type: 'INPUT' | 'CHECKBOX' | 'NUMBER' | 'RANGE';
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isAutomatic?: boolean;
  value?: string;
}

interface ParameterConsumerProps {
  deviceId: string;
  onSubmit: (parameters: Parameter[]) => void;
  initialValues?: Parameter[];
}

export function ParameterConsumer({
  deviceId,
  onSubmit,
  initialValues = []
}: ParameterConsumerProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch parameters for the device
  const { data: fetchedParameters, isLoading: isFetching, error: fetchError } = useQuery({
    queryKey: ['diagnostic-parameters', deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/diagnostic-parameters?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch parameters');
      }
      return response.json();
    },
    enabled: !!deviceId,
  });

  // Fetch existing parameter values
  const { data: existingValues, isLoading: isLoadingValues } = useQuery({
    queryKey: ['parameter-values', deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/parameter-values?medicalDeviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch parameter values');
      }
      return response.json();
    },
    enabled: !!deviceId,
  });

  // Save parameter values mutation
  const { mutate: saveParameterValues, isPending: isSaving } = useMutation({
    mutationFn: async (paramValues: ParameterValue[]) => {
      const response = await fetch('/api/parameter-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parameterValues: paramValues }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save parameter values');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Call the onSubmit callback with updated parameters
      onSubmit(parameters);
    },
    onError: (error) => {
      setError(`Erreur lors de l'enregistrement des paramètres: ${error.message}`);
    }
  });

  // Initialize parameters with fetched data, existing values, or initial values
  useEffect(() => {
    if (fetchedParameters) {
      let mergedParameters = [...fetchedParameters];
      
      // First apply any existing values from the database
      if (existingValues && existingValues.length > 0) {
        mergedParameters = mergedParameters.map((param: Parameter) => {
          const existingValue = existingValues.find((v: ParameterValue) => v.parameterId === param.id);
          return existingValue ? { ...param, value: existingValue.value } : param;
        });
      }
      
      // Then apply any initial values passed to the component (from previous steps)
      if (initialValues && initialValues.length > 0) {
        mergedParameters = mergedParameters.map((param: Parameter) => {
          const initialParam = initialValues.find(p => p.id === param.id || p.title === param.title);
          return initialParam && initialParam.value ? { ...param, value: initialParam.value } : param;
        });
      }
      
      setParameters(mergedParameters);
    } else if (initialValues && initialValues.length > 0) {
      setParameters(initialValues);
    }
  }, [fetchedParameters, existingValues, initialValues]);

  const handleParameterValueChange = (index: number, value: string | number) => {
    const newParameters = [...parameters];
    newParameters[index].value = value.toString();
    setParameters(newParameters);
  };

  const handleSubmit = () => {
    // Check if all required parameters have values
    const missingRequired = parameters.filter(p => p.isRequired && (!p.value || p.value.trim() === ''));
    
    if (missingRequired.length > 0) {
      setError(`Veuillez remplir tous les champs obligatoires: ${missingRequired.map(p => p.title).join(', ')}`);
      return;
    }
    
    setError(null);
    
    // Prepare parameter values for saving to database
    const parameterValues = parameters
      .filter(p => p.id && p.value)
      .map(p => ({
        parameterId: p.id!,
        medicalDeviceId: deviceId,
        value: p.value!
      }));
    
    // Save to database
    saveParameterValues(parameterValues);
  };

  const renderParameterInput = (parameter: Parameter, index: number) => {
    const isRequired = parameter.isRequired;
    
    switch (parameter.type) {
      case 'CHECKBOX':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={parameter.value === 'true'}
              onCheckedChange={(checked) => 
                handleParameterValueChange(index, checked.toString())
              }
            />
            <Label>Oui</Label>
          </div>
        );
      case 'RANGE':
        return (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{parameter.minValue || 0}</span>
              <span>{parameter.unit}</span>
              <span>{parameter.maxValue || 100}</span>
            </div>
            <Slider
              min={parameter.minValue || 0}
              max={parameter.maxValue || 100}
              step={1}
              value={[parameter.value ? parseFloat(parameter.value) : parameter.minValue || 0]}
              onValueChange={(value) => handleParameterValueChange(index, value[0].toString())}
            />
            <div className="text-center text-sm font-medium">
              {parameter.value || parameter.minValue || 0} {parameter.unit}
            </div>
          </div>
        );
      case 'NUMBER':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={parameter.value || ''}
              min={parameter.minValue}
              max={parameter.maxValue}
              onChange={(e) => handleParameterValueChange(index, e.target.value)}
              placeholder={`Valeur${isRequired ? ' *' : ''}`}
              className={`flex-1 ${isRequired ? 'border-red-300' : ''}`}
            />
            {parameter.unit && (
              <span className="text-sm text-gray-500 min-w-[60px]">{parameter.unit}</span>
            )}
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={parameter.value || ''}
            onChange={(e) => handleParameterValueChange(index, e.target.value)}
            placeholder={`Valeur${isRequired ? ' *' : ''}`}
            className={isRequired ? 'border-red-300' : ''}
          />
        );
    }
  };

  if (isFetching || isLoadingValues) {
    return (
      <div className="py-8 text-center flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des paramètres. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Aucun paramètre disponible pour ce dispositif.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {parameters.map((parameter, index) => (
          <div key={index} className="p-4 border rounded-md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium flex items-center">
                  {parameter.title}
                  {parameter.isRequired && <span className="text-red-500 ml-1">*</span>}
                </h4>
                {parameter.unit && (
                  <p className="text-sm text-gray-500">Unité: {parameter.unit}</p>
                )}
              </div>
            </div>
            {renderParameterInput(parameter, index)}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Sauvegarder les paramètres'
          )}
        </Button>
      </div>
    </div>
  );
}
