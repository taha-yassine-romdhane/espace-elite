import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';

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
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
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
            <label className="block text-sm font-medium text-gray-700">matricule fiscale</label>
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
              <option value="">Value</option>
              {/* Add technician options here */}
            </select>
          </div>
        </div>

        {/* Right Column */}
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
            <div className="mt-1">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500">
                      <span>Glissez et déposez votre fichier ici ou</span>
                    </p>
                    <Button variant="default" className="mt-2">
                      Choisissez un fichier
                    </Button>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={onFileChange}
                    accept="image/*,.pdf"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Formats supportés: PDF, JPG, PNG</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button variant="default" onClick={onNext}>
          sauvegarder
        </Button>
      </div>
    </div>
  );
};

export default SocieteForm;
