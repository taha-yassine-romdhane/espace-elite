import { useState } from "react";
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
  FormDescription,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Form validation schema
const productSchema = z.object({
  // Basic Information
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.enum(["MEDICAL_DEVICE", "DIAGNOSTIC_DEVICE", "ACCESSORY", "SPARE_PART"]),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  
  // Stock Information
  stockLocationId: z.string().optional().nullable(),
  stockQuantity: z.string().transform(val => val ? parseInt(val) : 1),
  minStock: z.string().transform(val => val ? parseInt(val) : null).nullable(),
  maxStock: z.string().transform(val => val ? parseInt(val) : null).nullable(),
  alertThreshold: z.string().transform(val => val ? parseInt(val) : null).nullable(),
  
  // Financial Information
  purchasePrice: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
  sellingPrice: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
  totalCost: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
  
  // Technical Information
  technicalSpecs: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  configuration: z.string().optional().nullable(),
  
  // Status and Flags
  status: z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]).default("ACTIVE"),
  availableForRent: z.boolean().default(false),
  requiresMaintenance: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: ProductFormValues) => void;
  stockLocations: Array<{ id: string; name: string }>;
  isEditMode?: boolean;
}

export function ProductForm({ initialData, onSubmit, stockLocations, isEditMode = false }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      type: "MEDICAL_DEVICE",
      availableForRent: false,
      requiresMaintenance: false,
      stockQuantity: "1",
      status: "ACTIVE"
    },
  });

  const productType = form.watch("type");
  const isMedicalDevice = productType === "MEDICAL_DEVICE" || productType === "DIAGNOSTIC_DEVICE";

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      // Convert empty strings to null
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as any);

      const transformedData = {
        ...cleanedValues,
        // For medical devices and diagnostic equipment
        ...(isMedicalDevice && {
          stockQuantity: 1,
          status: cleanedValues.status || "ACTIVE",
          configuration: cleanedValues.configuration || null,
          technicalSpecs: cleanedValues.technicalSpecs || null,
          warranty: cleanedValues.warranty || null,
          availableForRent: Boolean(cleanedValues.availableForRent),
          requiresMaintenance: Boolean(cleanedValues.requiresMaintenance),
        }),
        // For accessories and spare parts
        ...(!isMedicalDevice && {
          stockQuantity: parseInt(cleanedValues.stockQuantity?.toString() || "0"),
          totalCost: cleanedValues.totalCost ? parseFloat(cleanedValues.totalCost.toString()) : null,
          minStock: cleanedValues.minStock ? parseInt(cleanedValues.minStock.toString()) : null,
          maxStock: cleanedValues.maxStock ? parseInt(cleanedValues.maxStock.toString()) : null,
          alertThreshold: cleanedValues.alertThreshold ? parseInt(cleanedValues.alertThreshold.toString()) : null,
        })
      };

      console.log("Form values:", values);
      console.log("Transformed data:", transformedData);
      await onSubmit(transformedData);
    } catch (error) {
      console.error("Error in form submission:", error);
      throw error; // Re-throw to trigger form error state
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-6"
      >
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Information de Base</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="financial">Finance</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de Produit*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEDICAL_DEVICE">Appareil Médical</SelectItem>
                          <SelectItem value="DIAGNOSTIC_DEVICE">Appareil Diagnostic</SelectItem>
                          <SelectItem value="ACCESSORY">Accessoire</SelectItem>
                          <SelectItem value="SPARE_PART">Pièce de rechange</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""}  />
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
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de Série</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
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
                      <FormLabel>Emplacement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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

                {!isMedicalDevice && (
                  <>
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité en Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Minimum</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Maximum</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="alertThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seuil d'Alerte</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d'Achat</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isMedicalDevice && (
                    <FormField
                      control={form.control}
                      name="totalCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coût Total</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {isMedicalDevice && (
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de Vente</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} value={field.value || ""}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical">
            <Card>
              <CardContent className="space-y-4 pt-4">
                {isMedicalDevice && (
                  <>
                    <FormField
                      control={form.control}
                      name="technicalSpecs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spécifications Techniques</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="configuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="warranty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garantie</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isMedicalDevice && (
                  <>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
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

                    <div className="flex items-center space-x-8">
                      <FormField
                        control={form.control}
                        name="availableForRent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Disponible à la Location
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
                                Nécessite Maintenance
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              "Chargement..."
            ) : (
              isEditMode ? "Mettre à jour" : "Ajouter"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
