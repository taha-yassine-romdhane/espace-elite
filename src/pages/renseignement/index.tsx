import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, FileText, ImageIcon, Paperclip } from "lucide-react";
import PatientForm from '@/components/forms/PatientForm';
import SocieteForm from '@/components/forms/SocieteForm';
import { useToast } from "@/components/ui/use-toast";
import { BeneficiaryType } from '@/types';
import FileViewerModal from '@/components/FileViewerModal';

type RenseignementType = 'Patient' | 'Société';

interface FileRecord {
  id: string;
  url: string;
  type: string;
  createdAt: Date;
}

interface Person {
  id: string;
  name: string;
  role: string;
}

type BaseFormData = {
  id?: string;
  step: number;
  telephonePrincipale?: string;
  telephoneSecondaire?: string;
  adresseComplete?: string;
  technicienResponsable?: string;
  docteurId?: string;
  img?: File;
  imageUrl?: string;
};

type PatientFormData = BaseFormData & {
  type: 'Patient';
  nomComplet?: string;
  cin?: string;
  identifiantCNAM?: string;
  cnam?: boolean;
  dateNaissance?: string;
  poids?: string;
  taille?: string;
  antecedant?: string;
  description1?: string;
  description2?: string;
  beneficiaire?: BeneficiaryType | string;
  caisseAffiliation?: 'CNSS' | 'CNRPS';
};

type SocieteFormData = BaseFormData & {
  type: 'Société';
  nomSociete?: string;
  matriculeFiscale?: string;
  descriptionNom?: string;
  descriptionTelephone?: string;
  descriptionAdresse?: string;
};

type FormData = PatientFormData | SocieteFormData;

interface Renseignement {
  id: string;
  type: RenseignementType ;
  nom: string;
  adresse: string;
  telephone: string;
  telephoneSecondaire?: string;
  doctor?: Person | null;
  technician?: Person | null;
  files: FileRecord[];
  dateNaissance?: string;
  cin?: string;
  identifiantCNAM?: string;
  cnam?: boolean;
  taille?: number;
  poids?: number;
  imc?: number;
  antecedant?: string;
  description1?: string;
  description2?: string;
  caisseAffiliation?: string;
  beneficiaire?: string;
  matriculeFiscale?: string;
  createdAt: string;
}

const FileIcon = ({ type }: { type: string }) => {
  if (type.toUpperCase() === 'IMAGE') {
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-gray-500" />;
};

const RenseignementPage = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: 'Patient',
    step: 1,
  });
  const [renseignements, setRenseignements] = useState<Renseignement[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileRecord[]>([]);

  useEffect(() => {
    fetchRenseignements();
  }, []);

  const fetchRenseignements = async () => {
    try {
      const response = await fetch('/api/renseignements');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRenseignements(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = (type: RenseignementType) => {
    setFormData({ ...formData, type });
  };
  const openFileModal = (files: FileRecord[]) => {
    setSelectedFiles(files);
    setIsFileModalOpen(true);
  };

  const closeFileModal = () => {
    setIsFileModalOpen(false);
    setSelectedFiles([]);
  };

  const handleNext = async () => {
    if (formData.step === 2) {
      try {
        console.log('Submitting form data:', formData);
        const response = await fetch('/api/renseignements', {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to save');
        }

        const responseData = await response.json();
        console.log('API Response:', responseData);

        toast({
          title: "Success",
          description: `${isEdit ? 'Updated' : 'Created'} successfully`,
        });

        setIsOpen(false);
        fetchRenseignements();
        resetForm();
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save data",
          variant: "destructive",
        });
      }
    } else {
      setFormData(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    setFormData({ ...formData, step: formData.step - 1 });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        img: file
      }));
    }
  };

  const handleEdit = (item: Renseignement) => {
    setIsEdit(true);
    
    // Format the date to YYYY-MM-DD for the input field
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    // Map beneficiary values from API to form values
    const mapBeneficiary = (value?: string) => {
      const mapping: { [key: string]: BeneficiaryType | string } = {
        'Assure social': 'ASSURE_SOCIAL',
        'Conjoint enfant': 'CONJOINT_ENFANT', 
        'Assandant': 'ASSANDANT'
      };
      return value ? mapping[ value] : undefined;
    };

    const baseData = {
      id: item.id,
      type: item.type,
      step: 2,
      telephonePrincipale: item.telephone,
      telephoneSecondaire: item.telephoneSecondaire,
      adresseComplete: item.adresse,
      technicienResponsable: item.technician?.id,
      docteurId: item.doctor?.id,
    };

    if (item.type === 'Patient') {
      // Get the first image file if it exists
      const imageFile = item.files.find(f => f.type === 'IMAGE');
      
      setFormData({
        ...baseData,
        type: 'Patient',
        nomComplet: item.nom,
        cin: item.cin,
        identifiantCNAM: item.identifiantCNAM,
        cnam: !!item.identifiantCNAM,
        dateNaissance: formatDate(item.dateNaissance),
        poids: item.poids?.toString(),
        taille: item.taille?.toString(),
        antecedant: item.antecedant,
        description1: item.description1,
        description2: item.description2,
        beneficiaire: mapBeneficiary(item.beneficiaire),
        caisseAffiliation: item.caisseAffiliation as 'CNSS' | 'CNRPS',
        imageUrl: imageFile?.url // Add the image URL if it exists
      });
    } else {
      const imageFile = item.files.find(f => f.type === 'IMAGE');
      
      setFormData({
        ...baseData,
        type: 'Société',
        nomSociete: item.nom,
        matriculeFiscale: item.matriculeFiscale,
        descriptionNom: item.description1,
        descriptionTelephone: item.description2,
        descriptionAdresse: item.adresse,
        imageUrl: imageFile?.url // Add the image URL if it exists
      });
    }
    setIsOpen(true);
  };

  const handleDelete = async (id: string, type: RenseignementType) => {
    try {
      const response = await fetch(`/api/renseignements?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: "Success",
        description: "Deleted successfully",
      });

      fetchRenseignements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Patient',
      step: 1,
    });
    setIsEdit(false);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  const TypeSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Type de Renseignement</h2>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={formData.type === 'Patient'}
            onChange={() => handleTypeChange('Patient')}
            className="form-radio"
          />
          <span>Patient</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={formData.type === 'Société'}
            onChange={() => handleTypeChange('Société')}
            className="form-radio"
          />
          <span>Société</span>
        </label>
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="default" onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Renseignements</h1>
        <Button variant="default" onClick={() => {
          resetForm();
          setIsOpen(true);
        }}>
          Nouveau Renseignement
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={selectedItems.length === renseignements.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedItems(renseignements.map(item => item.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Dr Responsable</TableHead>
              <TableHead>Technicien Responsable</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Fichiers</TableHead>
              <TableHead className="w-24">Date</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renseignements.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(item.id, !!checked);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.type === 'Patient' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {item.nom}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{item.telephone}</div>
                    {item.type === 'Société' && item.telephoneSecondaire && (
                      <div className="text-sm text-gray-500">{item.telephoneSecondaire}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={item.adresse}>
                    {item.adresse}
                  </div>
                </TableCell>
                <TableCell>
                  {item.type === 'Patient' && item.doctor ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-700 text-xs font-medium">Dr</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{item.doctor.name}</div>
                        <div className="text-gray-500 text-xs">{item.doctor.role}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Non assigné</div>
                  )}
                </TableCell>
                <TableCell>
                  {item.technician ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 text-xs">{item.technician.role.charAt(0)}</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{item.technician.name}</div>
                        <div className="text-gray-500 text-xs">{item.technician.role}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Non assigné</div>
                  )}
                </TableCell>
                <TableCell>
                  {item.type === 'Patient' ? (
                    <div className="space-y-1 text-sm">
                      {item.cin && <div>CIN: {item.cin}</div>}
                      {item.identifiantCNAM && <div>CNAM: {item.identifiantCNAM}</div>}
                      {item.taille && item.poids && (
                        <div>
                          {item.imc && <div>IMC: {item.imc}</div>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {item.matriculeFiscale && (
                        <div>MF: {item.matriculeFiscale}</div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {item.files.length > 0 ? (
                    <div className="flex -space-x-2">
                      {item.files.slice(0, 3).map((file) => (
                        <div
                          key={file.id}
                          className="relative h-8 w-8 rounded-full border-2 border-white bg-gray-100 hover:z-10 cursor-pointer"
                          onClick={() => openFileModal([file])}
                          title={`${file.type.toLowerCase()} - ${new Date(file.createdAt).toLocaleDateString()}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileIcon type={file.type} />
                          </div>
                        </div>
                      ))}
                      {item.files.length > 3 && (
                        <div 
                          className="relative h-8 w-8 rounded-full border-2 border-white bg-gray-100 hover:z-10 flex items-center justify-center cursor-pointer"
                          onClick={() => openFileModal(item.files)}
                        >
                          <span className="text-xs text-gray-600">+{item.files.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <Paperclip className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(item.id, item.type)}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {isEdit ? 'Modifier Renseignement' : 'Nouveau Renseignement'}
                  </Dialog.Title>
                  {formData.step === 1 ? (
                    <TypeSelection />
                  ) : formData.type === 'Patient' ? (
                    <PatientForm
                      formData={formData}
                      onInputChange={handleInputChange}
                      onFileChange={handleFileChange}
                      onBack={handleBack}
                      onNext={handleNext}
                    />
                  ) : (
                    <SocieteForm
                      formData={formData}
                      onInputChange={handleInputChange}
                      onFileChange={handleFileChange}
                      onBack={handleBack}
                      onNext={handleNext}
                    />
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <FileViewerModal
        isOpen={isFileModalOpen}
        onClose={closeFileModal}
        files={selectedFiles}
      />
    </div>
  );
};

export default RenseignementPage;