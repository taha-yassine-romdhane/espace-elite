import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, FileText, Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Renseignement } from '@/types/renseignement';

interface RenseignementTableProps {
  data: Renseignement[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (item: Renseignement) => void;
  onDelete: (ids: string[]) => void;
  onViewFiles: (files: { url: string; type: string }[]) => void;
  isLoading?: boolean;
}

function RenseignementTable({
  data = [], // Default to empty array for SSR
  selectedItems = [], // Default for SSR
  onSelect = () => {}, // Default noop function for SSR
  onSelectAll = () => {}, // Default noop function for SSR
  onEdit = () => {}, // Default noop function for SSR
  onDelete = () => {}, // Default noop function for SSR
  onViewFiles = () => {}, // Default noop function for SSR
  isLoading = false // Default for SSR
}: RenseignementTableProps) {
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.original.type === 'Patient' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.original.type}
        </span>
      ),
    },
    {
      id: "name",
      header: "Nom",
      cell: ({ row }: { row: { original: Renseignement } }) => row.original.nom,
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
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>{row.original.files.length} fichier(s)</span>
            </Button>
          ) : (
            <span className="text-sm text-gray-500">Aucun fichier</span>
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
      header: "",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete([row.original.id])}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Add this check for server-side rendering or when data is not yet loaded
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
    />
  );
}

// This makes the component safe for both direct import and standalone rendering
export { RenseignementTable };
export default RenseignementTable;
