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
  onSubmit: (data: DiagnosticDeviceFormValues) => void;
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

  const [parameters, setParameters] = useState(initialData?.parameters || []);

  const handleSubmit = async (values: DiagnosticDeviceFormValues) => {
    try {
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

      const formData = {
        ...cleanedValues,
        parameters: parameters
      };

      await onSubmit(formData);
    } catch (error) {
      console.error("Error in diagnostic device form submission:", error);
      throw error;
    }
  };

  const handleParameterSave = async (newParameters: any[]) => {
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
                              <FormLabel className="text-base">Prix d'achat</FormLabel>
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
                <Button type="submit" size="lg" className="px-8">
                  {isEditMode ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {form.getValues('type') === 'DIAGNOSTIC_DEVICE' && (
          <div className="w-full lg:w-2/5 border-l pl-6">
            <DynamicParameterBuilder
              deviceId={form.getValues('id')}
              onParameterSave={handleParameterSave}
              initialParameters={parameters}
            />
          </div>
        )}
      </div>
    </div>
  );
}