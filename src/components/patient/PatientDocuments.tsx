import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { FileUploader } from '@/components/ui/file-uploader';
import {
  FileText,
  Download,
  Trash2,
  FileIcon,
  ImageIcon,
  FileVideo,
  FileAudio,
  Loader2,
  Upload,
  ExternalLink
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PatientDocumentsProps {
  patientId: string;
  diagnostics?: Array<{ id: string; diagnosticCode?: string; diagnosticDate: string }>;
  sales?: Array<{ id: string; saleCode?: string; saleDate: string }>;
  rentals?: Array<{ id: string; rentalCode?: string; startDate: string }>;
}

interface FileDocument {
  id: string;
  url: string;
  type: string;
  fileName?: string | null;
  fileSize?: number | null;
  category?: string | null;
  description?: string | null;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  diagnostic?: {
    id: string;
    diagnosticCode?: string | null;
    diagnosticDate: string;
  } | null;
  sale?: {
    id: string;
    saleCode?: string | null;
    saleDate: string;
  } | null;
  rental?: {
    id: string;
    rentalCode?: string | null;
    startDate: string;
  } | null;
}

export function PatientDocuments({ patientId, diagnostics = [], sales = [], rentals = [] }: PatientDocumentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('TITRATION');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string>('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [selectedRentalId, setSelectedRentalId] = useState<string>('');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Fetch documents for the patient
  const { data: documents = [], isLoading } = useQuery<FileDocument[]>({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!patientId,
  });

  interface DocumentData {
    url: string;
    type: string;
    fileName: string;
    fileSize: number;
    category: string;
    description: string | null;
    diagnosticId?: string;
    saleId?: string;
    rentalId?: string;
  }

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentData) => {
      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({
        title: 'Succès',
        description: 'Document ajouté avec succès',
      });
      // Reset form
      setUploadDescription('');
      setSelectedDiagnosticId('');
      setSelectedSaleId('');
      setSelectedRentalId('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout du document',
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès',
      });
      setFileToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression du document',
        variant: 'destructive',
      });
    },
  });

  // Filter documents by category
  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.category === category);
  };

  // Get file icon based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  interface UploadedFile {
    url: string;
    type?: string;
    name: string;
    size: number;
  }

  // Handle file upload completion
  const handleUploadComplete = (res: UploadedFile[]) => {
    if (res && res.length > 0) {
      const uploadedFile = res[0];

      const documentData: DocumentData = {
        url: uploadedFile.url,
        type: uploadedFile.type || 'application/octet-stream',
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        category: activeTab,
        description: uploadDescription || null,
      };

      // Add optional relations based on category
      if (activeTab === 'POLYGRAPHIE' && selectedDiagnosticId) {
        documentData.diagnosticId = selectedDiagnosticId;
      } else if (activeTab === 'VENTE' && selectedSaleId) {
        documentData.saleId = selectedSaleId;
      } else if (activeTab === 'LOCATION' && selectedRentalId) {
        documentData.rentalId = selectedRentalId;
      }

      createDocumentMutation.mutate(documentData);
    }
  };

  // Render upload section for each category
  const renderUploadSection = (category: string) => {
    return (
      <div className="space-y-4">
        {/* Optional relation selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Input
              id="description"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Ajouter une description..."
            />
          </div>

          {category === 'POLYGRAPHIE' && diagnostics.length > 0 && (
            <div>
              <Label htmlFor="diagnostic">Relier au Diagnostic (optionnel)</Label>
              <Select value={selectedDiagnosticId || 'none'} onValueChange={(val) => setSelectedDiagnosticId(val === 'none' ? '' : val)}>
                <SelectTrigger id="diagnostic">
                  <SelectValue placeholder="Sélectionner un diagnostic..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {diagnostics.map((diag) => (
                    <SelectItem key={diag.id} value={diag.id}>
                      {diag.diagnosticCode || 'Sans code'} - {new Date(diag.diagnosticDate).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === 'VENTE' && sales.length > 0 && (
            <div>
              <Label htmlFor="sale">Relier à la Vente (optionnel)</Label>
              <Select value={selectedSaleId || 'none'} onValueChange={(val) => setSelectedSaleId(val === 'none' ? '' : val)}>
                <SelectTrigger id="sale">
                  <SelectValue placeholder="Sélectionner une vente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {sales.map((sale) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.saleCode || 'Sans code'} - {new Date(sale.saleDate).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === 'LOCATION' && rentals.length > 0 && (
            <div>
              <Label htmlFor="rental">Relier à la Location (optionnel)</Label>
              <Select value={selectedRentalId || 'none'} onValueChange={(val) => setSelectedRentalId(val === 'none' ? '' : val)}>
                <SelectTrigger id="rental">
                  <SelectValue placeholder="Sélectionner une location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {rentals.map((rental) => (
                    <SelectItem key={rental.id} value={rental.id}>
                      {rental.rentalCode || 'Sans code'} - {new Date(rental.startDate).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Upload dropzone */}
        <FileUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={(error: Error) => {
            toast({
              title: 'Erreur de téléchargement',
              description: error.message,
              variant: 'destructive',
            });
          }}
          maxFiles={10}
          maxSize={16 * 1024 * 1024}
        />
      </div>
    );
  };

  // Render document list
  const renderDocumentList = (category: string) => {
    const categoryDocuments = getDocumentsByCategory(category);

    if (categoryDocuments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun document dans cette catégorie</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {categoryDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {doc.fileName || 'Document sans nom'}
                    </h4>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.uploadedBy && (
                        <span>Par: {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                      )}
                    </div>
                    {/* Show related record */}
                    {doc.diagnostic && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                        <FileText className="h-3 w-3" />
                        Diagnostic: {doc.diagnostic.diagnosticCode || 'Sans code'}
                      </div>
                    )}
                    {doc.sale && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                        <FileText className="h-3 w-3" />
                        Vente: {doc.sale.saleCode || 'Sans code'}
                      </div>
                    )}
                    {doc.rental && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        <FileText className="h-3 w-3" />
                        Location: {doc.rental.rentalCode || 'Sans code'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(doc.url, '_blank')}
                    title="Ouvrir"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.url;
                      link.download = doc.fileName || 'document';
                      link.click();
                    }}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setFileToDelete(doc.id)}
                    title="Supprimer"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents du Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documents du Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="TITRATION">
                Titration ({getDocumentsByCategory('TITRATION').length})
              </TabsTrigger>
              <TabsTrigger value="POLYGRAPHIE">
                Polygraphie ({getDocumentsByCategory('POLYGRAPHIE').length})
              </TabsTrigger>
              <TabsTrigger value="VENTE">
                Vente ({getDocumentsByCategory('VENTE').length})
              </TabsTrigger>
              <TabsTrigger value="LOCATION">
                Location ({getDocumentsByCategory('LOCATION').length})
              </TabsTrigger>
              <TabsTrigger value="OTHER">
                Autre ({getDocumentsByCategory('OTHER').length})
              </TabsTrigger>
            </TabsList>

            {['TITRATION', 'POLYGRAPHIE', 'VENTE', 'LOCATION', 'OTHER'].map((category) => (
              <TabsContent key={category} value={category} className="space-y-6 mt-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Ajouter des fichiers</h3>
                  {renderUploadSection(category)}
                </div>

                {/* Document List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fichiers existants</h3>
                  {renderDocumentList(category)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (fileToDelete) {
                  deleteDocumentMutation.mutate(fileToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
