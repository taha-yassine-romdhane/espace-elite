import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, User, Building2, Users, Building, ChevronRight, X, UserPlus, BuildingIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PatientForm from "../../../../../../components/forms/PatientForm";
import SocieteForm from "../../../../../../components/forms/SocieteForm";
import { BeneficiaryType } from "@/types";
import { cn } from "@/lib/utils";

interface ClientSelectionStepProps {
  onNext: () => void;
  onClose: () => void;
  onClientTypeChange: (type: "patient" | "societe") => void;
  onClientSelect: (clientId: string) => void;
  clientType: "patient" | "societe" | null;
  selectedClient: string | null;
  clients: any[];
  isLoading: boolean;
  error: string | null;
  action: "location" | "vente" | "diagnostique" | null;
}

export function ClientSelectionStep({
  onNext,
  onClose,
  onClientTypeChange,
  onClientSelect,
  clientType,
  selectedClient,
  clients,
  isLoading,
  error,
  action,
}: ClientSelectionStepProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Patient form state
  const [patientFormData, setPatientFormData] = useState({
    nomComplet: "",
    telephonePrincipale: "",
    telephoneSecondaire: "",
    adresseComplete: "",
    cin: "",
    identifiantCNAM: "",
    technicienResponsable: "",
    antecedant: "",
    taille: "",
    poids: "",
    medecin: "",
    dateNaissance: "",
    beneficiaire: "" as BeneficiaryType,
    caisseAffiliation: "CNSS" as "CNSS" | "CNRPS",
    cnam: false,
    description1: "",
    description2: "",
  });

  // Societe form state
  const [societeFormData, setSocieteFormData] = useState({
    nomSociete: "",
    telephonePrincipale: "",
    telephoneSecondaire: "",
    adresseComplete: "",
    matriculeFiscale: "",
    technicienResponsable: "",
    descriptionNom: "",
    descriptionTelephone: "",
    descriptionAdresse: "",
  });

  const handlePatientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocieteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSocieteFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setPatientFormData(prev => ({ ...prev, img: files[0] }));
    }
  };

  const handleSocieteFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setSocieteFormData(prev => ({ ...prev, img: files[0] }));
    }
  };

  const handleCreateSuccess = (newClient: any) => {
    onClientSelect(newClient.id);
    setIsCreateFormOpen(false);
    setSearchQuery(""); // Reset search query
    
    // Reset form data
    if (clientType === "patient") {
      setPatientFormData({
        nomComplet: "",
        telephonePrincipale: "",
        telephoneSecondaire: "",
        adresseComplete: "",
        cin: "",
        identifiantCNAM: "",
        technicienResponsable: "",
        antecedant: "",
        taille: "",
        poids: "",
        medecin: "",
        dateNaissance: "",
        beneficiaire: "" as BeneficiaryType,
        caisseAffiliation: "CNSS",
        cnam: false,
        description1: "",
        description2: "",
      });
    } else {
      setSocieteFormData({
        nomSociete: "",
        telephonePrincipale: "",
        telephoneSecondaire: "",
        adresseComplete: "",
        matriculeFiscale: "",
        technicienResponsable: "",
        descriptionNom: "",
        descriptionTelephone: "",
        descriptionAdresse: "",
      });
    }
  };

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim() || !clients.length) return clients;
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  // Determine if we should show the client type selection
  // For location and diagnostic, we only allow patient selection
  const showClientTypeSelection = action === "vente";

  // If it's a location or diagnostic, automatically select patient type
  useEffect(() => {
    if ((action === "location" || action === "diagnostique") && clientType !== "patient") {
      onClientTypeChange("patient");
    }
  }, [action, clientType, onClientTypeChange]);

  return (
    <>
      <div className="space-y-6">
        {showClientTypeSelection ? (
          <div>
            <Label className="text-base font-semibold text-[#1e3a8a]">Type de Client</Label>
            <RadioGroup
              className="grid grid-cols-2 gap-4 mt-4"
              value={clientType || ""}
              onValueChange={(value) => onClientTypeChange(value as "patient" | "societe")}
            >
              <div className={cn(
                "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all",
                "hover:border-[#1e3a8a] hover:bg-blue-50",
                clientType === "patient" ? "border-[#1e3a8a] bg-blue-50" : "border-gray-200"
              )}>
                <RadioGroupItem value="patient" id="patient" className="text-[#1e3a8a]" />
                <Label htmlFor="patient" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#1e3a8a]" />
                    <div>
                      <div className="font-medium text-[#1e3a8a]">Patient</div>
                      <div className="text-sm text-gray-500">Particulier</div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all",
                "hover:border-[#1e3a8a] hover:bg-blue-50",
                clientType === "societe" ? "border-[#1e3a8a] bg-blue-50" : "border-gray-200"
              )}>
                <RadioGroupItem value="societe" id="societe" className="text-[#1e3a8a]" />
                <Label htmlFor="societe" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#1e3a8a]" />
                    <div>
                      <div className="font-medium text-[#1e3a8a]">Société</div>
                      <div className="text-sm text-gray-500">Entreprise</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : (
          // For location and diagnostic, just show a message indicating patient selection
          <div>
            <Label className="text-base font-semibold text-[#1e3a8a]">Type de Client</Label>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#1e3a8a]" />
                <div>
                  <div className="font-medium text-[#1e3a8a]">Patient</div>
                  <div className="text-sm text-gray-600">
                    {action === "location" ? 
                      "Les locations sont uniquement disponibles pour les patients" : 
                      "Les services de diagnostic sont uniquement disponibles pour les patients"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {clientType && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-[#1e3a8a] flex items-center gap-2">
                {clientType === "patient" ? (
                  <>
                    <Users className="h-5 w-5" />
                    Sélectionner le Patient
                  </>
                ) : (
                  <>
                    <Building className="h-5 w-5" />
                    Sélectionner la Société
                  </>
                )}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateFormOpen(true)}
                className="flex items-center gap-2 text-[#1e3a8a] border-[#1e3a8a] hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                {clientType === "patient" ? "Nouveau Patient" : "Nouvelle Société"}
              </Button>
            </div>

            <div className="relative">
              <Select
                value={selectedClient || ""}
                onValueChange={onClientSelect}
              >
                <SelectTrigger className="border-[#1e3a8a] focus:ring-[#1e3a8a]">
                  <SelectValue placeholder={
                    clientType === "patient" 
                      ? "Sélectionner un patient" 
                      : "Sélectionner une société"
                  } />
                </SelectTrigger>
                <SelectContent className="p-0">
                  <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        placeholder={clientType === "patient" ? "Rechercher un patient..." : "Rechercher une société..."}
                        className="pl-8 h-9 w-full border-[#1e3a8a] focus:ring-[#1e3a8a]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking input
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto py-1">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        {searchQuery ? "Aucun résultat trouvé" : "Aucun client disponible"}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedClient}
            className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white flex items-center gap-2"
          >
            Continuer
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create Client Form Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-[#1e3a8a]">
              {clientType === "patient" ? (
                <>
                  <UserPlus className="h-5 w-5" />
                  Nouveau Patient
                </>
              ) : (
                <>
                  <BuildingIcon className="h-5 w-5" />
                  Nouvelle Société
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {clientType === "patient" ? (
              <PatientForm 
                formData={patientFormData}
                onInputChange={handlePatientInputChange}
                onFileChange={handlePatientFileChange}
                onBack={() => setIsCreateFormOpen(false)}
                onNext={() => {
                  handleCreateSuccess({ id: Date.now().toString(), name: patientFormData.nomComplet });
                }}
              />
            ) : (
              <SocieteForm 
                formData={societeFormData}
                onInputChange={handleSocieteInputChange}
                onFileChange={handleSocieteFileChange}
                onBack={() => setIsCreateFormOpen(false)}
                onNext={() => {
                  handleCreateSuccess({ id: Date.now().toString(), name: societeFormData.nomSociete });
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
