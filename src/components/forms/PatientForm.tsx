import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';

interface PatientFormProps {
  formData: {
    nomComplet?: string;
    telephonePrincipale?: string;
    telephoneSecondaire?: string;
    adresseComplete?: string;
    cin?: string;
    identifiantCNAM?: string;
    technicienResponsable?: string;
    description1?: string;
    description2?: string;
    descriptionAdresse?: string;
    antecedant?: string;
    taille?: string;
    poids?: string;
    medecin?: string;
    dateNaissance?: string;
    beneficiaire?: 'assureSocial' | 'conjointEnfant' | 'ascendant';
    caisseAffiliation?: 'CNSS' | 'CNRPS';
    cnam?: boolean;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
            <label className="block text-sm font-medium text-gray-700">CIN</label>
            <input
              type="text"
              name="cin"
              value={formData.cin || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                  onChange={(e) => onInputChange({ ...e, target: { ...e.target, name: 'cnam', value: 'true' } })}
                  className="mr-2"
                />
                <span>CNAM</span>
              </label>
            </div>
            {formData.cnam && (
              <input
                type="text"
                name="identifiantCNAM"
                value={formData.identifiantCNAM || ''}
                onChange={onInputChange}
                placeholder="Identifiant CNAM"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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
                  value="assureSocial"
                  checked={formData.beneficiaire === 'assureSocial'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>Assuré social</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value="conjointEnfant"
                  checked={formData.beneficiaire === 'conjointEnfant'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>conjoint enfant</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="beneficiaire"
                  value="ascendant"
                  checked={formData.beneficiaire === 'ascendant'}
                  onChange={onInputChange}
                  className="mr-2"
                />
                <span>ascendant</span>
              </label>
            </div>
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
              <option value="">Value</option>
              {/* Add technician options here */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description Num 1</label>
            <textarea
              name="description1"
              value={formData.description1 || ''}
              onChange={onInputChange}
              placeholder="Value"
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
            <label className="block text-sm font-medium text-gray-700">antécédant</label>
            <textarea
              name="antecedant"
              value={formData.antecedant || ''}
              onChange={onInputChange}
              placeholder="Value"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">taille</label>
              <div className="relative">
                <input
                  type="text"
                  name="taille"
                  value={formData.taille || ''}
                  onChange={onInputChange}
                  placeholder="Cm"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">poids</label>
              <div className="relative">
                <input
                  type="text"
                  name="poids"
                  value={formData.poids || ''}
                  onChange={onInputChange}
                  placeholder="Kg"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Médecin</label>
            <select
              name="medecin"
              value={formData.medecin || ''}
              onChange={onInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Value</option>
              {/* Add doctor options here */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">IMG :</label>
            <div className="mt-1">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Glissez et déposez votre fichier ici ou</span>
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

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button variant="default" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default PatientForm;
