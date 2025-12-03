import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Trash2, ChevronLeft, ChevronRight, User, Building2, FileText, Upload, X, Download } from "lucide-react";
import { Renseignement } from '@/types/renseignement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientDeletionDialog } from "@/components/ui/patient-deletion-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUploader, type UploadedFile } from '@/components/ui/file-uploader';
import { useToast } from '@/components/ui/use-toast';

interface SimpleRenseignementTablesProps {
  data: Renseignement[];
  onEdit: (item: Renseignement) => void;
  onDelete: (ids: string[]) => void;
  onViewDetails: (item: Renseignement) => void;
  isLoading?: boolean;
  initialItemsPerPage?: number;
}

export default function SimpleRenseignementTables({
  data = [],
  onEdit,
  onDelete,
  onViewDetails,
  isLoading = false,
  initialItemsPerPage = 100
}: SimpleRenseignementTablesProps) {
  const [activeTab, setActiveTab] = useState<'patients' | 'companies'>('patients');

  // Pagination state for patients
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsPerPage, setPatientsPerPage] = useState(initialItemsPerPage);

  // Pagination state for companies
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesPerPage, setCompaniesPerPage] = useState(initialItemsPerPage);

  // Patient deletion dialog state
  const [showPatientDeletionDialog, setShowPatientDeletionDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Documents dialog state
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedPatientDocs, setSelectedPatientDocs] = useState<Renseignement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [savingFiles, setSavingFiles] = useState(false);
  const { toast } = useToast();

  // Filter data
  const patients = useMemo(() => data.filter(item => item.type === 'Patient'), [data]);
  const companies = useMemo(() => data.filter(item => item.type === 'Société'), [data]);

  // Paginated data
  const paginatedPatients = useMemo(() => {
    const start = (patientsPage - 1) * patientsPerPage;
    return patients.slice(start, start + patientsPerPage);
  }, [patients, patientsPage, patientsPerPage]);

  const paginatedCompanies = useMemo(() => {
    const start = (companiesPage - 1) * companiesPerPage;
    return companies.slice(start, start + companiesPerPage);
  }, [companies, companiesPage, companiesPerPage]);

  const patientsTotalPages = Math.max(1, Math.ceil(patients.length / patientsPerPage));
  const companiesTotalPages = Math.max(1, Math.ceil(companies.length / companiesPerPage));

  // Reset page when changing items per page
  const handlePatientsPerPageChange = (value: string) => {
    setPatientsPerPage(Number(value));
    setPatientsPage(1);
  };

  const handleCompaniesPerPageChange = (value: string) => {
    setCompaniesPerPage(Number(value));
    setCompaniesPage(1);
  };

  // Handle patient deletion
  const handlePatientDelete = (patient: Renseignement) => {
    setPatientToDelete({ id: patient.id, name: patient.nom });
    setShowPatientDeletionDialog(true);
  };

  const handleConfirmDelete = () => {
    // PatientDeletionDialog already handles the deletion internally
    // This callback is just for cleaning up UI state after deletion
    if (patientToDelete) {
      setShowPatientDeletionDialog(false);
      setPatientToDelete(null);
      // Reload the page to refresh the data
      window.location.reload();
    }
  };

  // Handle company deletion
  const handleCompanyDelete = async (company: Renseignement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la société "${company.nom}" ?`)) {
      await onDelete([company.id]);
    }
  };

  // Handle file upload complete
  const handleFileUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: 'Succès',
      description: `${files.length} fichier(s) téléchargé(s) avec succès`,
    });
  };

  // Handle file upload error
  const handleFileUploadError = (error: Error) => {
    toast({
      title: 'Erreur de téléchargement',
      description: error.message,
      variant: 'destructive',
    });
  };

  // Remove uploaded file
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Save files to database
  const handleSaveDocuments = async () => {
    if (!selectedPatientDocs || uploadedFiles.length === 0) return;

    try {
      setSavingFiles(true);

      const filesData = uploadedFiles.map(file => ({
        url: file.url,
        type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        fileName: file.name,
        fileSize: file.size,
        category: 'PATIENT_DOCUMENT',
        patientId: selectedPatientDocs.id,
      }));

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save documents');
      }

      toast({
        title: 'Succès',
        description: 'Documents enregistrés avec succès',
      });

      setUploadedFiles([]);
      setShowDocumentsDialog(false);

      // Refresh page to show updated files
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'enregistrement des documents',
        variant: 'destructive',
      });
    } finally {
      setSavingFiles(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange
  }: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (value: string) => void;
  }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{totalItems}</span> résultats au total
        </div>
        <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 par page</SelectItem>
            <SelectItem value="50">50 par page</SelectItem>
            <SelectItem value="100">100 par page</SelectItem>
            <SelectItem value="200">200 par page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <div className="flex items-center space-x-1">
          {/* Show page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-9 w-9 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 px-3"
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'patients' | 'companies')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Patients ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Sociétés ({companies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4">
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[100px]">Code</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Nom Complet</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">Téléphone 1</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">Téléphone 2</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">CIN</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">CNAM ID</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[130px]">Gouvernorat</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[130px]">Délégation</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Adresse</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[140px]">Médecin</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[140px]">Technicien</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[140px]">Superviseur</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[300px]">Description / Notes</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[100px]">Documents</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">Locations</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">Ventes</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[90px]">Diagnostics</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">RDV</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[90px]">Tâches</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[90px]">Paiements</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[90px]">Bons CNAM</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 sticky right-0 bg-slate-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient, index) => (
                    <tr
                      key={patient.id}
                      className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-3 py-2.5 text-xs border-r border-slate-100">
                        {patient.patientCode ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                            onClick={() => onViewDetails(patient)}
                          >
                            {patient.patientCode}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm font-medium text-slate-900 border-r border-slate-100 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        onClick={() => onViewDetails(patient)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              patient.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={patient.isActive !== false ? 'Actif' : 'Inactif'}
                          />
                          <span>{patient.nom}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.telephone || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.telephoneSecondaire || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.cin || '-'}</td>
                      <td className="px-3 py-2.5 text-xs border-r border-slate-100">
                        {patient.identifiantCNAM ? (
                          <Badge variant="secondary" className="text-xs font-normal">{patient.identifiantCNAM}</Badge>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.governorate || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.delegation || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100 max-w-[200px]">
                        <div className="truncate" title={patient.detailedAddress || patient.adresse}>
                          {patient.detailedAddress || patient.adresse || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.doctor?.name || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.technician?.name || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{patient.supervisor?.name || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100 max-w-[300px]">
                        <div className="line-clamp-2" title={patient.generalNote || ''}>
                          {patient.generalNote || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPatientDocs(patient);
                            setShowDocumentsDialog(true);
                          }}
                          className={`h-8 px-3 text-xs ${
                            patient.files && patient.files.length > 0
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {patient.files && patient.files.length > 0 ? (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                              {patient.files.length}
                            </Badge>
                          ) : (
                            <Upload className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      </td>

                      {/* Rentals/Locations */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.rentals && patient.rentals.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.rentals.map((rental: any) => (
                              <a
                                key={rental.id}
                                href={`/roles/admin/location?rental=${rental.id}`}
                                className="inline-block"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 text-xs font-mono hover:bg-green-100 cursor-pointer whitespace-nowrap"
                                >
                                  {rental.rentalCode || rental.id.slice(0, 8)}
                                </Badge>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Sales */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.sales && patient.sales.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.sales.map((sale: any) => (
                              <a
                                key={sale.id}
                                href={`/roles/admin/sales/${sale.id}`}
                                className="inline-block"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-mono hover:bg-purple-100 cursor-pointer whitespace-nowrap"
                                >
                                  {sale.saleCode || sale.id.slice(0, 8)}
                                </Badge>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Diagnostics */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.diagnostics && patient.diagnostics.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.diagnostics.map((diagnostic: any) => (
                              <Badge
                                key={diagnostic.id}
                                variant="outline"
                                className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs font-mono hover:bg-cyan-100 cursor-default whitespace-nowrap"
                              >
                                {diagnostic.diagnosticCode || diagnostic.id.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Appointments/RDV */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.appointments && patient.appointments.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.appointments.map((appointment: any) => (
                              <Badge
                                key={appointment.id}
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-mono hover:bg-orange-100 cursor-default whitespace-nowrap"
                              >
                                {appointment.appointmentCode || appointment.id.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Manual Tasks */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.tasks && patient.tasks.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.tasks.map((task: any) => (
                              <Badge
                                key={task.id}
                                variant="outline"
                                className="bg-violet-50 text-violet-700 border-violet-200 text-xs font-mono hover:bg-violet-100 cursor-default whitespace-nowrap"
                              >
                                {task.taskCode || task.id.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Payments */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.payments && patient.payments.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.payments.map((payment: any) => (
                              <Badge
                                key={payment.id}
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono whitespace-nowrap"
                              >
                                {payment.paymentCode || payment.id.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* CNAM Bonds */}
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {patient.cnamBonRentals && patient.cnamBonRentals.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {patient.cnamBonRentals.map((bond: any) => (
                              <Badge
                                key={bond.id}
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-mono whitespace-nowrap"
                              >
                                {bond.bonNumber || bond.dossierNumber || bond.id.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 sticky right-0 bg-inherit shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(patient)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(patient)}
                            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-700"
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePatientDelete(patient)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedPatients.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Aucun patient trouvé
              </div>
            )}

            <PaginationControls
              currentPage={patientsPage}
              totalPages={patientsTotalPages}
              itemsPerPage={patientsPerPage}
              totalItems={patients.length}
              onPageChange={setPatientsPage}
              onItemsPerPageChange={handlePatientsPerPageChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Nom Société</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Matricule Fiscale</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">Téléphone</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Adresse</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[140px]">Technicien</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 sticky right-0 bg-slate-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company, index) => (
                    <tr
                      key={company.id}
                      className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td
                        className="px-3 py-2.5 text-sm font-medium text-slate-900 border-r border-slate-100 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        onClick={() => onViewDetails(company)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              company.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={company.isActive !== false ? 'Actif' : 'Inactif'}
                          />
                          <span>{company.nom}</span>
                        </div>
                      </td>
                      <td
                        className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onViewDetails(company)}
                      >
                        {company.matriculeFiscale || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{company.telephone || '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100 max-w-[200px]">
                        <div className="truncate" title={company.adresse}>
                          {company.adresse || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 border-r border-slate-100">{company.technician?.name || '-'}</td>
                      <td className="px-3 py-2.5 sticky right-0 bg-inherit shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(company)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(company)}
                            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-700"
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompanyDelete(company)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedCompanies.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Aucune société trouvée
              </div>
            )}

            <PaginationControls
              currentPage={companiesPage}
              totalPages={companiesTotalPages}
              itemsPerPage={companiesPerPage}
              totalItems={companies.length}
              onPageChange={setCompaniesPage}
              onItemsPerPageChange={handleCompaniesPerPageChange}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Patient Deletion Dialog */}
      <PatientDeletionDialog
        isOpen={showPatientDeletionDialog}
        onClose={() => {
          setShowPatientDeletionDialog(false);
          setPatientToDelete(null);
        }}
        patientId={patientToDelete?.id || ''}
        onDeleteComplete={handleConfirmDelete}
        patientName={patientToDelete?.name || ''}
      />

      {/* Documents Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents - {selectedPatientDocs?.nom}
            </DialogTitle>
            <DialogDescription>
              Gérez les documents du patient ici. Vous pouvez télécharger de nouveaux documents ou voir ceux existants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[50vh] py-4">
            {/* Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Télécharger des documents
                </h4>
                {uploadedFiles.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {uploadedFiles.length} fichier(s) téléchargé(s)
                  </span>
                )}
              </div>

              {/* Show uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(index)}
                        className="flex-shrink-0 h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={handleSaveDocuments}
                    disabled={savingFiles}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {savingFiles ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Enregistrement en cours...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Enregistrer les documents
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* File uploader */}
              <FileUploader
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                maxFiles={10}
                maxSize={16 * 1024 * 1024}
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.png', '.jpg', '.jpeg'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                }}
              />
              <p className="text-xs text-gray-500">
                Formats acceptés: PDF, Images (PNG, JPG), Documents Word. Maximum 16MB par fichier.
              </p>
            </div>

            {/* Existing Documents */}
            {selectedPatientDocs?.files && selectedPatientDocs.files.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents existants ({selectedPatientDocs.files.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedPatientDocs.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {file.url.split('/').pop() || `Document ${index + 1}`}
                          </p>
                          <p className="text-xs text-slate-500">{file.type || 'Document'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-8 px-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.url.split('/').pop() || 'document';
                            link.click();
                          }}
                          className="h-8 px-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Aucun document disponible</p>
                <p className="text-xs text-slate-400 mt-1">
                  Téléchargez des documents pour commencer
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDocumentsDialog(false);
                setSelectedPatientDocs(null);
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
