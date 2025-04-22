import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { FileUp, File, Download, Trash2, AlertCircle, FileText, Image, FileArchive } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DiagnosticDocumentsProps {
  documents: any[];
  diagnosticId: string;
}

export function DiagnosticDocuments({ documents, diagnosticId }: DiagnosticDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP à HH:mm", { locale: fr });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-purple-600" />;
    } else if (mimeType.startsWith('application/pdf')) {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar')) {
      return <FileArchive className="h-6 w-6 text-yellow-600" />;
    } else {
      return <File className="h-6 w-6 text-blue-600" />;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      toast({
        title: "Document téléchargé",
        description: "Le document a été téléchargé avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors du téléchargement du document.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression du document.",
        variant: "destructive",
      });
    },
  });

  // Handle document upload
  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    
    uploadDocumentMutation.mutate(formData);
  };

  // Handle document deletion
  const handleDelete = (documentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Documents
        </CardTitle>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <FileUp className="h-4 w-4 mr-1" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Télécharger un document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-48 mx-auto object-contain" 
                    />
                    <div className="text-sm text-gray-600">
                      {selectedFile?.name} ({formatFileSize(selectedFile?.size || 0)})
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    {getFileIcon(selectedFile.type)}
                    <div className="text-sm text-gray-600">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileUp className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      Glissez-déposez un fichier ici ou cliquez pour parcourir
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={!selectedFile || uploadDocumentMutation.isPending}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadDocumentMutation.isPending}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {uploadDocumentMutation.isPending ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                      Téléchargement...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <FileUp className="h-4 w-4 mr-1" />
                      Télécharger
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-6">
        {!documents || documents.length === 0 ? (
          <div className="text-gray-500 italic">Aucun document associé à ce diagnostic</div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.mimeType || 'application/octet-stream')}
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.filename}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(doc.size || 0)}</span>
                      <span>•</span>
                      <span>Ajouté le {formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => window.open(`/api/diagnostics/${diagnosticId}/documents/${doc.id}/download`, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
