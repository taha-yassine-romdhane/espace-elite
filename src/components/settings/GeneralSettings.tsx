import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { Save, Building, Upload, X, Image as ImageIcon, MapPin } from "lucide-react";
import Image from "next/image";

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

// Form validation schema
const generalSettingsSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  companyAddress: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  companyPhone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  companyEmail: z.string().email("Email invalide"),
  companyLogo: z.string().optional(),
  companyLatitude: z.number().min(-90).max(90).optional().nullable(),
  companyLongitude: z.number().min(-180).max(180).optional().nullable(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export function GeneralSettings() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Default settings
  const defaultSettings: GeneralSettingsFormValues = {
    companyName: "Nom de l'entreprise",
    companyAddress: "Adresse de l'entreprise",
    companyPhone: "+216 XX XXX XXX",
    companyEmail: "contact@entreprise.tn",
    companyLogo: "",
    companyLatitude: null,
    companyLongitude: null,
  };

  // Fetch settings
  const { data: settings, isError, error, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["general-settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings/general");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch settings');
      }
      return await response.json();
    },
    retry: 1,
  });

  // Form setup
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: defaultSettings,
    values: settings || defaultSettings,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      const response = await fetch("/api/settings/general", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update settings");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-settings"] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres généraux ont été mis à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour des paramètres",
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

  // Handle logo file upload
  const handleLogoUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La taille du fichier ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to public upload API (for logos only)
      const response = await fetch('/api/upload-public', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Extract the URL from the response (API returns {success: true, files: [{url: "..."}]})
      const logoUrl = data.files && data.files.length > 0 ? data.files[0].url : null;

      if (!logoUrl) {
        throw new Error('No URL returned from upload');
      }

      // Update form value
      form.setValue('companyLogo', logoUrl);
      setLogoPreview(logoUrl);

      toast({
        title: "Succès",
        description: "Logo téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du logo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  }, [form]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleLogoUpload(files[0]);
    }
  }, [handleLogoUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleLogoUpload(files[0]);
    }
  }, [handleLogoUpload]);

  const currentLogo = logoPreview || form.watch('companyLogo');

  // Show loading state
  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              <CardTitle>Informations de l&apos;entreprise</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500">Chargement des paramètres...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              <CardTitle>Informations de l&apos;entreprise</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <X className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Erreur de chargement</p>
                <p className="text-sm text-gray-500 mt-1">
                  {error instanceof Error ? error.message : 'Une erreur est survenue'}
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            <CardTitle>Informations de l&apos;entreprise</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l&apos;entreprise</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input type="email" {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyLogo"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Logo de l&apos;entreprise</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Current Logo Display */}
                            {currentLogo && (
                              <div className="flex items-center justify-center p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                                <div className="relative w-48 h-48">
                                  <Image
                                    key={currentLogo}
                                    src={currentLogo}
                                    alt="Company Logo"
                                    fill
                                    className="object-contain"
                                    unoptimized={currentLogo.startsWith('/api/files/serve-public/') || currentLogo.startsWith('/uploads-public/') || currentLogo.startsWith('/imports/')}
                                    onError={(e) => {
                                      console.error('Image load error:', currentLogo);
                                      toast({
                                        title: "Erreur",
                                        description: "Impossible de charger le logo",
                                        variant: "destructive",
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Drag & Drop Upload Zone */}
                            <div
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              className={`
                                relative border-2 border-dashed rounded-lg p-8 transition-all
                                ${isDragging
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
                                }
                                ${isUploadingLogo ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                              `}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isUploadingLogo}
                              />
                              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                  isDragging ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  {isUploadingLogo ? (
                                    <div className="animate-spin">
                                      <Upload className="h-8 w-8 text-blue-600" />
                                    </div>
                                  ) : (
                                    <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {isUploadingLogo
                                      ? 'Téléchargement en cours...'
                                      : isDragging
                                      ? 'Déposez le fichier ici'
                                      : 'Glissez-déposez votre logo ici'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    ou cliquez pour sélectionner un fichier
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <ImageIcon className="h-4 w-4" />
                                  <span>PNG, JPG, SVG jusqu&apos;à 5MB</span>
                                </div>
                              </div>
                            </div>

                            {/* Hidden input to store the logo URL */}
                            <Input type="hidden" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* HQ Location Picker for Map */}
                  <div className="col-span-1 md:col-span-2">
                    <Separator className="my-4" />
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Emplacement du siège (pour la carte)</span>
                    </div>
                    <LocationPicker
                      latitude={form.watch('companyLatitude') ?? null}
                      longitude={form.watch('companyLongitude') ?? null}
                      onLocationChange={(lat, lng) => {
                        form.setValue('companyLatitude', lat);
                        form.setValue('companyLongitude', lng);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-3">
                      Cet emplacement sera affiché comme marqueur du siège sur la carte des patients.
                    </p>
                  </div>
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

export default GeneralSettings;