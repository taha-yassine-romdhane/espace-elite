import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";

interface Technician {
  id: string;
  name: string;
  role: string;
}

interface SocieteFormProps {
  formData: {
    nomSociete?: string;
    telephonePrincipale?: string;
    telephoneSecondaire?: string;
    adresseComplete?: string;
    matriculeFiscale?: string;
    technicienResponsable?: string;
    descriptionNom?: string;
    descriptionTelephone?: string;
    descriptionAdresse?: string;
    img?: File;
    imageUrl?: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
}

const SocieteForm: React.FC<SocieteFormProps> = ({
  formData,
  onInputChange,
  onFileChange,
  onBack,
  onNext
}) => {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "File must be an image or PDF",
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom Société</label>
            <input
              type="text"
              name="nomSociete"
              value={formData.nomSociete || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Num Téléphone principale</label>
            <input
              type="tel"
              name="telephonePrincipale"
              value={formData.telephonePrincipale || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Num Téléphone secondaire</label>
            <input
              type="tel"
              name="telephoneSecondaire"
              value={formData.telephoneSecondaire || ''}
              onChange={onInputChange}
              placeholder="Value"
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
                placeholder="Value"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Matricule Fiscale</label>
            <input
              type="text"
              name="matriculeFiscale"
              value={formData.matriculeFiscale || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

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
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description Nom</label>
            <textarea
              name="descriptionNom"
              value={formData.descriptionNom || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description Téléphone</label>
            <textarea
              name="descriptionTelephone"
              value={formData.descriptionTelephone || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description Adresse</label>
            <textarea
              name="descriptionAdresse"
              value={formData.descriptionAdresse || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <div className="mt-1 flex flex-col items-center">
              {imagePreview ? (
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      onInputChange({
                        target: {
                          name: 'imageUrl',
                          value: ''
                        }
                      } as any);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <p className="text-sm text-gray-500">Uploading...</p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-gray-500">
                            <span>Glissez et déposez votre fichier ici ou</span>
                          </p>
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleImageChange}
                            accept="image/*,.pdf"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="file-upload"
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
                          >
                            Choisissez un fichier
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Formats supportés: PDF, JPG, PNG (max 5MB)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button variant="default" onClick={onNext} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
};

export default SocieteForm;