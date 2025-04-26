import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Switch } from "@/components/ui/switch";
import { DynamicParameterBuilder } from "./DynamicParameterBuilder";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Define Parameter interface for type safety
interface Parameter {
  id?: string;
  title: string;
  type: 'INPUT' | 'CHECKBOX' | 'NUMBER' | 'RANGE' | 'DATE'; // Added DATE type to match DynamicParameterBuilder
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isAutomatic?: boolean;
  value?: string;
  parameterType: 'PARAMETER' | 'RESULT'; // Made required to match DynamicParameterBuilder
  resultDueDate?: string;
  resultDueDays?: number; // Added to match DynamicParameterBuilder
}

// Form validation schema for diagnostic devices
const diagnosticDeviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.literal("DIAGNOSTIC_DEVICE"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  
  stockLocationId: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().min(0).default(1),
  minStock: z.coerce.number().min(0).nullable(),
  maxStock: z.coerce.number().min(0).nullable(),
  alertThreshold: z.coerce.number().min(0).nullable(),
  
  purchasePrice: z.coerce.number().min(0).nullable(),
  sellingPrice: z.coerce.number().min(0).nullable(),
  technicalSpecs: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  configuration: z.string().optional().nullable(),
  availableForRent: z.boolean().optional().default(false),
  requiresMaintenance: z.boolean().optional().default(false),
  status: z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]).default("ACTIVE"),
  parameters: z.record(z.any()).optional(),
});

type DiagnosticDeviceFormValues = z.infer<typeof diagnosticDeviceSchema>;

interface DiagnosticDeviceFormProps {
  initialData?: any;
  onSubmit: (data: DiagnosticDeviceFormValues) => Promise<any>;
  stockLocations: Array<{ id: string; name: string }>;
  isEditMode?: boolean;
}

export function DiagnosticDeviceForm({ initialData, onSubmit, stockLocations, isEditMode = false }: DiagnosticDeviceFormProps) {
  const form = useForm<DiagnosticDeviceFormValues>({
    resolver: zodResolver(diagnosticDeviceSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      ...initialData,
      type: "DIAGNOSTIC_DEVICE",
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      serialNumber: initialData?.serialNumber || '',
      stockQuantity: initialData?.stockQuantity || 1,
      minStock: initialData?.minStock || null,
      maxStock: initialData?.maxStock || null,
      alertThreshold: initialData?.alertThreshold || null,
      purchasePrice: initialData?.purchasePrice || null,
      sellingPrice: initialData?.sellingPrice || null,
      technicalSpecs: initialData?.technicalSpecs || '',
      warranty: initialData?.warranty || '',
      configuration: initialData?.configuration || '',
      availableForRent: initialData?.availableForRent || false,
      requiresMaintenance: initialData?.requiresMaintenance || false,
      status: initialData?.status || "ACTIVE"
    },
  });

  const [parameters, setParameters] = useState<Parameter[]>(initialData?.parameters || []);

  const handleSubmit = async (values: DiagnosticDeviceFormValues) => {
    try {
      console.log('DiagnosticDeviceForm handleSubmit called with values:', values);
      console.log('Current parameters:', parameters);
      
      // Force type to be DIAGNOSTIC_DEVICE
      values.type = "DIAGNOSTIC_DEVICE";
      
      // Ensure type is set correctly
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        // Handle empty strings
        if (value === "") {
          acc[key] = null;
        } 
        // Handle numeric fields
        else if (["purchasePrice", "sellingPrice"].includes(key)) {
          acc[key] = value ? parseFloat(value.toString()) : null;
        }
        else if (["stockQuantity", "minStock", "maxStock", "alertThreshold"].includes(key)) {
          acc[key] = value ? parseInt(value.toString()) : null;
        }
        // Handle boolean fields
        else if (["availableForRent", "requiresMaintenance"].includes(key)) {
          acc[key] = value || false;
        }
        // All other fields
        else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      console.log('Cleaned values:', cleanedValues);
      
      // Create a properly structured parameters array with all necessary fields
      const formattedParameters = parameters.map(param => ({
        id: param.id,
        title: param.title,
        type: param.type,
        unit: param.unit || null,
        minValue: param.minValue || null,
        maxValue: param.maxValue || null,
        isRequired: param.isRequired || false,
        isAutomatic: param.isAutomatic || false,
        value: param.value || null,
        parameterType: param.parameterType, // Ensure this is included
        resultDueDate: param.resultDueDate || null
      }));
      
      // Log the formatted parameters to verify they're correctly structured
      console.log('Formatted parameters:', formattedParameters);
      
      const formData = {
        ...cleanedValues,
        parameters: formattedParameters,
        type: "DIAGNOSTIC_DEVICE" // Ensure type is explicitly set
      };

      console.log('Final form data being submitted:', formData);
      console.log('Calling onSubmit function...');
      
      // First save the device to get its ID
      const savedDevice: { id: string } = await onSubmit(formData) || {};
      console.log('Device saved successfully:', savedDevice);
      
      // If we have parameters and a device ID, explicitly save parameters via the dedicated API
      if (formattedParameters.length > 0 && savedDevice && savedDevice.id) {
        console.log('Saving parameters separately via API for device ID:', savedDevice.id);
        try {
          const paramResponse = await fetch('/api/diagnostic-parameters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: savedDevice.id,
              parameters: formattedParameters
            }),
          });
          
          if (!paramResponse.ok) {
            console.error('Failed to save parameters:', await paramResponse.text());
          } else {
            console.log('Parameters saved successfully via dedicated API');
          }
        } catch (paramError) {
          console.error('Error saving parameters via API:', paramError);
        }
      }
      
      console.log('onSubmit completed successfully');
      return savedDevice;
    } catch (error) {
      console.error("Error in diagnostic device form submission:", error);
      throw error;
    }
  };

  const handleParameterSave = async (newParameters: Parameter[]) => {
    setParameters(newParameters);
    
    if (form.getValues('id')) {
      try {
        const response = await fetch('/api/diagnostic-parameters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: form.getValues('id'),
            parameters: newParameters
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save parameters');
        }
      } catch (error) {
        console.error('Error saving parameters:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="basic" className="text-base py-1.5">Info de Base</TabsTrigger>
                  <TabsTrigger value="stock" className="text-base py-1.5">Stock</TabsTrigger>
                  <TabsTrigger value="finance" className="text-base py-1.5">Finance</TabsTrigger>
                  <TabsTrigger value="technical" className="text-base py-1.5">Technique</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Nom</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Marque</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Modèle</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Numéro de série</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stock">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="stockLocationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Emplacement</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner l'emplacement" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stockLocations.map((location) => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="finance">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="purchasePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">Prix d&apos;achat</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...field} value={field.value || ''} className="h-12" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sellingPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">Prix de vente</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...field} value={field.value || ''} className="h-12" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="technical">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="configuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Configuration</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Statut</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le statut" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ACTIVE">Actif</SelectItem>
                                <SelectItem value="MAINTENANCE">En Maintenance</SelectItem>
                                <SelectItem value="RETIRED">Retiré</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-6">
                        <FormField
                          control={form.control}
                          name="availableForRent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Disponible à la location
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requiresMaintenance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Nécessite maintenance
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-4 mt-4">
                <Button 
                  type="button" 
                  size="lg" 
                  className="px-8"
                  onClick={async () => {
                    try {
                      console.log('Submit button clicked directly');
                      
                      // Get current form values
                      const values = form.getValues();
                      console.log('Current form values:', values);
                      
                      // Force type to be DIAGNOSTIC_DEVICE
                      values.type = "DIAGNOSTIC_DEVICE";
                      
                      // Create cleaned data object
                      const formData = {
                        ...values,
                        type: "DIAGNOSTIC_DEVICE" as const,
                        parameters: parameters,
                        purchasePrice: values.purchasePrice ? parseFloat(values.purchasePrice.toString()) : null,
                        sellingPrice: values.sellingPrice ? parseFloat(values.sellingPrice.toString()) : null,
                        stockQuantity: values.stockQuantity ? parseInt(values.stockQuantity.toString()) : 1,
                        availableForRent: values.availableForRent || false,
                        requiresMaintenance: values.requiresMaintenance || false
                      };
                      
                      console.log('Submitting form data directly:', formData);
                      
                      // Call onSubmit directly
                      await onSubmit(formData);
                      
                      console.log('Form submitted successfully');
                    } catch (error) {
                      console.error('Error submitting form:', error);
                    }
                  }}
                >
                  {isEditMode ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {form.getValues('type') === 'DIAGNOSTIC_DEVICE' && (
          <div className="w-full lg:w-2/5 border-l pl-6">
            {/* Parameter Summary Section */}
            {parameters && parameters.length > 0 && (
              <div className="mb-6 border rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Paramètres configurés</h3>
                
                {/* Parameter Type Summary */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {parameters.filter((p: Parameter) => p.parameterType === 'PARAMETER').length > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                      Configuration: {parameters.filter((p: Parameter) => p.parameterType === 'PARAMETER').length}
                    </Badge>
                  )}
                  {parameters.filter((p: Parameter) => p.parameterType === 'RESULT').length > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
                      Résultats: {parameters.filter((p: Parameter) => p.parameterType === 'RESULT').length}
                    </Badge>
                  )}
                </div>
                
                {/* Log parameters to console for debugging */}
                <div className="hidden">
                  {parameters.map((p: Parameter) => p.title).join(', ')}
                </div>
                
                {/* Parameter List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {parameters.map((param: Parameter, index: number) => (
                    <div key={index} className={`p-2 rounded-md text-sm flex justify-between items-center ${
                      param.parameterType === 'PARAMETER' 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-purple-50 border border-purple-200'
                    }`}>
                      <div>
                        <div className="font-medium">{param.title}</div>
                        {param.unit && <div className="text-xs text-gray-500">Unité: {param.unit}</div>}
                        {param.parameterType === 'RESULT' && param.resultDueDate && (
                          <div className="text-xs text-purple-700">Date prévue: {param.resultDueDate}</div>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        param.parameterType === 'PARAMETER'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {param.parameterType === 'PARAMETER' ? 'Config' : 'Résultat'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DynamicParameterBuilder
              onParameterSave={handleParameterSave}
              initialParameters={parameters}
            />  
          </div>
        )}
      </div>
    </div>
  );
}
export default DiagnosticDeviceForm;