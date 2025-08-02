import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, FileText, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Edit3, Trash2, MoreVertical, Users, Building2, User } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Renseignement } from '@/types/renseignement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientDeletionDialog } from "@/components/ui/patient-deletion-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface RenseignementTableProps {
  data: Renseignement[];
  onEdit: (item: Renseignement) => void;
  onDelete: (ids: string[]) => void;
  onViewFiles: (files: { url: string; type: string }[]) => void;
  onViewDetails: (item: Renseignement) => void; // New prop for viewing details
  isLoading?: boolean;
  initialItemsPerPage?: number;
}

function RenseignementTable({
  data = [], // Default to empty array for SSR
  onEdit = () => {}, // Default noop function for SSR
  onDelete = () => {}, // Default noop function for SSR
  onViewFiles = () => {}, // Default noop function for SSR
  onViewDetails = () => {}, // Default noop function for viewing details
  isLoading = false, // Default for SSR
  initialItemsPerPage = 10 // Default items per page
}: RenseignementTableProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'patients' | 'companies'>('patients');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [paginatedData, setPaginatedData] = useState<Renseignement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Patient deletion dialog state
  const [showPatientDeletionDialog, setShowPatientDeletionDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    if (activeTab === 'patients') {
      return data.filter(item => item.type === 'Patient');
    } else {
      return data.filter(item => item.type === 'Société');
    }
  }, [data, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const patients = data.filter(item => item.type === 'Patient');
    const companies = data.filter(item => item.type === 'Société');
    return {
      totalPatients: patients.length,
      totalCompanies: companies.length,
      total: data.length
    };
  }, [data]);
  
  // Update paginated data when filtered data changes or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredData.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredData.length / itemsPerPage)));
    
    // Reset to page 1 if current page is out of bounds after data change
    if (currentPage > Math.ceil(filteredData.length / itemsPerPage) && filteredData.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Go to first page
  const goToFirstPage = () => {
    setCurrentPage(1);
  };
  
  // Go to last page
  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };
  
  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
  // Patient-specific columns
  const patientColumns = [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.original.nom}</div>
            <div className="text-sm text-gray-500">{row.original.telephone}</div>
          </div>
        </div>
      ),
    },
    {
      id: "medical_info",
      header: "Informations Médicales",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="space-y-1">
          {row.original.cin && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">CIN</Badge>
              <span className="text-sm">{row.original.cin}</span>
            </div>
          )}
          {row.original.identifiantCNAM && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">CNAM</Badge>
              <span className="text-sm">{row.original.identifiantCNAM}</span>
            </div>
          )}
          {row.original.imc && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">IMC</Badge>
              <span className="text-sm">{row.original.imc}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "address",
      header: "Adresse",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-900 truncate" title={row.original.adresse}>
            {row.original.adresse}
          </div>
        </div>
      ),
    },
    {
      id: "doctor",
      header: "Médecin Responsable",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.doctor ? (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 text-xs font-semibold">Dr</span>
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.doctor.name}</div>
              <div className="text-xs text-gray-500">{row.original.doctor.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Non assigné</div>
        )
      ),
    },
    {
      id: "technician",
      header: "Technicien",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.technician ? (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 text-xs font-semibold">T</span>
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.technician.name}</div>
              <div className="text-xs text-gray-500">{row.original.technician.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Non assigné</div>
        )
      ),
    },
    {
      id: "files",
      header: "Documents",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center justify-center">
          {row.original.files && row.original.files.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewFiles(row.original.files)}
              className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {row.original.files.length}
              </Badge>
            </Button>
          ) : (
            <span className="text-xs text-gray-400 italic">Aucun</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original)}
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
            title="Modifier"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          
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
                onClick={() => onViewDetails(row.original)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEdit(row.original)}
                className="cursor-pointer"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handlePatientDelete(row.original)}
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

  // Company-specific columns
  const companyColumns = [
    {
      id: "company",
      header: "Société",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.original.nom}</div>
            <div className="text-sm text-gray-500">{row.original.telephone}</div>
            {row.original.telephoneSecondaire && (
              <div className="text-sm text-gray-400">{row.original.telephoneSecondaire}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "business_info",
      header: "Informations Société",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="space-y-1">
          {row.original.matriculeFiscale && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">MF</Badge>
              <span className="text-sm">{row.original.matriculeFiscale}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "address",
      header: "Adresse",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-900 truncate" title={row.original.adresse}>
            {row.original.adresse}
          </div>
        </div>
      ),
    },
    {
      id: "technician",
      header: "Technicien Responsable",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.technician ? (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 text-xs font-semibold">T</span>
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.technician.name}</div>
              <div className="text-xs text-gray-500">{row.original.technician.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Non assigné</div>
        )
      ),
    },
    {
      id: "supervisor",
      header: "Superviseur",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        row.original.supervisor ? (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-700 text-xs font-semibold">S</span>
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.supervisor.name}</div>
              <div className="text-xs text-gray-500">{row.original.supervisor.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Non assigné</div>
        )
      ),
    },
    {
      id: "files",
      header: "Documents",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center justify-center">
          {row.original.files && row.original.files.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewFiles(row.original.files)}
              className="flex items-center space-x-2 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                {row.original.files.length}
              </Badge>
            </Button>
          ) : (
            <span className="text-xs text-gray-400 italic">Aucun</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Renseignement } }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original)}
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
            title="Modifier"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          
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
                onClick={() => onViewDetails(row.original)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEdit(row.original)}
                className="cursor-pointer"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleCompanyDelete(row.original.id)}
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
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Patients</p>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Sociétés</p>
                <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              </div>
              <Building2 className="h-8 w-8 text-emerald-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Entrées</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Tabs Interface */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'patients' | 'companies')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger 
              value="patients" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Patients ({stats.totalPatients})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="companies"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Building2 className="h-4 w-4" />
              <span>Sociétés ({stats.totalCompanies})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-6 space-y-4">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Liste des Patients
                </h3>
              </div>
              <DataTable
                columns={patientColumns}
                data={paginatedData}
              />
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-6 space-y-4">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-emerald-600" />
                  Liste des Sociétés
                </h3>
              </div>
              <DataTable
                columns={companyColumns}
                data={paginatedData}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Pagination controls */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Affichage de {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} entrées
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Lignes par page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

// This makes the component safe for both direct import and standalone rendering
export { RenseignementTable };
export default RenseignementTable;
