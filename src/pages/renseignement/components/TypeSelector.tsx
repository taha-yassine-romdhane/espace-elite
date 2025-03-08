import React from 'react';
import { Button } from "@/components/ui/button";

interface TypeSelectorProps {
  selectedType: 'Patient' | 'Société';
  onTypeChange: (type: 'Patient' | 'Société') => void;
}

export function TypeSelector({ selectedType, onTypeChange }: TypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Type de Renseignement</h2>
      <div className="flex space-x-4">
        <Button
          variant={selectedType === 'Patient' ? 'default' : 'outline'}
          onClick={() => onTypeChange('Patient')}
        >
          Patient
        </Button>
        <Button
          variant={selectedType === 'Société' ? 'default' : 'outline'}
          onClick={() => onTypeChange('Société')}
        >
          Société
        </Button>
      </div>
    </div>
  );
}
