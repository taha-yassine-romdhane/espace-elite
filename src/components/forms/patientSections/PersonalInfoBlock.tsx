import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Check } from 'lucide-react';
import SmartInput from '../components/SmartInput';
import FormSection from '../components/FormSection';
import LocationPicker from '../components/LocationPicker';
import axios from 'axios';
import { debounce } from 'lodash';

interface Patient {
  id: string;
  nomComplet: string;
  telephonePrincipale?: string;
  telephoneSecondaire?: string;
  adresseComplete?: string;
  adresseCoordinates?: {
    lat: number;
    lng: number;
  };
  cin?: string;
  dateNaissance?: string;
  antecedant?: string;
  medecin?: string;
  medecinNom?: string;
  technicienResponsable?: string;
  technicienResponsableNom?: string;
  taille?: string;
  poids?: string;
  cnam?: boolean;
  beneficiaire?: string;
  caisseAffiliation?: string;
  cnamId?: string;
  descriptionNom?: string;
  descriptionTelephone?: string;
  descriptionAdresse?: string;
  existingFiles?: { url: string; type: string }[];
  [key: string]: any;
}

interface PersonalInfoBlockProps {
  form: UseFormReturn<any>;
  onInputChange: (e: any) => void;
  validationErrors?: Record<string, string>;
  onPatientSelect?: (patient: Patient) => void;
}

export default function PersonalInfoBlock({ 
  form, 
  onInputChange, 
  validationErrors = {},
  onPatientSelect
}: PersonalInfoBlockProps) {
  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Debounced search function
  const searchPatients = debounce(async (name: string) => {
    if (!name || name.length < 3) {
      setMatchingPatients([]);
      setShowPatientSelector(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/renseignements/patients/search?query=${encodeURIComponent(name)}`);
      const patients = response.data;
      console.log('Patients found:', patients);
      setMatchingPatients(patients);
      setShowPatientSelector(patients.length > 0);
    } catch (error) {
      console.error('Error searching for patients:', error);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('nomComplet', name);
    onInputChange(e);
    
    // Only search if we don't have a selected patient already
    if (!selectedPatient) {
      searchPatients(name);
    }
  };

  const selectPatient = (patient: Patient) => {
    console.log('Selecting patient:', patient);
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    
    // Populate the form with the selected patient's data
    // Start with basic fields
    form.setValue('nomComplet', patient.nomComplet);
    form.setValue('telephonePrincipale', patient.telephonePrincipale || '');
    form.setValue('telephoneSecondaire', patient.telephoneSecondaire || '');
    form.setValue('adresseComplete', patient.adresseComplete || '');
    if (patient.adresseCoordinates) {
      setCoordinates(patient.adresseCoordinates);
      // Serialize the coordinates to JSON string to prevent [object Object] in form submission
      form.setValue('adresseCoordinates', JSON.stringify(patient.adresseCoordinates));
    } else {
      setCoordinates(null);
      form.setValue('adresseCoordinates', null);
    }
    form.setValue('cin', patient.cin || '');
    form.setValue('dateNaissance', patient.dateNaissance || '');
    form.setValue('antecedant', patient.antecedant || '');
    form.setValue('taille', patient.taille || '');
    form.setValue('poids', patient.poids || '');
    
    // Form descriptions
    form.setValue('descriptionNom', patient.descriptionNom || '');
    form.setValue('descriptionTelephone', patient.descriptionTelephone || '');
    form.setValue('descriptionAdresse', patient.descriptionAdresse || '');
    
    // Handle insurance fields
    form.setValue('cnam', patient.cnam || false);
    form.setValue('identifiantCNAM', patient.identifiantCNAM || '');
    form.setValue('beneficiaire', patient.beneficiaire || '');
    form.setValue('caisseAffiliation', patient.caisseAffiliation || 'CNSS');
    
    // Handle doctor and technician
    form.setValue('medecin', patient.medecin || '');
    form.setValue('technicienResponsable', patient.technicienResponsable || '');
    
    // Convert synthetic events to update parent component state
    Object.entries(patient).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'id' && key !== 'existingFiles') {
        const syntheticEvent = {
          target: {
            name: key,
            value: value
          }
        };
        onInputChange(syntheticEvent as any);
      }
    });
    
    // If we have existing files, update them separately
    if (patient.existingFiles && patient.existingFiles.length > 0) {
      console.log('Setting existing files:', patient.existingFiles);
      form.setValue('existingFiles', patient.existingFiles);
      
      // Notify parent about existing files
      const syntheticEvent = {
        target: {
          name: 'existingFiles',
          value: patient.existingFiles
        }
      };
      onInputChange(syntheticEvent as any);
    }
    
    // Call the optional callback if provided
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  const resetPatientSelection = () => {
    setSelectedPatient(null);
    // Keep the current name but clear other fields
    const currentName = form.getValues('nomComplet');
    form.reset({ nomComplet: currentName });
  };

  return (
    <FormSection title="Information personnelle" defaultOpen={true}>
      <div className="space-y-4">
        <div className="relative">
          <SmartInput
            name="nomComplet"
            label="Nom complet"
            form={form}
            placeholder="Nom complet"
            onParentChange={handleNameChange}
            required
          />
          
          {selectedPatient && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
              <Check size={16} className="text-green-500" />
              <span>Patient existant sélectionné: {selectedPatient.nomComplet}</span>
              <button 
                onClick={resetPatientSelection}
                className="ml-auto rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Réinitialiser
              </button>
            </div>
          )}
          
          {showPatientSelector && !selectedPatient && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="p-2 text-sm text-orange-700 bg-orange-50 rounded-t-md flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Patients existants avec des noms similaires:</span>
              </div>
              <ul className="max-h-60 overflow-auto">
                {matchingPatients.map((patient) => (
                  <li 
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    className="border-t border-gray-100 p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium">{patient.nomComplet}</div>
                    {patient.telephonePrincipale && <div className="text-sm text-gray-600">Tél: {patient.telephonePrincipale}</div>}
                    {patient.cin && <div className="text-sm text-gray-600">CIN: {patient.cin}</div>}
                    {patient.dateNaissance && <div className="text-sm text-gray-600">Né(e) le: {new Date(patient.dateNaissance).toLocaleDateString()}</div>}
                  </li>
                ))}
                <li className="border-t border-gray-100 p-2 bg-gray-50">
                  <button 
                    onClick={() => setShowPatientSelector(false)}
                    className="w-full rounded bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200"
                  >
                    Continuer avec un nouveau patient
                  </button>
                </li>
              </ul>
            </div>
          )}
          
          {isSearching && (
            <div className="absolute top-0 right-2 h-full flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="relative">
          <SmartInput
            name="telephonePrincipale"
            label="Num Téléphone principale"
            form={form}
            type="tel"
            placeholder="Numéro de téléphone"
            pattern={{ value: /\D/g, replace: '', maxLength: 8 }}
            onParentChange={onInputChange}
            required
          />
          {validationErrors.telephonePrincipale && (
            <div className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{validationErrors.telephonePrincipale}</span>
            </div>
          )}
        </div>

        <SmartInput
          name="telephoneSecondaire"
          label="Num Téléphone secondaire"
          form={form}
          type="tel"
          placeholder="Numéro de téléphone secondaire"
          pattern={{ value: /\D/g, replace: '', maxLength: 8 }}
          onParentChange={onInputChange}
        />

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">Adresse Complete</label>
          <LocationPicker
            initialAddress={form.watch('adresseComplete') || ''}
            onAddressChange={(address) => {
              form.setValue('adresseComplete', address);
              const syntheticEvent = {
                target: {
                  name: 'adresseComplete',
                  value: address
                }
              };
              onInputChange(syntheticEvent as any);
            }}
            onCoordinatesChange={(coords) => {
              setCoordinates(coords);
              // Instead of setting raw object, serialize coordinates to JSON string
              // This prevents the [object Object] issue during form submission
              if (coords) {
                form.setValue('adresseCoordinates', JSON.stringify(coords));
              } else {
                form.setValue('adresseCoordinates', null);
              }
            }}
          />
        </div>

        <div className="relative">
          <SmartInput
            name="cin"
            label="CIN"
            form={form}
            placeholder="Numéro CIN (8 chiffres)"
            pattern={{ value: /\D/g, replace: '', maxLength: 8 }}
            onParentChange={onInputChange}
            maxLength={8}
          />
          {validationErrors.cin && (
            <div className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{validationErrors.cin}</span>
            </div>
          )}
        </div>

        <SmartInput
          name="dateNaissance"
          label="Date de naissance"
          form={form}
          type="date"
          onParentChange={onInputChange}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">Antécédents médicaux</label>
          <textarea
            name="antecedant"
            value={form.watch('antecedant') || ''}
            onChange={(e) => {
              form.setValue('antecedant', e.target.value);
              onInputChange(e);
            }}
            placeholder="Antécédants médicaux"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>
    </FormSection>
  );
}
