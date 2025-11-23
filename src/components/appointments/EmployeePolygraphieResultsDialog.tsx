import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DiagnosticDeviceSelector } from '@/components/forms/components/DiagnosticDeviceSelector';
import { FileUploader, type UploadedFile } from '@/components/ui/file-uploader';
import { Loader2, Calendar, Stethoscope, User, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeePolygraphieResultsDialogProps {
  appointment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DiagnosticFormData {
  medicalDeviceId: string;
  diagnosticDate: string;
  followUpDate: string;
  iah: string;
  idValue: string;
  notes: string;
  status: string;
}

export function EmployeePolygraphieResultsDialog({
  appointment,
  open,
  onOpenChange,
}: EmployeePolygraphieResultsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // State for uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Initialize form with appointment data - performedById is automatically set to logged-in user
  const [formData, setFormData] = useState<DiagnosticFormData>({
    medicalDeviceId: '',
    diagnosticDate: appointment?.scheduledDate
      ? new Date(appointment.scheduledDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    followUpDate: '',
    iah: '',
    idValue: '',
    notes: appointment?.notes || '',
    status: 'PENDING',
  });

  // Auto-calculate follow-up date (next day)
  useEffect(() => {
    if (formData.diagnosticDate) {
      const diagDate = new Date(formData.diagnosticDate);
      diagDate.setDate(diagDate.getDate() + 1);
      setFormData((prev) => ({
        ...prev,
        followUpDate: diagDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.diagnosticDate]);

  // Calculate severity based on IAH value
  const calculateSeverity = (iah: number) => {
    if (iah < 5) return { label: 'Normal', color: 'bg-green-100 text-green-800' };
    if (iah < 15) return { label: 'Léger', color: 'bg-yellow-100 text-yellow-800' };
    if (iah < 30) return { label: 'Modéré', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Sévère', color: 'bg-red-100 text-red-800' };
  };

  const severity = formData.iah ? calculateSeverity(parseFloat(formData.iah)) : null;

  // Create diagnostic mutation
  const createDiagnosticMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/appointments/${appointment.id}/create-diagnostic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create diagnostic');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      toast({
        title: 'Succès',
        description: 'Polygraphie complétée et diagnostic créé avec succès',
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        medicalDeviceId: '',
        diagnosticDate: new Date().toISOString().split('T')[0],
        followUpDate: '',
        iah: '',
        idValue: '',
        notes: '',
        status: 'PENDING',
      });
      setUploadedFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création du diagnostic',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.medicalDeviceId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un appareil',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.diagnosticDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une date',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data - automatically use logged-in user ID
    const diagnosticData = {
      medicalDeviceId: formData.medicalDeviceId,
      diagnosticDate: new Date(formData.diagnosticDate).toISOString(),
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      performedById: session?.user?.id || null, // Automatically assigned to logged-in employee
      status: formData.status,
      result: {
        iah: formData.iah ? parseFloat(formData.iah) : null,
        idValue: formData.idValue ? parseFloat(formData.idValue) : null,
        status: formData.status,
        remarque: formData.notes || null,
      },
      notes: formData.notes || null,
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
    };

    createDiagnosticMutation.mutate(diagnosticData);
  };

  const updateField = (field: keyof DiagnosticFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    toast({
      title: 'Succès',
      description: `${files.length} fichier(s) téléchargé(s) avec succès`,
    });
  };

  const handleFileUploadError = (error: Error) => {
    toast({
      title: 'Erreur de téléchargement',
      description: error.message,
      variant: 'destructive',
    });
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            Compléter la Polygraphie
          </DialogTitle>
          <DialogDescription>
            Enregistrer les résultats de la polygraphie pour le patient{' '}
            <strong>
              {appointment?.patient?.firstName && appointment?.patient?.lastName
                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                : 'N/A'}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Patient:</span>{' '}
                <span className="font-medium">
                  {appointment?.patient?.firstName && appointment?.patient?.lastName
                    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Code:</span>{' '}
                <span className="font-medium">{appointment?.patient?.patientCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Téléphone:</span>{' '}
                <span className="font-medium">{appointment?.patient?.telephone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date RDV:</span>{' '}
                <span className="font-medium">
                  {appointment?.scheduledDate
                    ? new Date(appointment.scheduledDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Performed By - Display only (locked to current user) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-900">Effectué par:</Label>
              <Badge className="bg-green-600 text-white">
                {session?.user?.name || 'Utilisateur actuel'}
              </Badge>
            </div>
          </div>

          {/* Device Selection */}
          <div className="space-y-2">
            <Label htmlFor="device" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Appareil de Diagnostic *
            </Label>
            <DiagnosticDeviceSelector
              value={formData.medicalDeviceId}
              onChange={(val) => updateField('medicalDeviceId', val)}
              placeholder="Sélectionner un appareil de polygraphie..."
              className="w-full"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosticDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date du Diagnostic *
              </Label>
              <Input
                id="diagnosticDate"
                type="date"
                value={formData.diagnosticDate}
                onChange={(e) => updateField('diagnosticDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpDate">Date de Suivi</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => updateField('followUpDate', e.target.value)}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4">Résultats de la Polygraphie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iah">IAH (Index Apnée-Hypopnée)</Label>
                <Input
                  id="iah"
                  type="number"
                  step="0.1"
                  value={formData.iah}
                  onChange={(e) => updateField('iah', e.target.value)}
                  placeholder="Ex: 15.5"
                />
                {severity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Sévérité:</span>
                    <Badge className={severity.color}>{severity.label}</Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idValue">ID (Index de Désaturation)</Label>
                <Input
                  id="idValue"
                  type="number"
                  step="0.1"
                  value={formData.idValue}
                  onChange={(e) => updateField('idValue', e.target.value)}
                  placeholder="Ex: 12.3"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(val) => updateField('status', val)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En Attente</SelectItem>
                <SelectItem value="COMPLETED">Complété</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Ajouter des notes ou observations..."
              rows={4}
            />
          </div>

          {/* File Upload Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents de Polygraphie (Optionnel)
                </Label>
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
                </div>
              )}

              {/* File uploader */}
              <FileUploader
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                maxFiles={5}
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createDiagnosticMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createDiagnosticMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createDiagnosticMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer le Diagnostic'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
