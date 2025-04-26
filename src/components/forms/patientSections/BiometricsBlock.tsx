import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import UnitInput from '../components/UnitInput';
import FormSection from '../components/FormSection';

interface BiometricsBlockProps {
  // eslint-disable-next-line no-unused-vars
  form: UseFormReturn<any>;
  // eslint-disable-next-line no-unused-vars
  onInputChange: (e: any) => void;
}

export default function BiometricsBlock({ form, onInputChange }: BiometricsBlockProps) {
  // Calculate BMI when both height and weight are available
  const calculateIMC = () => {
    const taille = form.watch('taille');
    const poids = form.watch('poids');
    
    if (typeof taille === 'string' && typeof poids === 'string' && taille && poids) {
      return (parseFloat(poids) / Math.pow(parseFloat(taille) / 100, 2)).toFixed(1);
    }
    return '0';
  };

  return (
    <FormSection title="Biométrie" defaultOpen={true}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <UnitInput
            name="taille"
            label="Taille"
            form={form}
            unit="cm"
            min={0}
            max={250}
            step="1"
            placeholder="Taille en cm"
            onParentChange={onInputChange}
          />

          <UnitInput
            name="poids"
            label="Poids"
            form={form}
            unit="kg"
            min={0}
            max={500}
            step="0.1"
            placeholder="Poids en kg"
            onParentChange={onInputChange}
          />

          {/* IMC Calculation */}
          {form.watch('taille') && form.watch('poids') && (
            <div className="col-span-2">
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <label className="text-sm font-medium text-gray-700">IMC</label>
                <div className="mt-1 text-lg font-semibold">
                  {calculateIMC()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}
