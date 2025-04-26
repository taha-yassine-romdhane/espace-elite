import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormSection from '../components/FormSection';

interface AdditionalInfoBlockProps {
  // eslint-disable-next-line no-unused-vars
  form: UseFormReturn<any>;
  // eslint-disable-next-line no-unused-vars
  onInputChange: (e: any) => void;
}

export default function AdditionalInfoBlock({ form, onInputChange }: AdditionalInfoBlockProps) {
  return (
    <FormSection title="Notes additionnelles" defaultOpen={true}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Description Generale</label>
          <textarea
            name="descriptionNom"
            value={form.watch('descriptionNom') || ''}
            onChange={(e) => {
              form.setValue('descriptionNom', e.target.value);
              onInputChange(e);
            }}
            placeholder="Description supplémentaire du nom"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description Téléphone</label>
          <textarea
            name="descriptionTelephone"
            value={form.watch('descriptionTelephone') || ''}
            onChange={(e) => {
              form.setValue('descriptionTelephone', e.target.value);
              onInputChange(e);
            }}
            placeholder="Description supplémentaire du téléphone"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>
    </FormSection>
  );
}
