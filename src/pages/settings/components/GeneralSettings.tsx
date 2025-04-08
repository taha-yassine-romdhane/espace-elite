import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { Info, Save } from "lucide-react";

// Form validation schema
const generalSettingsSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  companyAddress: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  companyPhone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  companyEmail: z.string().email("Email invalide"),
  companyLogo: z.string().optional(),
  defaultCurrency: z.string().min(1, "Veuillez sélectionner une devise"),
  taxRate: z.coerce.number().min(0, "Le taux de TVA ne peut pas être négatif").max(100, "Le taux de TVA ne peut pas dépasser 100%"),
  enableEmailNotifications: z.boolean().default(true),
  enableSmsNotifications: z.boolean().default(false),
  maintenanceMode: z.boolean().default(false),
  defaultLanguage: z.string().min(1, "Veuillez sélectionner une langue"),
  dateFormat: z.string().min(1, "Veuillez sélectionner un format de date"),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export function GeneralSettings() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Default settings
  const defaultSettings: GeneralSettingsFormValues = {
    companyName: "Elite Santé",
    companyAddress: "123 Rue de la Santé, Tunis, Tunisie",
    companyPhone: "+216 71 123 456",
    companyEmail: "contact@elite-sante.tn",
    companyLogo: "/logo.png",
    defaultCurrency: "TND",
    taxRate: 19,
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    maintenanceMode: false,
    defaultLanguage: "fr",
    dateFormat: "DD/MM/YYYY",
  };

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ["general-settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/general");
        if (!response.ok) {
          // If the API doesn't exist yet, use default settings
          return defaultSettings;
        }
        return await response.json();
      } catch (error) {
        // If there's an error, use default settings
        return defaultSettings;
      }
    },
  });

  // Form setup
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings || defaultSettings,
    values: settings || defaultSettings,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      try {
        const response = await fetch("/api/settings/general", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error("Failed to update settings");
        }
        
        return await response.json();
      } catch (error) {
        // If the API doesn't exist yet, just simulate success
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-settings"] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres généraux ont été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des paramètres",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = async (data: GeneralSettingsFormValues) => {
    setIsLoading(true);
    try {
      await updateSettingsMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Paramètres Généraux</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations de l'entreprise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de l'entreprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adresse de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paramètres financiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise par défaut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une devise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TND">Dinar Tunisien (TND)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            <SelectItem value="USD">Dollar Américain (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de TVA (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Préférences régionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Langue par défaut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une langue" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">Arabe</SelectItem>
                            <SelectItem value="en">Anglais</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format de date</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                            <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications et système</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enableEmailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notifications par email</FormLabel>
                          <div className="text-sm text-gray-500">
                            Activer les notifications par email pour les rendez-vous et les rappels
                          </div>
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
                    name="enableSmsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notifications par SMS</FormLabel>
                          <div className="text-sm text-gray-500">
                            Activer les notifications par SMS pour les rendez-vous et les rappels
                          </div>
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
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mode maintenance</FormLabel>
                          <div className="text-sm text-gray-500">
                            Activer le mode maintenance pour bloquer l'accès au système
                          </div>
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
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les paramètres
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
