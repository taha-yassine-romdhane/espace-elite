import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Printer, Phone, CreditCard, Building2, MapPin, Stethoscope, Wrench, Ruler, Weight, Edit, Save, X, Power, PowerOff } from 'lucide-react';
import { FileViewer } from '../../components/FileViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PatientForm from '@/components/forms/PatientForm';
import { RenseignementFormData } from '@/types/renseignement';
import { BeneficiaryType } from '@prisma/client';

// CNAM Bond type
interface CNAMBon {
  id: string;
  bonNumber?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Rental with CNAM bonds
interface RentalWithCNAM {
  id: string;
  rentalCode?: string;
  cnamBons?: CNAMBon[];
}

// Sale with CNAM bonds
interface SaleWithCNAM {
  id: string;
  saleCode?: string;
  cnamBons?: CNAMBon[];
}

// Patient data as returned by the API
interface PatientData {
  id: string;
  patientCode?: string;
  nom: string;
  telephone?: string;
  telephoneSecondaire?: string;
  adresse?: string;
  governorate?: string;
  delegation?: string;
  cin?: string;
  identifiantCNAM?: string;
  dateNaissance?: string;
  taille?: number;
  poids?: number;
  antecedant?: string;
  beneficiaire?: BeneficiaryType;
  caisseAffiliation?: string;
  cnam?: boolean;
  generalNote?: string;
  isActive?: boolean;
  doctorId?: string;
  doctor?: { id: string; name: string };
  technicianId?: string;
  technician?: { id: string; name: string };
  supervisorId?: string;
  supervisor?: { id: string; name: string };
  assignedToId?: string;
  files?: { url: string; type: string }[];
  manualTasks?: unknown[];
  appointments?: unknown[];
  diagnostics?: unknown[];
  sales?: SaleWithCNAM[];
  rentals?: RentalWithCNAM[];
  payments?: unknown[];
  history?: unknown[];
}

// Import custom components
import {
  PatientBasicInfo,
  PatientContactInfo,
  PatientMedicalInfo,
  PatientStaffInfo,
  PatientHistory,
  PatientDiagnostics,
  PatientPayments,
  PatientRentals,
  PatientSales,
  PatientAppointments,
  PatientCNAMBonds,
  PatientRDV,
  PatientPrintDialog,
  PatientDocuments
} from '@/components/patient';

export default function PatientDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const { toast } = useToast();
  const [editFormData, setEditFormData] = useState<RenseignementFormData>({
    type: 'Patient',
    nomComplet: '',
    telephonePrincipale: '',
    telephoneSecondaire: '',
    detailedAddress: '',
    cin: '',
    identifiantCNAM: '',
    technicienResponsable: '',
    superviseur: '',
    antecedant: '',
    taille: '',
    poids: '',
    medecin: '',
    dateNaissance: '',
    beneficiaire: BeneficiaryType.ASSURE_SOCIAL,
    caisseAffiliation: 'CNSS',
    cnam: false,
    generalNote: '',
    nomSociete: '',
    matriculeFiscale: '',
    images: [],
    files: [],
    existingFiles: [],
  });

  // Fetch patient data
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (id) {
        const response = await fetch(`/api/renseignements/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }
        return response.json();
      }
    },
    enabled: !!id
  });

  // Check for missing patient information fields
  const checkMissingFields = (patient: PatientData) => {
    const missingFields: string[] = [];

    // Informations de base
    if (!patient.nom) missingFields.push('Nom complet');
    if (!patient.dateNaissance) missingFields.push('Date de naissance');
    if (!patient.cin) missingFields.push('CIN');

    // Coordonnées
    if (!patient.telephone) missingFields.push('Téléphone');
    if (!patient.adresse) missingFields.push('Adresse');
    if (!patient.governorate) missingFields.push('Gouvernorat');
    if (!patient.delegation) missingFields.push('Délégation');

    // Informations médicales
    if (!patient.taille) missingFields.push('Taille');
    if (!patient.poids) missingFields.push('Poids');
    if (!patient.antecedant) missingFields.push('Antécédents médicaux');

    // Médecin et technicien
    if (!patient.doctorId && !patient.doctor) missingFields.push('Médecin traitant');
    if (!patient.technicianId && !patient.technician) missingFields.push('Technicien responsable');
    if (!patient.supervisorId && !patient.supervisor && !patient.assignedToId) missingFields.push('Superviseur');

    return missingFields;
  };

  // Populate form data when patient loads and check for missing fields
  useEffect(() => {
    if (patient) {
      setEditFormData({
        type: 'Patient',
        id: patient.id,
        nomComplet: patient.nom || '',
        telephonePrincipale: patient.telephone || '',
        telephoneSecondaire: patient.telephoneSecondaire || '',
        detailedAddress: patient.adresse || '',
        governorate: patient.governorate || '',
        delegation: patient.delegation || '',
        cin: patient.cin || '',
        identifiantCNAM: patient.identifiantCNAM || '',
        technicienResponsable: patient.technicianId || patient.technician?.id || '',
        superviseur: patient.supervisorId || patient.supervisor?.id || patient.assignedToId || '',
        antecedant: patient.antecedant || '',
        taille: patient.taille?.toString() || '',
        poids: patient.poids?.toString() || '',
        medecin: patient.doctorId || '',
        dateNaissance: patient.dateNaissance ? new Date(patient.dateNaissance).toISOString().split('T')[0] : '',
        beneficiaire: patient.beneficiaire || BeneficiaryType.ASSURE_SOCIAL,
        caisseAffiliation: patient.caisseAffiliation || 'CNSS',
        cnam: patient.cnam || false,
        generalNote: patient.generalNote || '',
        nomSociete: '',
        matriculeFiscale: '',
        images: [],
        files: [],
        existingFiles: patient.files || [],
      });

      // Check for missing fields and show persistent toast if any
      const missingFields = checkMissingFields(patient);
      if (missingFields.length > 0 && !toastId) {
        const { id } = toast({
          title: "⚠️ Informations patient incomplètes",
          description: (
            <div className="mt-2">
              <p className="mb-2 font-medium">Les champs suivants sont manquants :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {missingFields.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs opacity-80">
                Veuillez compléter ces informations pour un dossier complet.
              </p>
            </div>
          ),
          variant: "destructive",
          duration: Infinity, // Never auto-dismiss
        });
        setToastId(id);
      }
    }
  }, [patient, toast, toastId]);

  // Handler for viewing files
  const handleViewFiles = (files: { url: string; type: string }[]) => {
    if (files && files.length > 0) {
      const fileUrls = files.map(file => file.url);
      setSelectedFiles(fileUrls);
      setShowFilesDialog(true);
    } else {
      toast({
        title: "Aucun fichier",
        description: "Il n'y a aucun fichier à afficher.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    router.push('/roles/admin/renseignement');
  };

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditNote = () => {
    setEditedNote(patient?.generalNote || '');
    setIsEditingNote(true);
  };

  const handleCancelNoteEdit = () => {
    setIsEditingNote(false);
    setEditedNote('');
  };

  const handleSaveNote = async () => {
    try {
      const response = await fetch(`/api/renseignements/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generalNote: editedNote
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      await queryClient.invalidateQueries({ queryKey: ['patient', id] });

      toast({
        title: 'Succès',
        description: 'La note générale a été mise à jour',
      });

      setIsEditingNote(false);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la note',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async () => {
    try {
      const newActiveStatus = !patient.isActive;

      const response = await fetch(`/api/renseignements/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: newActiveStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update patient status');
      }

      await queryClient.invalidateQueries({ queryKey: ['patient', id] });

      toast({
        title: 'Succès',
        description: `Patient marqué comme ${newActiveStatus ? 'actif' : 'inactif'}`,
      });
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du patient',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (files: File[]) => {
    setEditFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const handleSavePatient = async () => {
    try {
      const endpoint = '/api/renseignements/patients';
      const formDataObj = new FormData();

      // Add all form fields
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'files' && key !== 'images' && key !== 'existingFiles') {
          formDataObj.append(key, value.toString());
        }
      });

      // Add files if present
      if (editFormData.files && editFormData.files.length > 0) {
        editFormData.files.forEach((file: File) => {
          formDataObj.append('files', file);
        });
      }

      // Add existing files
      if (editFormData.existingFiles && editFormData.existingFiles.length > 0) {
        formDataObj.append('existingFiles', JSON.stringify(editFormData.existingFiles));
      }

      // Add ID for editing
      if (editFormData.id) {
        formDataObj.append('id', editFormData.id);
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        body: formDataObj,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update patient');
      }

      // Refresh patient data after successful save
      await queryClient.invalidateQueries({ queryKey: ['patient', id] });
      setShowEditDialog(false);
      toast({
        title: "Succès",
        description: "Les informations du patient ont été mises à jour.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading patient data</h2>
          <p className="text-gray-500">{(error as Error).message}</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Renseignement
          </Button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">Patient non trouvé</h2>
          <p className="text-gray-700 mb-4">
            Le patient que vous recherchez n&apos;existe pas ou a été supprimé.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/roles/admin/renseignement")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste des renseignements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-2 py-4 md:px-4 md:py-6">
      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/roles/admin/renseignement")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste des renseignements
        </Button>
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full flex-shrink-0 ${
                    patient.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={patient.isActive !== false ? 'Actif' : 'Inactif'}
                />
                {patient.nom}
              </h1>
              {patient.patientCode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-blue-100 text-blue-800">
                  {patient.patientCode}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Patient
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                patient.isActive !== false
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {patient.isActive !== false ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {/* Patient Quick Info */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              {patient.telephone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span>{patient.telephone}</span>
                </div>
              )}
              {patient.cin && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>{patient.cin}</span>
                </div>
              )}
              {patient.identifiantCNAM && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>CNAM: {patient.identifiantCNAM}</span>
                </div>
              )}
              {(patient.governorate || patient.delegation) && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>{[patient.governorate, patient.delegation].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {patient.doctor?.name && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Stethoscope className="h-4 w-4 text-blue-500" />
                  <span>Dr. {patient.doctor.name}</span>
                </div>
              )}
              {patient.technician?.name && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  <span>{patient.technician.name}</span>
                </div>
              )}
              {patient.taille && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Ruler className="h-4 w-4 text-blue-500" />
                  <span>{patient.taille} cm</span>
                </div>
              )}
              {patient.poids && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Weight className="h-4 w-4 text-blue-500" />
                  <span>{patient.poids} kg</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant={patient.isActive !== false ? "outline" : "default"}
              onClick={handleToggleActive}
              className={`flex items-center gap-2 ${
                patient.isActive !== false
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              title={patient.isActive !== false ? "Marquer comme inactif" : "Marquer comme actif"}
            >
              {patient.isActive !== false ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Activer
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            {patient.files && patient.files.length > 0 && (
              <Button 
                variant="secondary"
                onClick={() => handleViewFiles(patient.files)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Voir les fichiers ({patient.files.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - All sections in one scrollable page */}
      <div className="space-y-6">
        {/* Patient Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PatientBasicInfo patient={patient} />
          <PatientContactInfo patient={patient} />
          <PatientMedicalInfo patient={patient} />
          <PatientStaffInfo patient={patient} />
        </div>

        {/* General Note Section - Editable */}
        <Card>
          <CardContent className="pt-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Note générale</p>
                {!isEditingNote ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditNote}
                    className="h-8 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelNoteEdit}
                      className="h-8 gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveNote}
                      className="h-8 gap-2 bg-blue-900 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>

              {!isEditingNote ? (
                <p className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {patient.generalNote || (
                    <span className="text-gray-400 italic">Aucune note générale ajoutée</span>
                  )}
                </p>
              ) : (
                <Textarea
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  placeholder="Ajouter une note générale..."
                  className="min-h-[120px] text-base"
                  autoFocus
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1. Manual Tasks Section */}
        <PatientAppointments
          manualTasks={patient.manualTasks || []}
          isLoading={false}
          patientId={patient.id}
          patient={{
            id: patient.id,
            firstName: patient.nom?.split(' ')[0] || '',
            lastName: patient.nom?.split(' ').slice(1).join(' ') || '',
            patientCode: patient.patientCode,
            telephone: patient.telephone
          }}
        />

        {/* 2. RDV Section */}
        <PatientRDV
          appointments={patient.appointments || []}
          isLoading={false}
          patientId={patient.id}
          patient={{
            id: patient.id,
            firstName: patient.nom?.split(' ')[0] || '',
            lastName: patient.nom?.split(' ').slice(1).join(' ') || '',
            patientCode: patient.patientCode,
            telephone: patient.telephone
          }}
        />

        {/* 3. Diagnostics Section (Polygraphie) */}
        <PatientDiagnostics
          diagnostics={patient.diagnostics || []}
          isLoading={false}
          patientId={patient.id}
          patient={{
            id: patient.id,
            firstName: patient.nom?.split(' ')[0] || '',
            lastName: patient.nom?.split(' ').slice(1).join(' ') || '',
            patientCode: patient.patientCode,
            telephone: patient.telephone
          }}
        />

        {/* 4. Sales Section (Vente) */}
        <PatientSales
          sales={patient.sales || []}
          saleItems={patient.saleItems || []}
          isLoading={false}
          patientId={patient.id}
          patient={{
            id: patient.id,
            firstName: patient.nom?.split(' ')[0] || '',
            lastName: patient.nom?.split(' ').slice(1).join(' ') || '',
            patientCode: patient.patientCode,
            telephone: patient.telephone
          }}
        />

        {/* 5. Rentals Section (Location) */}
        <PatientRentals
          rentals={patient.rentals || []}
          isLoading={false}
          patientId={patient.id}
          patient={{
            id: patient.id,
            firstName: patient.nom?.split(' ')[0] || '',
            lastName: patient.nom?.split(' ').slice(1).join(' ') || '',
            patientCode: patient.patientCode,
            telephone: patient.telephone
          }}
        />

        {/* 6. Payments Section (Paiement) */}
        <PatientPayments
          payments={patient.payments || []}
          isLoading={false}
          patientId={patient.id}
        />

        {/* 7. CNAM Bonds Section */}
        <PatientCNAMBonds
          cnamBonds={[
            ...(patient.rentals?.flatMap((rental: RentalWithCNAM) =>
              (rental.cnamBons || []).map((bon: CNAMBon) => ({
                ...bon,
                sourceType: 'Location',
                sourceCode: rental.rentalCode
              }))
            ) || []),
            ...(patient.sales?.flatMap((sale: SaleWithCNAM) =>
              (sale.cnamBons || []).map((bon: CNAMBon) => ({
                ...bon,
                sourceType: 'Vente',
                sourceCode: sale.saleCode
              }))
            ) || [])
          ]}
          isLoading={false}
          patientId={patient.id}
        />

        {/* 8. Documents Section */}
        <PatientDocuments
          patientId={patient.id}
          diagnostics={patient.diagnostics || []}
          sales={patient.sales || []}
          rentals={patient.rentals || []}
        />

        {/* History Section */}
        <PatientHistory
          history={patient.history || []}
          isLoading={false}
        />
      </div>

      {/* File Viewer Dialog */}
      <FileViewer
        files={selectedFiles}
        isOpen={showFilesDialog}
        onClose={() => setShowFilesDialog(false)}
      />

      {/* Edit Patient Dialog */}
      {patient && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Edit className="h-5 w-5 text-blue-500" />
                Modifier les informations du patient
              </DialogTitle>
            </DialogHeader>
            <PatientForm
              formData={editFormData}
              onInputChange={handleInputChange}
              onFileChange={handleFileChange}
              onBack={handleCancelEdit}
              onNext={handleSavePatient}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Print Dialog */}
      {patient && (
        <PatientPrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          patientId={patient.id}
          patientName={patient.nom}
        />
      )}
    </div>
  );
}
