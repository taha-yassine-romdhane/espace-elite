import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  role: string;
}

const formSchema = z.object({
  nomSociete: z.string().min(1, "Le nom de la société est requis"),
  telephonePrincipale: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres"),
  adresseComplete: z.string().min(1, "L'adresse est requise"),
  telephoneSecondaire: z.string().optional(),
  matriculeFiscale: z.string().optional(),
  technicienResponsable: z.string().optional(),
  descriptionNom: z.string().optional(),
  descriptionTelephone: z.string().optional(),
  descriptionAdresse: z.string().optional(),
});

export interface SocieteFormProps {
  formData: {
    nomSociete?: string;
    matriculeFiscale?: string;
    telephonePrincipale?: string;
    telephoneSecondaire?: string;
    adresseComplete?: string;
    technicienResponsable?: string;
    descriptionNom?: string;
    descriptionTelephone?: string;
    descriptionAdresse?: string;
    images?: File[];
    files?: File[];
    existingFiles?: { url: string; type: string }[];
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (files: File[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SocieteForm({ formData, onInputChange, onFileChange, onBack, onNext }: SocieteFormProps) {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [files, setFiles] = useState<File[]>(formData.images || []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await fetch('/api/users/technicians');
        if (!response.ok) throw new Error('Failed to fetch technicians');
        const data = await response.json();
        setTechnicians(data);
      } catch (error) {
        console.error('Error fetching technicians:', error);
        toast({
          title: "Error",
          description: "Failed to fetch technicians",
          variant: "destructive",
        });
      }
    };

    fetchTechnicians();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomSociete: formData.nomSociete || '',
      telephonePrincipale: formData.telephonePrincipale || '',
      adresseComplete: formData.adresseComplete || '',
      telephoneSecondaire: formData.telephoneSecondaire || '',
      matriculeFiscale: formData.matriculeFiscale || '',
      technicienResponsable: formData.technicienResponsable || '',
      descriptionNom: formData.descriptionNom || '',
      descriptionTelephone: formData.descriptionTelephone || '',
      descriptionAdresse: formData.descriptionAdresse || '',
    },
  });

  const onSubmit = useCallback(async (data: z.infer<typeof formSchema>) => {
    try {
      // Handle form submission
      onNext();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [onNext]);

  const handleFileChange = (uploadedFiles: File[]) => {
    console.log('Files selected:', uploadedFiles);
    setFiles(uploadedFiles);
    // Update parent component
    onFileChange(uploadedFiles);
  };

  const handleRemoveFile = (fileUrl: string) => {
    // Remove from existing files
    const updatedExistingFiles = formData.existingFiles?.filter(file => file.url !== fileUrl) || [];
    
    // Update form data
    const updatedFormData = {
      ...formData,
      existingFiles: updatedExistingFiles
    };
    
    // Update parent component
    onInputChange({
      target: {
        name: 'existingFiles',
        value: updatedExistingFiles
      }
    } as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="nomSociete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom Société</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matriculeFiscale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matricule Fiscale</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephonePrincipale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Num Téléphone principale</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephoneSecondaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Num Téléphone secondaire</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresseComplete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse Complete</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} onChange={(e) => {
                        field.onChange(e);
                        onInputChange(e);
                      }} />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicienResponsable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technicien Responsable</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      onInputChange({ target: { name: 'technicienResponsable', value } } as any);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un technicien" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} ({tech.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="descriptionNom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Nom</FormLabel>
                  <FormControl>
                    <Textarea {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionTelephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Téléphone</FormLabel>
                  <FormControl>
                    <Textarea {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionAdresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} onChange={(e) => {
                      field.onChange(e);
                      onInputChange(e);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Documents
              </label>
              {formData.existingFiles && formData.existingFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {formData.existingFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={file.url}
                        alt={`Document ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.url)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FileUpload
                value={files}
                onChange={handleFileChange}
                maxFiles={5}
                maxSize={5 * 1024 * 1024} // 5MB
                accept="image/jpeg,image/png,image/gif,application/pdf"
                multiple={true}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button type="button" variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button type="submit">
            Sauvegarder
          </Button>
        </div>
      </form>
    </Form>
  );
}