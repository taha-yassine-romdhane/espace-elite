import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from "lucide-react";
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

// Status mapping for better user experience
const statusOptions = [
  { value: "EN_VENTE", label: "En Vente" },
  { value: "EN_LOCATION", label: "En Location" },
  { value: "EN_REPARATION", label: "En Réparation" },
  { value: "HORS_SERVICE", label: "Hors Service" },
];

// Form validation schema for accessories
const accessorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.literal("ACCESSORY"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  stockLocationId: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().min(0).optional().default(1),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  sellingPrice: z.coerce.number().min(0).optional().nullable(),
  warrantyExpiration: z.date().optional().nullable(),
  status: z.enum(['EN_VENTE', 'EN_LOCATION', 'EN_REPARATION', 'HORS_SERVICE']).default('EN_VENTE'),
});

type AccessoryFormValues = z.infer<typeof accessorySchema>;

interface AccessoryFormProps {
  initialData?: any;
  onSubmit: (data: AccessoryFormValues) => void;
  stockLocations: Array<{ id: string; name: string }>;
  isEditMode?: boolean;
}

export function AccessoryForm({ initialData, onSubmit, stockLocations, isEditMode = false }: AccessoryFormProps) {
  const form = useForm<AccessoryFormValues>({
    resolver: zodResolver(accessorySchema),
    defaultValues: {
      type: "ACCESSORY",
      name: initialData?.name || "",
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      stockLocationId: initialData?.stockLocationId || "",
      stockQuantity: initialData?.stockQuantity || 1,
      purchasePrice: initialData?.purchasePrice || null,
      sellingPrice: initialData?.sellingPrice || null,
      warrantyExpiration: initialData?.warrantyExpiration ? new Date(initialData.warrantyExpiration) : null,
      status: initialData?.status || "EN_VENTE",
    },
  });

  const handleSubmit = (data: AccessoryFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Information de Base</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="financial">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
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
                          <Input {...field} value={field.value ?? ''} />
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
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
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
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status de produit</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le status" defaultValue={field.value ?? 'EN_VENTE'} />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité en Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} value={field.value ?? ''} />
                      </FormControl>
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
                    name="warrantyExpiration"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fin de garantie</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP", { locale: fr })
                                ) : (
                                  <span>Choisir une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown-buttons"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 15}
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d&apos;Achat</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ''} />
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
                          <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit">{isEditMode ? "Mettre à jour" : "Ajouter"}</Button>
        </div>
      </form>
    </Form>
  );
}
export default AccessoryForm;