import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { BeneficiaryType } from '@prisma/client';
import { FileUpload } from "@/components/ui/file-upload";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

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
  files: z.array(z.instanceof(File)).optional(),
  existingFiles: z.array(z.object({
    url: z.string(),
    type: z.string()
  })).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function PatientForm({ formData, onInputChange, onFileChange, onBack, onNext }: PatientFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>(formData.files || []);

  // Debug log for form data
  useEffect(() => {
    console.log('PatientForm received formData:', formData);
  }, [formData]);

  useEffect(() => {
    setFiles(formData.files || []);
  }, [formData.files]);

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

  // Update form values when formData changes
  useEffect(() => {
    console.log('Updating form values with:', formData);
    const validFields = [
      'nomComplet',
      'telephonePrincipale',
      'telephoneSecondaire',
      'adresseComplete',
      'cin',
      'identifiantCNAM',
      'technicienResponsable',
      'antecedant',
      'taille',
      'poids',
      'medecin',
      'dateNaissance',
      'beneficiaire',
      'caisseAffiliation',
      'cnam',
      'descriptionNom',
      'descriptionTelephone',
      'descriptionAdresse',
      'files',
      'existingFiles'
    ] as const;

    validFields.forEach((key) => {
      if (key in formData) {
        form.setValue(key, formData[key]);
      }
    });
  }, [formData, form]);

  useEffect(() => {
    fetchTechnicians();
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Handle image previews
    if (formData.files) {
      // For new files, create object URLs
      const previewUrls = formData.files.map(file => URL.createObjectURL(file));
      setImagePreviews(previewUrls);
    } else if (formData.existingFiles) {
      // For existing files, use their URLs directly
      const existingUrls = formData.existingFiles
        .filter(file => file.type.startsWith('image/'))
        .map(file => file.url);
      setImagePreviews(existingUrls);
    } else {
      setImagePreviews([]);
    }

    // Cleanup function to revoke object URLs
    return () => {
      imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [formData.files, formData.existingFiles]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = form.formState.isValid;
    if (!validation) {
      console.log('Form validation errors:', form.formState.errors);
      return;
    }

    try {
      setIsLoading(true);
      // Include files in the form data
      const formData = {
        ...form.getValues(),
        files: files,
        images: files
      };
      await onNext();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFileChange(updatedFiles);

    // Create preview URLs for new files
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileChange(updatedFiles);

    setImagePreviews(prev => {
      // Revoke the URL to free up memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Radio button handlers
  const handleCaisseAffiliationChange = (value: CaisseAffiliation) => {
    form.setValue('caisseAffiliation', value);
    // Update parent component
    onInputChange({
      target: {
        name: 'caisseAffiliation',
        value: value
      }
    } as any);
  };

  const handleBeneficiaireChange = (value: BeneficiaryType) => {
    form.setValue('beneficiaire', value);
    onInputChange({
      target: {
        name: 'beneficiaire',
        value: value
      }
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              name="nomComplet"
              value={form.watch('nomComplet')}
              onChange={(e) => form.setValue('nomComplet', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Nom complet"
            />
            {form.formState.errors.nomComplet && (
              <span className="text-sm text-red-500">{form.formState.errors.nomComplet.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Num Téléphone principale</label>
            <input
              type="tel"
              name="telephonePrincipale"
              value={form.watch('telephonePrincipale')}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                form.setValue('telephonePrincipale', value);
              }}
              placeholder="Numéro de téléphone"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Num Téléphone secondaire</label>
            <input
              type="tel"
              name="telephoneSecondaire"
              value={form.watch('telephoneSecondaire')}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                form.setValue('telephoneSecondaire', value);
              }}
              placeholder="Numéro de téléphone secondaire"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Adresse Complete</label>
            <div className="relative">
              <input
                type="text"
                name="adresseComplete"
                value={form.watch('adresseComplete')}
                onChange={(e) => form.setValue('adresseComplete', e.target.value)}
                placeholder="Adresse"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CIN</label>
            <input
              type="text"
              name="cin"
              value={form.watch('cin')}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                form.setValue('cin', value);
              }}
              placeholder="Numéro CIN (8 chiffres)"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              maxLength={8}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">CNAM</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cnam"
                  checked={form.watch('cnam') === true}
                  onChange={() => form.setValue('cnam', true)}
                  className="mr-2"
                />
                <span>Oui</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cnam"
                  checked={form.watch('cnam') === false}
                  onChange={() => form.setValue('cnam', false)}
                  className="mr-2"
                />
                <span>Non</span>
              </label>
            </div>
            {form.watch('cnam') && (
              <div className="mt-2">
                <input
                  type="text"
                  name="identifiantCNAM"
                  value={form.watch('identifiantCNAM')}
                  onChange={(e) => {
                    // Only allow numbers and uppercase letters
                    const value = e.target.value.replace(/[^0-9A-Z]/g, '').slice(0, 12);
                    form.setValue('identifiantCNAM', value.toUpperCase());
                  }}
                  placeholder="Identifiant CNAM"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  maxLength={12}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
            <input
              type="date"
              name="dateNaissance"
              value={form.watch('dateNaissance')}
              onChange={(e) => form.setValue('dateNaissance', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Médecin</label>
            <select
              name="medecin"
              value={form.watch('medecin')}
              onChange={(e) => form.setValue('medecin', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Sélectionnez un médecin</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700">Antécédents médicaux</label>
            <textarea
              name="antecedant"
              value={form.watch('antecedant')}
              onChange={(e) => {
                form.setValue('antecedant', e.target.value);
                onInputChange(e);
              }}
              placeholder="Antécédents médicaux du patient"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description Nom</label>
            <textarea
              name="descriptionNom"
              value={form.watch('descriptionNom')}
              onChange={(e) => form.setValue('descriptionNom', e.target.value)}
              placeholder="Description supplémentaire du nom"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description Téléphone</label>
            <textarea
              name="descriptionTelephone"
              value={form.watch('descriptionTelephone')}
              onChange={(e) => form.setValue('descriptionTelephone', e.target.value)}
              placeholder="Description supplémentaire du téléphone"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Caisse d'affiliation</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="caisseAffiliation"
                  value="CNSS"
                  checked={form.watch('caisseAffiliation') === 'CNSS'}
                  onChange={() => handleCaisseAffiliationChange('CNSS')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">CNSS</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="caisseAffiliation"
                  value="CNRPS"
                  checked={form.watch('caisseAffiliation') === 'CNRPS'}
                  onChange={() => handleCaisseAffiliationChange('CNRPS')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">CNRPS</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bénéficiaire
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value={BeneficiaryType.ASSURE_SOCIAL}
                  checked={form.watch('beneficiaire') === BeneficiaryType.ASSURE_SOCIAL}
                  onChange={() => handleBeneficiaireChange(BeneficiaryType.ASSURE_SOCIAL)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Assuré Social</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value={BeneficiaryType.CONJOINT_ENFANT}
                  checked={form.watch('beneficiaire') === BeneficiaryType.CONJOINT_ENFANT}
                  onChange={() => handleBeneficiaireChange(BeneficiaryType.CONJOINT_ENFANT)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Conjoint/Enfant</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value={BeneficiaryType.ASSANDANT}
                  checked={formData.beneficiaire === BeneficiaryType.ASSANDANT}
                  onChange={() => handleBeneficiaireChange(BeneficiaryType.ASSANDANT)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Ascendant</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Technicien Responsable</label>
            <select
              name="technicienResponsable"
              value={form.watch('technicienResponsable')}
              onChange={(e) => form.setValue('technicienResponsable', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Sélectionnez un technicien</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.role})
                </option>
              ))}
            </select>
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Taille</label>
              <div className="relative">
                <input
                  type="number"
                  name="taille"
                  value={form.watch('taille')}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow values between 0 and 250
                    if (!value || (parseFloat(value) >= 0 && parseFloat(value) <= 250)) {
                      form.setValue('taille', value);
                    }
                  }}
                  placeholder="Taille en cm"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-12 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  min="0"
                  max="250"
                  step="1"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">cm</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Poids</label>
              <div className="relative">
                <input
                  type="number"
                  name="poids"
                  value={form.watch('poids')}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow values between 0 and 500
                    if (!value || (parseFloat(value) >= 0 && parseFloat(value) <= 500)) {
                      form.setValue('poids', value);
                    }
                  }}
                  placeholder="Poids en kg"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-12 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  min="0"
                  max="500"
                  step="0.1"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">kg</span>
                </div>
              </div>
            </div>

            {/* IMC Calculation */}
            {form.watch('taille') && form.watch('poids') && (
              <div className="col-span-2">
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <label className="text-sm font-medium text-gray-700">IMC</label>
                  <div className="mt-1 text-lg font-semibold">
                    {(() => {
                      const taille = form.watch('taille');
                      const poids = form.watch('poids');
                      if (typeof taille === 'string' && typeof poids === 'string') {
                        return (parseFloat(poids) / Math.pow(parseFloat(taille) / 100, 2)).toFixed(1);
                      }
                      return '0';
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Documents
            </label>

            {/* Display existing files */}
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

            {/* File Upload component */}
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

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          Next
        </Button>
      </div>
    </form>
  );
};
