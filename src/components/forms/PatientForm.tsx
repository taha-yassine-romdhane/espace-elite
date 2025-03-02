import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";
import { BeneficiaryType } from "@/types";
interface Doctor {
  id: string;
  name: string;
}

interface Technician {
  id: string;
  name: string;
  role: string;
}

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
    beneficiaire?: BeneficiaryType | string;
    caisseAffiliation?: 'CNSS' | 'CNRPS';
    cnam?: boolean;
    img?: File;
    imageUrl?: string;
    description1?: string;
    description2?: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({
  formData,
  onInputChange,
  onFileChange,
  onBack,
  onNext
}) => {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTechnicians();
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Handle image preview
    if (formData.img) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(formData.img);
    } else if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [formData.img, formData.imageUrl]);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "File must be an image",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        
        if (!data.url) {
          throw new Error('No URL received from server');
        }

        // Update the form with the new image URL
        onInputChange({
          target: {
            name: 'imageUrl',
            value: data.url
          }
        } as any);

        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              name="nomComplet"
              value={formData.nomComplet || ''}
              onChange={onInputChange}
              placeholder="Prénom et nom"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Num Téléphone principale</label>
            <input
              type="tel"
              name="telephonePrincipale"
              value={formData.telephonePrincipale || ''}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                onInputChange({
                  target: {
                    name: 'telephonePrincipale',
                    value
                  }
                } as any);
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
              value={formData.telephoneSecondaire || ''}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                onInputChange({
                  target: {
                    name: 'telephoneSecondaire',
                    value
                  }
                } as any);
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
                value={formData.adresseComplete || ''}
                onChange={onInputChange}
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
              value={formData.cin || ''}
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                onInputChange({
                  target: {
                    name: 'cin',
                    value
                  }
                } as any);
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
                  checked={formData.cnam === true}
                  onChange={() => onInputChange({
                    target: { name: 'cnam', value: true }
                  } as any)}
                  className="mr-2"
                />
                <span>Oui</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cnam"
                  checked={formData.cnam === false}
                  onChange={() => onInputChange({
                    target: { name: 'cnam', value: false }
                  } as any)}
                  className="mr-2"
                />
                <span>Non</span>
              </label>
            </div>
            {formData.cnam && (
              <div className="mt-2">
                <input
                  type="text"
                  name="identifiantCNAM"
                  value={formData.identifiantCNAM || ''}
                  onChange={(e) => {
                    // Only allow numbers and uppercase letters
                    const value = e.target.value.replace(/[^0-9A-Z]/g, '').slice(0, 12);
                    onInputChange({
                      target: {
                        name: 'identifiantCNAM',
                        value: value.toUpperCase()
                      }
                    } as any);
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
              value={formData.dateNaissance || ''}
              onChange={onInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Médecin</label>
            <select
              name="medecin"
              value={formData.medecin || ''}
              onChange={onInputChange}
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
            <label className="block text-sm font-medium text-gray-700">Description Num 1</label>
            <textarea
              name="description1"
              value={formData.description1 || ''}
              onChange={onInputChange}
              placeholder="Description supplémentaire 1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description Num 2</label>
            <textarea
              name="description2"
              value={formData.description2 || ''}
              onChange={onInputChange}
              placeholder="Description supplémentaire 2"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Technicien Responsable</label>
            <select
              name="technicienResponsable"
              value={formData.technicienResponsable || ''}
              onChange={onInputChange}
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Antécédents médicaux</label>
            <textarea
              name="antecedant"
              value={formData.antecedant || ''}
              onChange={onInputChange}
              placeholder="Antécédents médicaux du patient"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Taille</label>
              <div className="relative">
                <input
                  type="number"
                  name="taille"
                  value={formData.taille || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow values between 0 and 250
                    if (!value || (parseFloat(value) >= 0 && parseFloat(value) <= 250)) {
                      onInputChange({
                        target: {
                          name: 'taille',
                          value
                        }
                      } as any);
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
                  value={formData.poids || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow values between 0 and 500
                    if (!value || (parseFloat(value) >= 0 && parseFloat(value) <= 500)) {
                      onInputChange({
                        target: {
                          name: 'poids',
                          value
                        }
                      } as any);
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
            {formData.taille && formData.poids && (
              <div className="col-span-2">
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <label className="text-sm font-medium text-gray-700">IMC</label>
                  <div className="mt-1 text-lg font-semibold">
                    {(parseFloat(formData.poids) / Math.pow(parseFloat(formData.taille) / 100, 2)).toFixed(1)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Caisse affiliation</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="caisseAffiliation"
                  value="CNSS"
                  checked={formData.caisseAffiliation === 'CNSS'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>CNSS</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="caisseAffiliation"
                  value="CNRPS"
                  checked={formData.caisseAffiliation === 'CNRPS'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>CNRPS</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bénéficiaire</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value="ASSURE_SOCIAL"
                  checked={formData.beneficiaire === 'ASSURE_SOCIAL'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>Assuré social</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value="CONJOINT_ENFANT"
                  checked={formData.beneficiaire === 'CONJOINT_ENFANT'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>Conjoint enfant</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value="ASSANDANT"
                  checked={formData.beneficiaire === 'ASSANDANT'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>Ascendant</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <div className="relative h-16 w-16">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No photo</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                {isUploading ? 'Uploading...' : imagePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
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
          type="button"
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PatientForm;
