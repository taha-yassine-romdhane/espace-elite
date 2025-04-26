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

// Form validation schema for medical devices
const medicalDeviceSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.literal("MEDICAL_DEVICE"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  
  stockLocationId: z.string().optional().nullable(),
  
  purchasePrice: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
  sellingPrice: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
  
  technicalSpecs: z.string().optional().nullable(),
  configuration: z.string().optional().nullable(),
  
  status: z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]).default("ACTIVE"),
  availableForRent: z.boolean().default(false),
  requiresMaintenance: z.boolean().default(false),
});

type MedicalDeviceFormValues = z.infer<typeof medicalDeviceSchema>;

interface MedicalDeviceFormProps {
  initialData?: any;
  onSubmit: (data: MedicalDeviceFormValues) => void;
  stockLocations: Array<{ id: string; name: string }>;
  isEditMode?: boolean;
}

export function MedicalDeviceForm({ initialData, onSubmit, stockLocations, isEditMode = false }: MedicalDeviceFormProps) {
  const form = useForm<MedicalDeviceFormValues>({
    resolver: zodResolver(medicalDeviceSchema),
    defaultValues: {
      ...initialData,
      type: "MEDICAL_DEVICE",
      availableForRent: initialData?.availableForRent || false,
      requiresMaintenance: initialData?.requiresMaintenance || false,
      status: initialData?.status || "ACTIVE"
    },
  });

  const handleSubmit = async (values: MedicalDeviceFormValues) => {
    try {
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as any);

      await onSubmit(cleanedValues);
    } catch (error) {
      console.error("Error in form submission:", error);
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
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
                          <Input {...field} value={field.value || ''} />
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
                        <Input {...field} value={field.value || ''} />
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
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

          <TabsContent value="financial">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d&apos;Achat</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field}value={field.value || ''} />
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
                        <FormLabel>Prix de Vente</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value || ''} />
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
                  name="technicalSpecs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spécifications Techniques</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
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

export default MedicalDeviceForm;