import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  key: string;
}

interface FileUploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 16 * 1024 * 1024, // 16MB default
  accept,
  className,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('file', file);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du téléchargement');
      }

      const data = await response.json();

      if (data.success && data.files) {
        onUploadComplete?.(data.files);
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error : new Error('Erreur inconnue'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Check max files
      if (acceptedFiles.length > maxFiles) {
        onUploadError?.(
          new Error(`Vous ne pouvez télécharger que ${maxFiles} fichier(s) à la fois`)
        );
        return;
      }

      // Check file sizes
      const oversizedFiles = acceptedFiles.filter((file) => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        onUploadError?.(
          new Error(
            `Certains fichiers dépassent la taille maximale de ${Math.round(maxSize / (1024 * 1024))}MB`
          )
        );
        return;
      }

      setSelectedFiles(acceptedFiles);
      uploadFiles(acceptedFiles);
    },
    [maxFiles, maxSize, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && 'border-gray-300 hover:border-primary/50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-500 mt-2">{uploadProgress}% téléchargé</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <p className="font-medium">Déposez les fichiers ici...</p>
                ) : (
                  <>
                    <p className="font-medium">
                      Glissez-déposez vos fichiers ici, ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum {maxFiles} fichier(s) · Taille max {Math.round(maxSize / (1024 * 1024))}MB
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && !uploading && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
