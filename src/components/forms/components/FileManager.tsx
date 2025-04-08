import React from 'react';
import { X } from 'lucide-react';
import { FileUpload } from "@/components/ui/file-upload";
import { UseFormReturn } from 'react-hook-form';

interface ExistingFile {
  url: string;
  type: string;
}

interface FileManagerProps {
  form: UseFormReturn<any>;
  files: File[];
  existingFiles?: ExistingFile[];
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  onFileChange: (files: File[]) => void;
  onRemoveExistingFile: (fileUrl: string) => void;
  className?: string;
}

export default function FileManager({
  form,
  files,
  existingFiles = [],
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  accept = "image/jpeg,image/png,image/gif,application/pdf",
  onFileChange,
  onRemoveExistingFile,
  className,
}: FileManagerProps) {
  const handleFileChange = (uploadedFiles: File[]) => {
    console.log('Files selected:', uploadedFiles);
    onFileChange(uploadedFiles);
    
    // Ensure form values are preserved after file upload
    const currentFormValues = form.getValues();
    setTimeout(() => {
      Object.keys(currentFormValues).forEach(key => {
        if (key !== 'files' && key !== 'images') {
          form.setValue(key as any, currentFormValues[key as keyof typeof currentFormValues]);
        }
      });
    }, 0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Documents
      </label>

      {/* Display existing files */}
      {existingFiles && existingFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {existingFiles.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={file.url}
                alt={`Document ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemoveExistingFile(file.url)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Upload component */}
      <FileUpload
        value={files}
        onChange={handleFileChange}
        maxFiles={maxFiles}
        maxSize={maxSize}
        accept={accept}
        multiple={true}
      />
    </div>
  );
}
