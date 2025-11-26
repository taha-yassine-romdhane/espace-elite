import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, AlertCircle, Calendar, Stethoscope, UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader, type UploadedFile } from '@/components/ui/file-uploader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CompleteDiagnosticDialogAdminProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUSES = [
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' }
];

export function CompleteDiagnosticDialogAdmin({ open, onOpenChange }: CompleteDiagnosticDialogAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [resultData, setResultData] = useState({
    iah: '',
    idValue: '',
    notes: '',
    status: 'COMPLETED'
  });

  // Fetch ALL PENDING diagnostics (admin can see all)
  const { data: diagnosticsData, isLoading } = useQuery({
    queryKey: ['diagnostics', 'all-pending'],
    queryFn: async () => {
      const response = await fetch('/api/diagnostics?status=PENDING');
      if (!response.ok) throw new Error('Failed to fetch diagnostics');
      const data = await response.json();
      return data.diagnostics || [];
    },
    enabled: open,
  });

  const pendingDiagnostics = Array.isArray(diagnosticsData) ? diagnosticsData : [];
  const selectedDiagnostic = pendingDiagnostics.find((d: any) => d.id === selectedDiagnosticId);

  // Calculate severity based on IAH
  const getSeverity = (iah: string): { label: string; color: string } => {
    const iahValue = parseFloat(iah);
    if (isNaN(iahValue) || iah === '') {
      return { label: '-', color: 'bg-gray-100 text-gray-800' };
    }

    if (iahValue < 5) {
      return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-300' };
    } else if (iahValue < 15) {
      return { label: 'Léger', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    } else if (iahValue < 30) {
      return { label: 'Modéré', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    } else {
      return { label: 'Sévère', color: 'bg-red-100 text-red-800 border-red-300' };
    }
  };

  const severity = getSeverity(resultData.iah);

  // Update diagnostic mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/diagnostics/${data.diagnosticId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: data.status,
          result: {
            iah: data.iah ? parseFloat(data.iah) : null,
            idValue: data.idValue ? parseFloat(data.idValue) : null
          },
          notes: data.notes,
          fileUrls: data.fileUrls || []
        })
      });
      if (!response.ok) throw new Error('Failed to update diagnostic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      toast({ title: 'Succès', description: 'Diagnostic mis à jour avec succès' });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        variant: 'destructive'
      });
    },
  });

  const handleClose = () => {
    setSelectedDiagnosticId(null);
    setUploadedFiles([]);
    setResultData({
      iah: '',
      idValue: '',
      notes: '',
      status: 'COMPLETED'
    });
    onOpenChange(false);
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

  const handleSubmit = async () => {
    if (!selectedDiagnosticId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un diagnostic', variant: 'destructive' });
      return;
    }

    const payload = {
      diagnosticId: selectedDiagnosticId,
      iah: resultData.iah,
      idValue: resultData.idValue,
      notes: resultData.notes,
      status: resultData.status,
      fileUrls: uploadedFiles.map(file => file.url)
    };

    await updateMutation.mutateAsync(payload);
  };

  const updateField = (field: string, value: any) => {
    setResultData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Compléter les Résultats du Diagnostic
          </DialogTitle>
          <DialogDescription>
            {selectedDiagnosticId ? "Entrez les résultats et mettez à jour le statut" : "Sélectionnez un diagnostic en attente"}
          </DialogDescription>
        </DialogHeader>

        {!selectedDiagnosticId ? (
          /* Diagnostic Selection */
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col px-2">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Sélectionnez un diagnostic en attente pour compléter ses résultats
              </span>
            </div>

            <ScrollArea className="flex-1 rounded-md border">
              <div className="p-2 space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Chargement des diagnostics...
                  </div>
                ) : pendingDiagnostics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun diagnostic en attente
                  </div>
                ) : (
                  pendingDiagnostics.map((diagnostic: any) => (
                    <Button
                      key={diagnostic.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-4 px-4 hover:bg-blue-50 border"
                      onClick={() => setSelectedDiagnosticId(diagnostic.id)}
                    >
                      <div className="flex flex-col items-start w-full gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                            {diagnostic.diagnosticCode}
                          </Badge>
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">
                            {diagnostic.patient?.firstName} {diagnostic.patient?.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto bg-yellow-100 text-yellow-800">
                            En attente
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(diagnostic.diagnosticDate || diagnostic.date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {diagnostic.medicalDevice?.name}
                          </span>
                          {diagnostic.performedBy && (
                            <span className="flex items-center gap-1">
                              <UserCog className="h-3 w-3" />
                              {diagnostic.performedBy.name}
                            </span>
                          )}
                          {diagnostic.followUpDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Suivi: {format(new Date(diagnostic.followUpDate), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* Results Form */
          <div className="space-y-6 flex-1 overflow-y-auto px-2">
            {/* Selected Diagnostic Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedDiagnostic?.diagnosticCode}
                  </Badge>
                  <span className="font-medium">
                    {selectedDiagnostic?.patient?.firstName} {selectedDiagnostic?.patient?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-700">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedDiagnostic?.diagnosticDate || selectedDiagnostic?.date), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    {selectedDiagnostic?.medicalDevice?.name}
                  </span>
                  {selectedDiagnostic?.performedBy && (
                    <span className="flex items-center gap-1">
                      <UserCog className="h-3 w-3" />
                      Assigné à: {selectedDiagnostic.performedBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2-Column Grid for Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IAH */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  IAH (Index Apnée/Hypopnée)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={resultData.iah}
                  onChange={(e) => updateField('iah', e.target.value)}
                  placeholder="Ex: 15.5"
                />
              </div>

              {/* ID Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  ID (Index de Désaturation)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={resultData.idValue}
                  onChange={(e) => updateField('idValue', e.target.value)}
                  placeholder="Ex: 12.3"
                />
              </div>

              {/* Severity (Display Only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Sévérité (calculée)
                </label>
                <div className="pt-2">
                  <Badge variant="outline" className={`${severity.color}`}>
                    {severity.label}
                  </Badge>
                </div>
              </div>

              {/* Rapport - File Count Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Rapport
                </label>
                <div className="pt-2">
                  <Badge variant="outline" className={`${uploadedFiles.length > 0 ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                    {uploadedFiles.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      'Aucun fichier'
                    )}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Statut <span className="text-red-500">*</span>
                </label>
                <Select
                  value={resultData.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes - Full Width Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                value={resultData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Notes additionnelles sur les résultats..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* File Uploader - Full Width */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Fichiers joints (optionnel)
              </label>
              <FileUploader
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                maxFiles={10}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
          <Button
            variant="outline"
            onClick={selectedDiagnosticId ? () => setSelectedDiagnosticId(null) : handleClose}
          >
            {selectedDiagnosticId ? 'Retour' : 'Annuler'}
          </Button>

          {selectedDiagnosticId && (
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les résultats"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
