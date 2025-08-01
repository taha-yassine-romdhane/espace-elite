import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, User, Search, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PatientForm from '@/components/forms/PatientForm';

interface Client {
  id: string;
  name: string;
  type: 'patient';
  telephone?: string;
  firstName?: string;
  lastName?: string;
}

interface AppointmentClientSelectionStepProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
}

export function AppointmentClientSelectionStep({ 
  selectedClient, 
  onClientSelect 
}: AppointmentClientSelectionStepProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  

  // Fetch patients only for appointments
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      console.log('Fetching patients for appointment...');
      const response = await fetch('/api/renseignements/patients');
      if (!response.ok) {
        console.error('Failed to fetch patients:', response.status, response.statusText);
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      console.log('Patients data:', data);
      return data.patients || [];
    },
  });

  // Format patients for appointment selection
  const formatPatients = (rawPatients: any[]): Client[] => {
    if (!rawPatients) {
      console.log('No rawPatients data received');
      return [];
    }
    
    console.log('Raw patients data received:', rawPatients);
    console.log('First patient structure:', rawPatients[0]);
    
    return rawPatients.map(patient => {
      console.log('Processing patient:', patient);
      
      // Use the name from API, or fallback to constructing it
      let patientName = patient.name;
      if (!patientName || patientName.trim() === '') {
        patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        if (!patientName) {
          patientName = `Patient ${patient.id}`;
        }
      }
      
      const formattedPatient = {
        id: patient.id,
        name: patientName,
        type: 'patient' as const,
        telephone: patient.telephone,
        firstName: patient.firstName,
        lastName: patient.lastName,
      };
      console.log('Formatted patient:', formattedPatient);
      return formattedPatient;
    });
  };

  const currentClients = formatPatients(patients);

  // Filter clients based on search
  const filteredClients = currentClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.telephone && client.telephone.includes(searchQuery))
  );

  console.log('Current clients after formatting:', currentClients);
  console.log('Filtered clients:', filteredClients);
  console.log('Search query:', searchQuery);

  const handleClientSelect = (clientId: string) => {
    const client = currentClients.find(c => c.id === clientId);
    if (client) {
      onClientSelect(client);
    }
  };

  const handleCreatePatient = async (formData: any) => {
    try {
      const apiFormData = new FormData();
      
      // Add form data to FormData object
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          apiFormData.append(key, value as string);
        }
      });

      const response = await fetch('/api/renseignements/patients', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to create patient');
      }

      const newPatient = await response.json();
      
      // Format the new patient
      const formattedPatient: Client = {
        id: newPatient.id,
        name: `${newPatient.firstName || ''} ${newPatient.lastName || ''}`.trim(),
        type: 'patient',
        telephone: newPatient.telephone,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
      };

      // Select the new patient
      onClientSelect(formattedPatient);
      
      setIsCreateFormOpen(false);
      
      toast({
        title: 'Succès',
        description: 'Patient créé avec succès',
      });

      // The query will automatically refetch and update the list

    } catch (error) {
      console.error('Error creating patient:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création du patient',
        variant: 'destructive',
      });
    }
  };

  const isLoading = patientsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Sélection du Patient</h3>
        
        {/* Info about appointment being for patients only */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">Rendez-vous Patient</div>
              <div className="text-sm text-blue-600">
                Les rendez-vous sont uniquement disponibles pour les patients
              </div>
            </div>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Sélectionner le Patient
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateFormOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau Patient
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un patient..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Patient Select */}
              <Select
                value={selectedClient?.id || ''}
                onValueChange={handleClientSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => {
                      console.log('Rendering client:', client);
                      return (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span>{client.name || 'Nom non disponible'}</span>
                            {client.telephone && (
                              <span className="text-sm text-gray-500">- {client.telephone}</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      {searchQuery ? 'Aucun résultat trouvé' : 'Aucun patient disponible'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Patient Display */}
          {selectedClient && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">{selectedClient.name}</div>
                  <div className="text-sm text-gray-600">
                    Patient{selectedClient.telephone && ` - ${selectedClient.telephone}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {patientsError && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600">
                Erreur lors du chargement des patients: {patientsError.message}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Patient Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nouveau Patient
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <PatientForm 
              formData={{
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
                beneficiaire: '' as any,
                caisseAffiliation: 'CNSS' as any,
                cnam: false,
              }}
              onInputChange={() => {}}
              onFileChange={() => {}}
              onBack={() => setIsCreateFormOpen(false)}
              onNext={() => handleCreatePatient({})}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AppointmentClientSelectionStep;