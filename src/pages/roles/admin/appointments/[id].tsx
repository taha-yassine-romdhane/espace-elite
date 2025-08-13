import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  AlertCircle,
  ArrowLeft,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Appointment {
  id: string;
  appointmentType: string;
  scheduledDate: string;
  location: string;
  notes?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    telephone: string;
  };
  company?: {
    id: string;
    companyName: string;
    telephone: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Planifié', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONFIRMED', label: 'Confirmé', color: 'bg-green-100 text-green-800' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-800' }
];

const priorityOptions = [
  { value: 'LOW', label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Élevé', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function AppointmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');

  // Fetch appointment details
  const { data: appointment, isLoading, error } = useQuery<Appointment>({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch appointment');
      const data = await response.json();
      // Handle nested appointment structure
      return data.appointment || data;
    },
    enabled: !!id && router.isReady,
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes: string }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsEditing(false);
      toast({
        title: "Rendez-vous mis à jour",
        description: "Les modifications ont été sauvegardées avec succès.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (appointment) {
      setEditedStatus(appointment.status);
      setEditedNotes(appointment.notes || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateAppointmentMutation.mutate({
      status: editedStatus,
      notes: editedNotes,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStatus('');
    setEditedNotes('');
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return (
      <Badge className={`${priorityOption?.color || 'bg-gray-100 text-gray-800'}`}>
        {priorityOption?.label || priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Rendez-vous introuvable
              </h2>
              <p className="text-gray-600 mb-4">
                Le rendez-vous demandé n'existe pas ou a été supprimé.
              </p>
              <Button onClick={() => router.push('/roles/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = appointment.patient 
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : appointment.company?.companyName || 'Client inconnu';

  const clientPhone = appointment.patient?.telephone || appointment.company?.telephone || '';

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/roles/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Détails du rendez-vous
              </h1>
              <p className="text-gray-600">ID: {appointment.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={updateAppointmentMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Information Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium">{clientName}</p>
              </div>
              {clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{clientPhone}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <Badge variant="outline">
                  {appointment.patient ? 'Patient' : 'Société'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Détails du Rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Type de rendez-vous</p>
                <p className="font-medium">{appointment.appointmentType}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date et heure</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">
                    {new Date(appointment.scheduledDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} à {new Date(appointment.scheduledDate).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Lieu</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{appointment.location}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Priorité</p>
                {getPriorityBadge(appointment.priority)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status and Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Statut et Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Statut</p>
              {!isEditing ? (
                getStatusBadge(appointment.status)
              ) : (
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              {!isEditing ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  {appointment.notes ? (
                    <p className="text-gray-900">{appointment.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">Aucune note</p>
                  )}
                </div>
              ) : (
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Ajouter des notes..."
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Créé le</p>
                <p className="font-medium">
                  {new Date(appointment.createdAt).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(appointment.createdAt).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Dernière modification</p>
                <p className="font-medium">
                  {new Date(appointment.updatedAt).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(appointment.updatedAt).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}