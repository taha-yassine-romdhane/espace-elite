import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PatientForm from '@/components/forms/PatientForm';
import SocieteForm from '@/components/forms/SocieteForm';
import { RenseignementTable } from './components/RenseignementTable';
import { FileViewer } from './components/FileViewer';
import { TypeSelector } from './components/TypeSelector';
import { z } from 'zod';
import { BeneficiaryType } from '@prisma/client';
import { CaisseAffiliation, Renseignement, RenseignementFormData, UploadedFile } from '@/types/renseignement';

const renseignementSchema = z.object({
  type: z.enum(['Patient', 'Société']),
  // Patient fields
  nomComplet: z.string().optional(),
  telephonePrincipale: z.string().optional(),
  telephoneSecondaire: z.string().optional(),
  adresseComplete: z.string().optional(),
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
  // Societe fields
  nomSociete: z.string().optional(),
  matriculeFiscale: z.string().optional(),
  // Common fields
  images: z.array(z.any()).optional(),
  files: z.array(z.any()).optional(),
});

export default function RenseignementPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<RenseignementFormData>({
    type: 'Patient',
    nomComplet: '',
    telephonePrincipale: '',
    telephoneSecondaire: '',
    adresseComplete: '',
    cin: '',
    identifiantCNAM: '',
    technicienResponsable: '',
    antecedant: '',
    taille: '',
    poids: '',
    medecin: '',
    dateNaissance: '',
    beneficiaire: BeneficiaryType.ASSURE_SOCIAL,
    caisseAffiliation: 'CNSS',
    cnam: false,
    descriptionNom: '',
    descriptionTelephone: '',
    descriptionAdresse: '',
    nomSociete: '',
    matriculeFiscale: '',
    images: [],
    files: [],
    existingFiles: [],
  });

  const [renseignements, setRenseignements] = useState<Renseignement[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    fetchRenseignements();
  }, []);

  const fetchRenseignements = async () => {
    try {
      const response = await fetch('/api/renseignements');
      const data = await response.json();
      setRenseignements(data);
    } catch (error) {
      console.error('Error fetching renseignements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les renseignements",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: files,
      images: files
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type: 'Patient' | 'Société') => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  const handleEdit = (item: Renseignement) => {
    console.log('Editing item:', item); // Debug log

    if (item.type === 'Société') {
      const formData: RenseignementFormData = {
        id: item.id,
        type: 'Société' as const,
        // Empty patient fields
        nomComplet: '',
        cin: '',
        identifiantCNAM: '',
        antecedant: '',
        taille: '',
        poids: '',
        medecin: '',
        dateNaissance: '',
        beneficiaire: undefined,
        caisseAffiliation: undefined,
        cnam: false,
        // Société fields
        nomSociete: item.nom,
        matriculeFiscale: item.matriculeFiscale || '',
        telephonePrincipale: item.telephone,
        telephoneSecondaire: item.telephoneSecondaire || '',
        adresseComplete: item.adresse,
        technicienResponsable: item.technician?.id || '',
        descriptionNom: item.descriptionNom || '',
        descriptionTelephone: item.descriptionTelephone || '',
        descriptionAdresse: item.descriptionAdresse || '',
        // Files
        images: [],
        files: [],
        existingFiles: item.files || [],
      };
      
      console.log('Setting société form data:', formData);
      setFormData(formData);
    } else {
      // Map patient data to form fields
      const formData: RenseignementFormData = {
        id: item.id,
        type: 'Patient',
        // Map the fields using the correct names from the API
        nomComplet: item.nom || '',
        telephonePrincipale: item.telephone || '',
        telephoneSecondaire: item.telephoneSecondaire || '',
        adresseComplete: item.adresse || '',
        cin: item.cin || '',
        identifiantCNAM: item.identifiantCNAM || '',
        technicienResponsable: item.technician?.id || '',
        antecedant: item.antecedant || '',
        taille: item.taille?.toString() || '',
        poids: item.poids?.toString() || '',
        medecin: item.doctor?.id || '',
        dateNaissance: item.dateNaissance || '',
        beneficiaire: item.beneficiaire || BeneficiaryType.ASSURE_SOCIAL,
        caisseAffiliation: item.caisseAffiliation as CaisseAffiliation,
        cnam: !!item.cnam,
        descriptionNom: item.descriptionNom || '',
        descriptionTelephone: item.descriptionTelephone || '',
        descriptionAdresse: item.descriptionAdresse || '',
        // Files
        images: [],
        files: [],
        existingFiles: item.files || []
      };
      
      console.log('Patient data from API:', item);
      console.log('Transformed form data:', formData);
      setFormData(formData);
    }
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDelete = async (ids: string[]) => {
    // Get the first ID's type since we're currently only handling single deletes
    const itemToDelete = renseignements.find(item => item.id === ids[0]);
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/renseignements/${itemToDelete.type === 'Patient' ? 'patients' : 'companies'}/${ids[0]}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      // Remove the deleted item from the state
      setRenseignements(prev => prev.filter(item => !ids.includes(item.id)));
      
      toast({
        title: "Supprimé avec succès",
        description: `${itemToDelete.type} a été supprimé avec succès.`,
      });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(renseignements.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleViewFiles = (files: { url: string; type: string }[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Aucun fichier n'est disponible pour cet élément.",
      });
      return;
    }
    setSelectedFiles(files.map(file => file.url));
    setShowFilesDialog(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'Patient',
      nomComplet: '',
      telephonePrincipale: '',
      telephoneSecondaire: '',
      adresseComplete: '',
      cin: '',
      identifiantCNAM: '',
      technicienResponsable: '',
      antecedant: '',
      taille: '',
      poids: '',
      medecin: '',
      dateNaissance: '',
      beneficiaire: BeneficiaryType.ASSURE_SOCIAL,
      caisseAffiliation: 'CNSS',
      cnam: false,
      descriptionNom: '',
      descriptionTelephone: '',
      descriptionAdresse: '',
      nomSociete: '',
      matriculeFiscale: '',
      images: [],
      files: [],
      existingFiles: [],
    });
    setIsEdit(false);
  };

  const handleSubmit = async () => {
    try {
      // Determine which endpoint to use based on the type
      const endpoint = formData.type === 'Patient' 
        ? '/api/renseignements/patients'
        : '/api/renseignements/companies';
      
      // Create FormData instance for file upload
      const formDataObj = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'files' && key !== 'images' && key !== 'existingFiles') {
          formDataObj.append(key, value.toString());
        }
      });

      // Add files if present
      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file: File) => {
          formDataObj.append('files', file);
        });
      }

      // Add existing files if editing
      if (isEdit && formData.id) {
        formDataObj.append('id', formData.id);
        if (formData.existingFiles) {
          formDataObj.append('existingFiles', JSON.stringify(formData.existingFiles));
        }
      }

      console.log('Submitting form data:', {
        ...formData,
        files: formData.files?.length || 0,
        existingFiles: formData.existingFiles?.length || 0
      });

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isEdit ? 'update' : 'create'} renseignement`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      toast({
        title: "Succès",
        description: `Renseignement ${isEdit ? 'mis à jour' : 'créé'} avec succès`,
      });

      setIsOpen(false);
      await fetchRenseignements();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Renseignements</h1>
        <div className="space-x-2">
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedItems)}
            >
              Supprimer sélectionnés
            </Button>
          )}
          <Button onClick={() => {
            resetForm();
            setIsOpen(true);
          }}>
            Ajouter
          </Button>
        </div>
      </div>

      <RenseignementTable
        data={renseignements}
        selectedItems={selectedItems}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewFiles={(files) => handleViewFiles(files)}
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <TypeSelector
              selectedType={formData.type}
              onTypeChange={handleTypeChange}
            />

            {formData.type === 'Patient' ? (
              <PatientForm
                formData={formData}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
                onBack={() => setIsOpen(false)}
                onNext={handleSubmit}
              />
            ) : (
              <SocieteForm
                formData={formData}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
                onBack={() => setIsOpen(false)}
                onNext={handleSubmit}
              />
            )}
          </div>
        </div>
      )}

      <FileViewer
        files={selectedFiles}
        isOpen={showFilesDialog}
        onClose={() => setShowFilesDialog(false)}
      />
    </div>
  );
}