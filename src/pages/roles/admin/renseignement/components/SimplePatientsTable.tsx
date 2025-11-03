import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Renseignement } from '@/types/renseignement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientDeletionDialog } from "@/components/ui/patient-deletion-dialog";
import { Badge } from "@/components/ui/badge";

interface SimplePatientsTableProps {
  data: Renseignement[];
  onEdit: (item: Renseignement) => void;
  onDelete: (ids: string[]) => void;
  onViewDetails: (item: Renseignement) => void;
  isLoading?: boolean;
  initialItemsPerPage?: number;
}

export default function SimplePatientsTable({
  data = [],
  onEdit,
  onDelete,
  onViewDetails,
  isLoading = false,
  initialItemsPerPage = 50
}: SimplePatientsTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [paginatedData, setPaginatedData] = useState<Renseignement[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Patient deletion dialog state
  const [showPatientDeletionDialog, setShowPatientDeletionDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filter only patients
  const patients = useMemo(() => {
    return data.filter(item => item.type === 'Patient');
  }, [data]);

  // Update paginated data
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(patients.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(patients.length / itemsPerPage)));

    if (currentPage > Math.ceil(patients.length / itemsPerPage) && patients.length > 0) {
      setCurrentPage(1);
    }
  }, [patients, currentPage, itemsPerPage]);

  // Handle patient deletion with dialog
  const handlePatientDelete = (patient: Renseignement) => {
    setPatientToDelete({ id: patient.id, name: patient.nom });
    setShowPatientDeletionDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (patientToDelete) {
      await onDelete([patientToDelete.id]);
      setShowPatientDeletionDialog(false);
      setPatientToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{patients.length}</span> patients
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-2">
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="25">25 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
              <SelectItem value="100">100 par page</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1 px-3 h-9 text-sm">
              <span className="font-medium">{currentPage}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-500">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Excel-like Table with Horizontal Scroll */}
      <div className="relative border rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Code</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Nom Complet</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">Téléphone 1</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">Téléphone 2</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">CIN</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">CNAM ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Gouvernorat</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Délégation</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[200px]">Adresse</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Médecin</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Technicien</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[150px]">Superviseur</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[300px]">Description / Notes</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 sticky right-0 bg-slate-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((patient, index) => (
                <tr
                  key={patient.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.patientCode || '-'}</td>
                  <td className="px-3 py-2 text-sm font-medium text-slate-900 border-r border-slate-100">{patient.nom}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.telephone || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.telephoneSecondaire || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.cin || '-'}</td>
                  <td className="px-3 py-2 text-xs border-r border-slate-100">
                    {patient.identifiantCNAM ? (
                      <Badge variant="secondary" className="text-xs">{patient.identifiantCNAM}</Badge>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.governorate || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.delegation || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100 max-w-[200px] truncate" title={patient.detailedAddress || patient.adresse}>
                    {patient.detailedAddress || patient.adresse || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.doctor?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.technician?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100">{patient.supervisor?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 border-r border-slate-100 max-w-[300px]">
                    <div className="line-clamp-2" title={patient.generalNote || ''}>
                      {patient.generalNote || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 sticky right-0 bg-inherit shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(patient)}
                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                        title="Voir les détails"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(patient)}
                        className="h-7 w-7 p-0 hover:bg-orange-50 hover:text-orange-600"
                        title="Modifier"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientDelete(patient)}
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Aucun patient trouvé
          </div>
        )}
      </div>

      {/* Patient Deletion Dialog */}
      <PatientDeletionDialog
        isOpen={showPatientDeletionDialog}
        onClose={() => {
          setShowPatientDeletionDialog(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        patientName={patientToDelete?.name || ''}
      />
    </div>
  );
}
