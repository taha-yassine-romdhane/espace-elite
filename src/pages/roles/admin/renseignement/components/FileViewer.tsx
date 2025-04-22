import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File, FileText } from "lucide-react";

interface FileViewerProps {
  files: Array<string | { url: string; name?: string; type?: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ files, isOpen, onClose }: FileViewerProps) {
  if (!isOpen) return null;

  // Helper function to determine if a file is an image type
  const isImageFile = (file: string | { url: string; name?: string; type?: string }): boolean => {
    const fileUrl = typeof file === 'string' ? file : file.url;
    
    // First check by file extension if available
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl)) {
      return true;
    }
    
    // Check by MIME type if available for object-type files
    if (typeof file !== 'string' && file.type && file.type.startsWith('image/')) {
      return true;
    }
    
    // Special handling for UploadThing URLs
    // Example: https://1q2z9d946v.ufs.sh/f/Df43Y0C0ioj8z83FcUdg2jRxTuZ3O8SqtDEPakiedmLXKo4f
    if (fileUrl.includes('.ufs.sh/f/')) {
      if (typeof file !== 'string') {
        // If we have a file object with name, check name extension
        if (file.name && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name)) {
          return true;
        }
        
        // For UploadThing, if the type isn't specified, we'll try to display as image
        // as most uploads are likely images
        return !file.type || file.type.startsWith('image/') || file.type === 'IMAGE';
      }
      
      // For plain string URLs with UploadThing domain, try to display as image
      return true; 
    }
    
    return false;
  };

  // Helper function to get file URL from either string or object
  const getFileUrl = (file: string | { url: string; name?: string; type?: string }): string => {
    return typeof file === 'string' ? file : file.url;
  };

  // Helper function to get file name from either string or object
  const getFileName = (file: string | { url: string; name?: string; type?: string }): string => {
    if (typeof file === 'string') {
      const urlParts = file.split('/');
      return urlParts[urlParts.length - 1] || 'Fichier';
    }
    
    if (file.name) return file.name;
    
    const urlParts = file.url.split('/');
    return urlParts[urlParts.length - 1] || 'Fichier';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fichiers attachés</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {files.map((file, index) => {
            const fileUrl = getFileUrl(file);
            const fileName = getFileName(file);
            const isImage = isImageFile(file); // Pass the entire file object/string
            
            return (
              <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                <a 
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 h-full hover:bg-gray-50 transition-colors"
                >
                  {isImage ? (
                    <div className="w-full aspect-square bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      <img 
                        src={fileUrl} 
                        alt={fileName}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          console.log(`Failed to load image: ${fileUrl}`);
                          const target = e.target as HTMLImageElement;
                          
                          // First try showing as a document if image fails to load
                          target.style.display = 'none';
                          
                          // Add a document icon as fallback
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'flex flex-col items-center justify-center';
                            fallback.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-gray-50 rounded-md mb-2 flex items-center justify-center">
                      <FileText className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="w-full text-center">
                    <p className="text-xs text-gray-600 break-all max-w-full truncate" title={fileName}>
                      {fileName}
                    </p>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
        
        {files.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">Aucun fichier attaché</p>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}