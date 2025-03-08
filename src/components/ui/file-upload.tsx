import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Progress } from './progress';
import { useToast } from './use-toast';
import Image from 'next/image';
import { X, Upload, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  multiple?: boolean;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  error?: string;
  uploaded?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  onRemove,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  multiple = false,
  className,
}: FileUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPreview[]>(Array.isArray(value) ? value as FileWithPreview[] : []);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      file.errors.forEach((error: any) => {
        let message = 'Error uploading file';
        if (error.code === 'file-too-large') {
          message = `File is too large. Max size is ${maxSize / (1024 * 1024)}MB`;
        } else if (error.code === 'file-invalid-type') {
          message = 'Invalid file type';
        }
        toast({
          title: 'Upload Error',
          description: message,
          variant: 'destructive',
        });
      });
    });

    // Process accepted files
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        uploadProgress: 0,
      })
    );

    // Check if adding new files would exceed maxFiles
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: 'Upload Error',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onChange?.(updatedFiles);

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      simulateUpload(file, files.length + index);
    });
  }, [files, maxFiles, onChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple,
  });

  const simulateUpload = (file: FileWithPreview, index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles(prev => prev.map((f, i) => {
        if (files.length + index === i) {
          return { ...f, uploadProgress: progress };
        }
        return f;
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setFiles(prev => prev.map((f, i) => {
          if (files.length + index === i) {
            return { ...f, uploaded: true };
          }
          return f;
        }));
      }
    }, 100);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
    onRemove?.(index);
  };

  const isImageFile = (file: File) => {
    return file && file.type ? file.type.toLowerCase().startsWith('image/') : false;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300",
          "cursor-pointer hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-sm">
            <span className="font-semibold text-primary">Cliquez pour télécharger</span> ou faites
            glisser et déposez
          </div>
          <p className="text-xs text-gray-500">
            {accept} (Max {maxSize / (1024 * 1024)}MB)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group rounded-lg border border-gray-200 p-2 hover:border-primary"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                {isImageFile(file) ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={file.preview || ''}
                      alt={file.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100">
                    <File className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="mt-2">
                <p className="text-xs truncate" title={file.name}>
                  {file.name}
                </p>
                {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                  <Progress value={file.uploadProgress} className="h-1 mt-2" />
                )}
              </div>

              <div className="absolute -top-2 -right-2">
                {file.uploaded ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : file.error ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : null}
              </div>

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
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
