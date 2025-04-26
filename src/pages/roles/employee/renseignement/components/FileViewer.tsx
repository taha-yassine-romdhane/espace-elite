import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import Image from 'next/image';

interface FileViewerProps {
  files: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ files, isOpen, onClose }: FileViewerProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Fichiers attachés</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {files.map((file, index) => (
            <div key={index} className="relative aspect-square">
              {file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="relative w-full h-full">
                  <Image
                    src={file}
                    alt={`File ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <a 
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors p-4"
                >
                  <File className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-600 text-center break-all">
                    {file.split('/').pop()}
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FileViewer;
