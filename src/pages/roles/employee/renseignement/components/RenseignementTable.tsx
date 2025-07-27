import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, FileText, Edit3, Trash2, MoreVertical } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Renseignement } from '@/types/renseignement';
import { PatientDeletionDialog } from "@/components/ui/patient-deletion-dialog";

interface RenseignementTableProps {
  data?: Renseignement[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (item: Renseignement) => void;
  onDelete: (ids: string[]) => void;
  onViewFiles: (files: { url: string; type: string }[]) => void;
}

export function RenseignementTable({
  data = [],
  selectedItems,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onViewFiles,
}: RenseignementTableProps) {
  // Patient deletion dialog state
  const [showPatientDeletionDialog, setShowPatientDeletionDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Handle patient deletion with dialog
  const handlePatientDelete = (patient: Renseignement) => {
    setPatientToDelete({ id: patient.id, name: patient.nom });
    setShowPatientDeletionDialog(true);
  };

  // Handle company deletion (direct)
  const handleCompanyDelete = async (companyId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
      onDelete([companyId]);
    }
  };
  const columns = [
    {
      id: "select",
      header: ({ table }: { table: { getIsAllPageRowsSelected: () => boolean } }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => onSelectAll(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <Checkbox
          checked={selectedItems.includes(row.original.id)}
          onCheckedChange={() => onSelect(row.original.id)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
          row.original.type === 'Patient' 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {row.original.type}
        </span>
      ),
    },
    {
      id: "name",
      header: "Nom",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="font-medium text-gray-900">
          {row.original.nom}
        </div>
      ),
    },
    {
      id: "telephone",
      header: "Téléphone",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="space-y-1">
          <div>{row.original.telephone}</div>
          {row.original.type === 'Société' && row.original.telephoneSecondaire && (
            <div className="text-sm text-gray-500">{row.original.telephoneSecondaire}</div>
          )}
        </div>
      ),
    },
    {
      id: "address",
      header: "Adresse",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="max-w-xs truncate" title={row.original.adresse}>
          {row.original.adresse}
        </div>
      ),
    },
    {
      id: "doctor",
      header: "Dr Responsable",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.type === 'Patient' && row.original.doctor ? (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 text-xs font-medium">Dr</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">{row.original.doctor.name}</div>
              <div className="text-gray-500 text-xs">{row.original.doctor.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Non assigné</div>
        )
      ),
    },
    {
      id: "technician",
      header: "Technicien Responsable",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.technician ? (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 text-xs">{row.original.technician.role.charAt(0)}</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">{row.original.technician.name}</div>
              <div className="text-gray-500 text-xs">{row.original.technician.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Non assigné</div>
        )
      ),
    },
    {
      id: "supervisor",
      header: "Superviseur",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.supervisor ? (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-700 text-xs">S</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">{row.original.supervisor.name}</div>
              <div className="text-gray-500 text-xs">{row.original.supervisor.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Non assigné</div>
        )
      ),
    },
    {
      id: "details",
      header: "Détails",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.type === 'Patient' ? (
          <div className="space-y-1 text-sm">
            {row.original.cin && <div>CIN: {row.original.cin}</div>}
            {row.original.identifiantCNAM && <div>CNAM: {row.original.identifiantCNAM}</div>}
            {row.original.taille && row.original.poids && row.original.imc && (
              <div>IMC: {row.original.imc}</div>
            )}
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            {row.original.matriculeFiscale && (
              <div>MF: {row.original.matriculeFiscale}</div>
            )}
          </div>
        )
      ),
    },
    {
      id: "files",
      header: "Fichiers",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center">
          {row.original.files && row.original.files.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewFiles(row.original.files)}
              className="flex items-center space-x-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">{row.original.files.length}</span>
            </Button>
          ) : (
            <span className="text-sm text-gray-400 italic">Aucun fichier</span>
          )}
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center space-x-2">
          {/* Quick action buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
            title="Modifier"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          
          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-gray-50"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => onEdit(row.original)}
                className="cursor-pointer"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (row.original.type === 'Patient') {
                    handlePatientDelete(row.original);
                  } else {
                    handleCompanyDelete(row.original.id);
                  }
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
      />

      {/* Patient Deletion Dialog */}
      {patientToDelete && (
        <PatientDeletionDialog
          isOpen={showPatientDeletionDialog}
          onClose={() => {
            setShowPatientDeletionDialog(false);
            setPatientToDelete(null);
          }}
          patientId={patientToDelete.id}
          patientName={patientToDelete.name}
          onDeleteComplete={() => {
            // Refresh the data after successful deletion
            window.location.reload(); // Simple refresh - you could make this more elegant
          }}
        />
      )}
    </>
  );
}

export default RenseignementTable;
