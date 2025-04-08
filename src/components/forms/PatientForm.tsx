import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BeneficiaryType } from '@prisma/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import custom components
import PersonalInfoBlock from './patientSections/PersonalInfoBlock';
import InsuranceDetailsBlock from './patientSections/InsuranceDetailsBlock';
import BiometricsBlock from './patientSections/BiometricsBlock';
import AdditionalInfoBlock from './patientSections/AdditionalInfoBlock';
import ResponsiblePersonBlock from './patientSections/ResponsiblePersonBlock';
import FileManager from './components/FileManager';

interface Doctor {
  id: string;
  name: string;
}

interface Technician {
  id: string;
  name: string;
  role: string;
}

type CaisseAffiliation = 'CNSS' | 'CNRPS';

interface PatientFormProps {
  formData: {
    nomComplet?: string;
    telephonePrincipale?: string;
    telephoneSecondaire?: string;
    adresseComplete?: string;
    cin?: string;
    identifiantCNAM?: string;
    technicienResponsable?: string;
    antecedant?: string;
    taille?: string;
    poids?: string;
    medecin?: string;
    dateNaissance?: string;
    beneficiaire?: BeneficiaryType;
    caisseAffiliation?: CaisseAffiliation;
    cnam?: boolean;
    descriptionNom?: string;
    descriptionTelephone?: string;
    descriptionAdresse?: string;
    files?: File[];
    existingFiles?: { url: string; type: string }[];
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (files: File[]) => void;
  onBack: () => void;
  onNext: () => void;
  onError?: (error: any) => void; // Optional callback to handle errors at parent level
}

const formSchema = z.object({
  nomComplet: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  telephonePrincipale: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres"),
  telephoneSecondaire: z.string().optional(),
  adresseComplete: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  cin: z.string().optional(),
  identifiantCNAM: z.string().optional(),
  technicienResponsable: z.string().optional(),
  antecedant: z.string().optional(),
  taille: z.string().optional(),
  poids: z.string().optional(),
  medecin: z.string().optional(),
  dateNaissance: z.string().optional(),
  beneficiaire: z.nativeEnum(BeneficiaryType).optional(),
  caisseAffiliation: z.enum(['CNSS', 'CNRPS']).optional(),
  cnam: z.boolean().optional(),
  descriptionNom: z.string().optional(),
  descriptionTelephone: z.string().optional(),
  descriptionAdresse: z.string().optional(),
  files: z.array(z.any()).optional(),
  existingFiles: z.array(z.object({
    url: z.string(),
    type: z.string()
  })).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function PatientForm({ formData, onInputChange, onFileChange, onBack, onNext, onError }: PatientFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [files, setFiles] = useState<File[]>(formData.files || []);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [existingFiles, setExistingFiles] = useState<{ url: string; type: string }[]>(
    formData.existingFiles || []
  );

  // Debug log for form data
  useEffect(() => {
    console.log('PatientForm received formData:', formData);
  }, [formData]);

  useEffect(() => {
    setFiles(formData.files || []);
  }, [formData.files]);

  useEffect(() => {
    if (formData.existingFiles) {
      setExistingFiles(formData.existingFiles);
    }
  }, [formData.existingFiles]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomComplet: formData.nomComplet || '',
      telephonePrincipale: formData.telephonePrincipale || '',
      telephoneSecondaire: formData.telephoneSecondaire || '',
      adresseComplete: formData.adresseComplete || '',
      cin: formData.cin || '',
      identifiantCNAM: formData.identifiantCNAM || '',
      technicienResponsable: formData.technicienResponsable || '',
      antecedant: formData.antecedant || '',
      taille: formData.taille || '',
      poids: formData.poids || '',
      medecin: formData.medecin || '',
      dateNaissance: formData.dateNaissance || '',
      beneficiaire: formData.beneficiaire,
      caisseAffiliation: formData.caisseAffiliation,
      cnam: formData.cnam || false,
      descriptionNom: formData.descriptionNom || '',
      descriptionTelephone: formData.descriptionTelephone || '',
      descriptionAdresse: formData.descriptionAdresse || '',
      files: formData.files || [],
      existingFiles: formData.existingFiles || []
    }
  });

  useEffect(() => {
    // Initialize form with defaultValues if they exist
    if (formData) {
      console.log('Setting default values:', formData);
      
      // Format date if it exists (could be in various formats)
      let formattedDate = formData.dateNaissance || '';
      if (formattedDate) {
        // Try to parse and format the date
        try {
          // Handle string format
          if (typeof formattedDate === 'string') {
            // Check if it's already in YYYY-MM-DD format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
              const date = new Date(formattedDate);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0];
              }
            }
          }
        } catch (error) {
          console.error('Error formatting date:', error);
        }
      }
      
      // Set all form values
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'dateNaissance') {
          form.setValue('dateNaissance', formattedDate);
        } else if (value !== undefined && value !== null) {
          // Use type assertion to handle the dynamic key
          form.setValue(key as any, value);
        }
      });
    }
  }, [formData, form]);

  useEffect(() => {
    fetchTechnicians();
    fetchDoctors();
  }, []);

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

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/users/doctors');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctors",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (uploadedFiles: File[]) => {
    console.log('Files selected:', uploadedFiles);
    setFiles(uploadedFiles);
    // Update parent component without losing other form data
    onFileChange(uploadedFiles);
    
    // Ensure form values are preserved after file upload
    const currentFormValues = form.getValues();
    setTimeout(() => {
      Object.keys(currentFormValues).forEach(key => {
        if (key !== 'files' && key !== 'existingFiles') {
          form.setValue(key as any, currentFormValues[key as keyof typeof currentFormValues]);
        }
      });
    }, 0);
  };

  const handleRemoveFile = (fileUrl: string) => {
    // Remove from existing files
    const updatedExistingFiles = formData.existingFiles?.filter(file => file.url !== fileUrl) || [];
    setExistingFiles(updatedExistingFiles);

    // Update form data
    form.setValue('existingFiles', updatedExistingFiles);

    // Update parent component
    onInputChange({
      target: {
        name: 'existingFiles',
        value: updatedExistingFiles
      }
    } as any);
  };

  // Handle patient selection from search
  const handlePatientSelect = (patient: any) => {
    console.log('Patient selected:', patient);
    
    // Make sure we update the files state
    if (patient.existingFiles && patient.existingFiles.length > 0) {
      setExistingFiles(patient.existingFiles);
      form.setValue('existingFiles', patient.existingFiles);
    }
    
    // Update doctor and technician fields if they exist
    if (patient.medecin) {
      form.setValue('medecin', patient.medecin);
    }
    
    if (patient.technicienResponsable) {
      form.setValue('technicienResponsable', patient.technicienResponsable);
    }
    
    // Make sure antecedant is set
    if (patient.antecedant) {
      form.setValue('antecedant', patient.antecedant);
    }
    
    // Ensure all form values are reflected in the UI
    // This forces a re-render of all form fields with the new values
    Object.keys(form.getValues()).forEach(key => {
      const value = form.getValues(key as any);
      if (value !== undefined) {
        form.setValue(key as any, value);
      }
    });
    
    // Show a toast notification that patient data was loaded
    toast({
      title: "Patient existant sélectionné",
      description: `Les données du patient ${patient.nomComplet} ont été chargées`,
      variant: "default",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous validation errors
    setValidationErrors({});
    
    // Trigger validation manually
    await form.trigger();
    
    // Check for validation errors
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('Form validation errors:', form.formState.errors);
      
      // Show toast with validation errors
      const errorMessages = Object.entries(form.formState.errors)
        .map(([field, error]) => `${field}: ${error?.message || 'Champ invalide'}`)
        .join('\n');
      
      toast({
        title: "Erreur de validation",
        description: errorMessages || "Veuillez vérifier les champs du formulaire",
        variant: "destructive",
      });
      
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current form values
      const formValues = form.getValues();
      console.log('Form values before submission:', formValues);
      
      // Update all form values in parent component
      Object.entries(formValues).forEach(([key, value]) => {
        if (key !== 'files' && key !== 'existingFiles') {
          console.log(`Updating parent with: ${key} = ${value}`);
          // Create a synthetic event
          const syntheticEvent = {
            target: {
              name: key,
              value: value
            }
          };
          // Call the parent's onInputChange with our synthetic event
          onInputChange(syntheticEvent as any);
        }
      });
      
      // Handle files separately
      if (files.length > 0) {
        console.log(`Updating parent with ${files.length} files`);
        onFileChange(files);
      }
      
      // Small delay to ensure state updates are processed
      setTimeout(async () => {
        try {
          // Proceed to next step
          await onNext();
        } catch (error: any) {
          // Handle API errors, especially unique constraint violations
          console.error('Error during form submission:', error);
          
          if (error.response) {
            const errorData = await error.response.json();
            
            if (error.response.status === 409) {
              // Handle unique constraint violations
              if (errorData.field === 'telephonePrincipale') {
                setValidationErrors({
                  telephonePrincipale: errorData.message || 'Ce numéro de téléphone est déjà utilisé par un autre patient'
                });
                
                form.setError('telephonePrincipale', {
                  type: 'manual',
                  message: errorData.message || 'Ce numéro de téléphone est déjà utilisé par un autre patient'
                });
                
                toast({
                  title: "Erreur de duplication",
                  description: errorData.message || 'Ce numéro de téléphone est déjà utilisé par un autre patient',
                  variant: "destructive",
                });
                
                // If we have an existing patient ID, we could suggest linking to that patient
                if (errorData.patientId) {
                  // This could be handled by the parent through the onError callback
                  if (onError) {
                    onError(errorData);
                  }
                }
              } else if (errorData.field === 'cin') {
                setValidationErrors({
                  cin: errorData.message || 'Ce numéro CIN est déjà utilisé par un autre patient'
                });
                
                form.setError('cin', {
                  type: 'manual',
                  message: errorData.message || 'Ce numéro CIN est déjà utilisé par un autre patient'
                });
                
                toast({
                  title: "Erreur de duplication",
                  description: errorData.message || 'Ce numéro CIN est déjà utilisé par un autre patient',
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Erreur de duplication",
                  description: errorData.message || 'Une valeur unique est déjà utilisée par un autre patient',
                  variant: "destructive",
                });
              }
            } else {
              // Handle other error types
              toast({
                title: "Erreur",
                description: errorData.error || "Erreur lors de la soumission du formulaire",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Erreur",
              description: "Erreur lors de la soumission du formulaire",
              variant: "destructive",
            });
          }
          
          // Pass the error to the parent component if callback exists
          if (onError) {
            onError(error);
          }
        } finally {
          setIsLoading(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
      setIsLoading(false);
      
      // Pass the error to the parent component if callback exists
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-lg">
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <PersonalInfoBlock 
                form={form} 
                onInputChange={onInputChange} 
                validationErrors={validationErrors}
                onPatientSelect={handlePatientSelect}
              />
                <InsuranceDetailsBlock 
                form={form} 
                onInputChange={onInputChange} 
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AdditionalInfoBlock 
                form={form} 
                onInputChange={onInputChange} 
              />
              
            
              
              <ResponsiblePersonBlock 
                form={form} 
                doctors={doctors} 
                technicians={technicians} 
                onInputChange={onInputChange} 
              />
              
              <BiometricsBlock 
                form={form} 
                onInputChange={onInputChange} 
              />

              {/* File Upload Section */}
              <FileManager 
                form={form}
                files={files}
                existingFiles={existingFiles}
                onFileChange={handleFileChange}
                onRemoveExistingFile={handleRemoveFile}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            Retour
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde...
              </div>
              : 'Sauvegarder'
            }
          </Button>
        </div>
      </div>
    </form>
  );
}