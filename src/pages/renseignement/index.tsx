import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
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
import { Settings2 } from "lucide-react";
import PatientForm from '@/components/forms/PatientForm';
import SocieteForm from '@/components/forms/SocieteForm';

type RenseignementType = 'Patient' | 'Société';

interface FormData {
  type: RenseignementType;
  step: number;
  // Patient specific fields
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
  img?: File;
  // Société specific fields
  nomSociete?: string;
  matriculeFiscale?: string;
  descriptionNom?: string;
  descriptionTelephone?: string;
}

const RenseignementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: 'Patient',
    step: 1,
  });

  const handleTypeChange = (type: RenseignementType) => {
    setFormData({ ...formData, type });
  };

  const handleNext = () => {
    setFormData({ ...formData, step: formData.step + 1 });
  };

  const handleBack = () => {
    setFormData({ ...formData, step: formData.step - 1 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, img: e.target.files[0] });
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
        <h1 className="text-2xl font-semibold">Renseignements</h1>
        <Button variant="default" onClick={() => setIsOpen(true)}>
          Nouveau Renseignement
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Num Tél</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((item) => (
              <TableRow key={item}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>Abbes</TableCell>
                <TableCell>Abess@example.com</TableCell>
                <TableCell>95 456 123</TableCell>
                <TableCell>Polo</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        Installation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Export Rapport
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Historique
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
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-5xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title 
                  as="h3" 
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {formData.step === 1 ? 'Nouveau Renseignement' : formData.type === 'Patient' ? 'Ajout Patient' : 'Ajout Société'}
                </Dialog.Title>
                {formData.step === 1 && <TypeSelection />}
                {formData.step === 2 && formData.type === 'Patient' && (
                  <PatientForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onFileChange={handleFileChange}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                )}
                {formData.step === 2 && formData.type === 'Société' && (
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
        </Dialog>
      </Transition>
    </div>
  );
};

export default RenseignementPage;
