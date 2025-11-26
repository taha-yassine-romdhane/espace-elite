import React, { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, User, Stethoscope } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  speciality?: string;
}

interface DoctorSelectDialogProps {
  name: string;
  label: string;
  form: UseFormReturn<any>;
  doctors: Doctor[];
  emptyOptionLabel?: string;
  onParentChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
}

const ITEMS_PER_PAGE = 10;

export default function DoctorSelectDialog({
  name,
  label,
  form,
  doctors,
  emptyOptionLabel = 'Sélectionnez un médecin',
  onParentChange,
  required = false,
  className,
}: DoctorSelectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get current selected doctor
  const selectedDoctorId = form.watch(name);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Filter doctors based on search query
  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(searchLower) ||
      (doctor.speciality && doctor.speciality.toLowerCase().includes(searchLower))
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [isOpen]);

  const handleSelectDoctor = useCallback((doctor: Doctor) => {
    form.setValue(name, doctor.id);

    // Create a synthetic event to notify parent
    if (onParentChange) {
      const syntheticEvent = {
        target: {
          name,
          value: doctor.id,
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      onParentChange(syntheticEvent);
    }

    setIsOpen(false);
  }, [form, name, onParentChange]);

  const handleClearSelection = useCallback(() => {
    form.setValue(name, '');

    if (onParentChange) {
      const syntheticEvent = {
        target: {
          name,
          value: '',
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      onParentChange(syntheticEvent);
    }
  }, [form, name, onParentChange]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="mt-1 flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              {selectedDoctor ? (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  {selectedDoctor.name}
                  {selectedDoctor.speciality && (
                    <span className="text-gray-400 text-xs">({selectedDoctor.speciality})</span>
                  )}
                </span>
              ) : (
                <span className="text-gray-500">{emptyOptionLabel}</span>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Sélectionner un médecin
              </DialogTitle>
            </DialogHeader>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
              {filteredDoctors.length} médecin(s) trouvé(s)
            </div>

            {/* Doctor List */}
            <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
              {paginatedDoctors.length > 0 ? (
                <div className="divide-y">
                  {paginatedDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doctor)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedDoctorId === doctor.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          {doctor.speciality && (
                            <div className="text-sm text-gray-500">{doctor.speciality}</div>
                          )}
                        </div>
                      </div>
                      {selectedDoctorId === doctor.id && (
                        <span className="text-blue-600 text-sm font-medium">Sélectionné</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                  <Search className="h-12 w-12 mb-2 text-gray-300" />
                  <p>Aucun médecin trouvé</p>
                  <p className="text-sm">Essayez avec un autre terme de recherche</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Clear button - only show when a doctor is selected */}
        {selectedDoctor && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClearSelection}
            className="shrink-0"
            title="Effacer la sélection"
          >
            <span className="text-gray-500">&times;</span>
          </Button>
        )}
      </div>

      {form.formState.errors[name] && (
        <span className="text-sm text-red-500">
          {form.formState.errors[name]?.message as string}
        </span>
      )}
    </div>
  );
}
