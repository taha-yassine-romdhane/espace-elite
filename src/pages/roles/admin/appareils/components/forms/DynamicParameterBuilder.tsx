import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";

interface Parameter {
  id?: string;
  title: string;
  type: 'INPUT' | 'CHECKBOX' | 'NUMBER' | 'RANGE' | 'DATE'; // Added DATE type
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isAutomatic?: boolean;
  value?: string;
  parameterType: 'PARAMETER' | 'RESULT'; // Field to distinguish between parameters and results
  
  resultDueDays?: number; // Number of days after which the result is expected
  resultDueDate?: string; // Calculated date when the result is expected (not directly input by user)
}

interface DynamicParameterBuilderProps {
  onParameterSave: (parameters: Parameter[]) => void;
  initialParameters?: Parameter[];
}

export function DynamicParameterBuilder({
  onParameterSave,
  initialParameters = []
}: DynamicParameterBuilderProps) {
  const [parameters, setParameters] = useState<Parameter[]>(initialParameters);
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [newParameter, setNewParameter] = useState<Partial<Parameter>>({
    type: 'INPUT',
    isRequired: false,
    isAutomatic: false,
    parameterType: 'PARAMETER' // Default to parameter type
  });

  const handleAddParameter = () => {
    if (newParameter.title) {
      // Create the parameter with explicit parameter type
      const paramToAdd = { 
        ...newParameter, 
        title: newParameter.title,
        type: newParameter.type as Parameter['type'],
        isRequired: newParameter.isRequired || false,
        isAutomatic: newParameter.isAutomatic || false,
        parameterType: newParameter.parameterType as 'PARAMETER' | 'RESULT'
        // No resultDueDate or resultDueDays - these will be filled in when the device is used
      };
      
      console.log('Adding parameter with type:', paramToAdd.parameterType);
      
      setParameters([...parameters, paramToAdd]);
      setNewParameter({ 
        type: 'INPUT', 
        isRequired: false, 
        isAutomatic: false, 
        parameterType: 'PARAMETER' 
      });
      setIsAddingParameter(false);
    }
  };

  const handleRemoveParameter = (index: number) => {
    const newParameters = [...parameters];
    newParameters.splice(index, 1);
    setParameters(newParameters);
  };

  const handleParameterValueChange = (index: number, value: string | number) => {
    const newParameters = [...parameters];
    newParameters[index].value = value.toString();
    setParameters(newParameters);
  };

  const renderParameterInput = (parameter: Parameter, index: number) => {
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
            <Label>Auto</Label>
          </div>
        );
      case 'RANGE':
        return (
          <div className="w-full">
            <Slider
              min={parameter.minValue || 0}
              max={parameter.maxValue || 100}
              step={1}
              value={[parameter.value ? parseFloat(parameter.value) : parameter.minValue || 0]}
              onValueChange={(value) => handleParameterValueChange(index, value[0].toString())}
              unit={parameter.unit ? ` ${parameter.unit}` : ''}
            />
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
              placeholder="Valeur"
              className="flex-1"
            />
            {parameter.unit && (
              <span className="text-sm text-gray-500 min-w-[60px]">{parameter.unit}</span>
            )}
          </div>
        );
      case 'DATE':
        return (
          <Input
            type="date"
            value={parameter.value || ''}
            onChange={(e) => handleParameterValueChange(index, e.target.value)}
            className="h-12"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={parameter.value || ''}
            onChange={(e) => handleParameterValueChange(index, e.target.value)}
            placeholder="Valeur"
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Paramètres du dispositif</h3>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => {
            console.log('Current parameters:', parameters);
            setIsAddingParameter(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Ajouter
        </Button>
      </div>

      <div className="space-y-6">
        {parameters.map((parameter, index) => (
          <div key={index} className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Label className="text-lg font-medium">{parameter.title}</Label>
                {parameter.isRequired && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveParameter(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {parameter.isAutomatic && (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={parameter.value === 'auto'}
                    onCheckedChange={(checked) => 
                      handleParameterValueChange(index, checked ? 'auto' : '')
                    }
                  />
                  <Label className="text-base">Auto</Label>
                </div>
              </div>
            )}
            {(!parameter.isAutomatic || parameter.value !== 'auto') && (
              <div className="mt-4">
                {renderParameterInput(parameter, index)}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isAddingParameter} onOpenChange={setIsAddingParameter}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Ajouter un nouveau paramètre</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <Label className="text-base">Nom du paramètre</Label>
              <Input
                value={newParameter.title || ''}
                onChange={(e) => 
                  setNewParameter({ ...newParameter, title: e.target.value })
                }
                placeholder="Nom du paramètre"
                className="h-12"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-base">Type</Label>
              <Select
                value={newParameter.type}
                onValueChange={(value) => 
                  setNewParameter({ ...newParameter, type: value as Parameter['type'] })
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INPUT">Texte</SelectItem>
                  <SelectItem value="NUMBER">Nombre</SelectItem>
                  <SelectItem value="RANGE">Plage de valeurs</SelectItem>
                  <SelectItem value="CHECKBOX">Case à cocher</SelectItem>
                  <SelectItem value="DATE">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newParameter.type === 'NUMBER' || newParameter.type === 'RANGE') && (
              <>
                <div className="space-y-4">
                  <Label className="text-base">Unité (optionnel)</Label>
                  <Input
                    value={newParameter.unit || ''}
                    onChange={(e) => 
                      setNewParameter({ ...newParameter, unit: e.target.value })
                    }
                    placeholder="ex: cm, kg, etc."
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-base">Valeur minimum</Label>
                    <Input
                      type="number"
                      value={newParameter.minValue || ''}
                      onChange={(e) => 
                        setNewParameter({ 
                          ...newParameter, 
                          minValue: parseFloat(e.target.value) 
                        })
                      }
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base">Valeur maximum</Label>
                    <Input
                      type="number"
                      value={newParameter.maxValue || ''}
                      onChange={(e) => 
                        setNewParameter({ 
                          ...newParameter, 
                          maxValue: parseFloat(e.target.value) 
                        })
                      }
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-4 pt-2">
              <Label className="text-base">Type de paramètre</Label>
              <Select
                value={newParameter.parameterType}
                onValueChange={(value) => 
                  setNewParameter({ ...newParameter, parameterType: value as 'PARAMETER' | 'RESULT' })
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARAMETER">Paramètre (à configurer avant)</SelectItem>
                  <SelectItem value="RESULT">Résultat (à obtenir après)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Removed the resultDueDays input field since users will fill in dates when they use the device */}



            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={newParameter.isRequired}
                onCheckedChange={(checked) => 
                  setNewParameter({ ...newParameter, isRequired: checked })
                }
              />
              <Label className="text-base">Obligatoire</Label>
            </div>
            {(newParameter.type === 'NUMBER' || newParameter.type === 'RANGE') && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={newParameter.isAutomatic}
                  onCheckedChange={(checked) => 
                    setNewParameter({ ...newParameter, isAutomatic: checked })
                  }
                />
                <Label className="text-base">Permettre le mode Auto</Label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" size="lg" onClick={() => setIsAddingParameter(false)}>
              Annuler
            </Button>
            <Button size="lg" onClick={handleAddParameter}>
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {parameters.length > 0 && (
        <Button 
          className="w-full h-12 text-base"
          onClick={() => {
            // Log parameters before saving to verify types
            console.log('Saving parameters with types:', parameters.map((p) => ({ 
              title: p.title, 
              parameterType: p.parameterType,
              type: p.type
            })));
            
            // Save the parameters directly - no need to calculate resultDueDate
            // as it will be filled in when the device is used
            onParameterSave(parameters);
          }}
        >
          Sauvegarder les paramètres
        </Button>
      )}
    </div>
  );
}

export default DynamicParameterBuilder;