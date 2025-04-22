import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BeneficiaryType } from '@prisma/client';
import DynamicRadioGroup from '../components/DynamicRadioGroup';
import SmartInput from '../components/SmartInput';
import FormSection from '../components/FormSection';

type CaisseAffiliation = 'CNSS' | 'CNRPS';

interface InsuranceDetailsBlockProps {
  form: UseFormReturn<any>;
  onInputChange: (e: any) => void;
}

export default function InsuranceDetailsBlock({ form, onInputChange }: InsuranceDetailsBlockProps) {
  const handleCnamChange = (value: boolean) => {
    form.setValue('cnam', value);
    onInputChange({
      target: {
        name: 'cnam',
        value: value
      }
    });
  };

  const handleCaisseAffiliationChange = (value: CaisseAffiliation) => {
    form.setValue('caisseAffiliation', value);
    onInputChange({
      target: {
        name: 'caisseAffiliation',
        value: value
      }
    });
  };

  const handleBeneficiaireChange = (value: BeneficiaryType) => {
    form.setValue('beneficiaire', value);
    onInputChange({
      target: {
        name: 'beneficiaire',
        value: value
      }
    });
  };

  return (
    <FormSection title="Assurance" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">CNAM</label>
          <div className="space-y-1">
            <label className="flex items-center">
              <input
                type="radio"
                name="cnam"
                checked={form.watch('cnam') === true}
                onChange={() => handleCnamChange(true)}
                className="mr-2"
              />
              <span>Oui</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="cnam"
                checked={form.watch('cnam') === false}
                onChange={() => handleCnamChange(false)}
                className="mr-2"
              />
              <span>Non</span>
            </label>
          </div>
          {form.watch('cnam') && (
            <div className="mt-2">
              <SmartInput
                name="identifiantCNAM"
                label=""
                form={form}
                placeholder="Identifiant CNAM"
                pattern={{ value: /[^0-9A-Z]/g, replace: '', maxLength: 12 }}
                onParentChange={onInputChange}
                maxLength={12}
              />
            </div>
          )}
        </div>

        <DynamicRadioGroup
          name="caisseAffiliation"
          label="Caisse d'affiliation"
          form={form}
          options={[
            { value: 'CNSS', label: 'CNSS' },
            { value: 'CNRPS', label: 'CNRPS' }
          ]}
          onChange={(value) => handleCaisseAffiliationChange(value as CaisseAffiliation)}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bénéficiaire
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="beneficiaire"
                value={BeneficiaryType.ASSURE_SOCIAL}
                checked={form.watch('beneficiaire') === BeneficiaryType.ASSURE_SOCIAL}
                onChange={() => handleBeneficiaireChange(BeneficiaryType.ASSURE_SOCIAL)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Assure Social</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="beneficiaire"
                value={BeneficiaryType.CONJOINT}
                checked={form.watch('beneficiaire') === BeneficiaryType.CONJOINT}
                onChange={() => handleBeneficiaireChange(BeneficiaryType.CONJOINT)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Conjoint</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="beneficiaire"
                value={BeneficiaryType.ENFANT}
                checked={form.watch('beneficiaire') === BeneficiaryType.ENFANT}
                onChange={() => handleBeneficiaireChange(BeneficiaryType.ENFANT)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Enfant</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="beneficiaire"
                value={BeneficiaryType.ASSANDANT}
                checked={form.watch('beneficiaire') === BeneficiaryType.ASSANDANT}
                onChange={() => handleBeneficiaireChange(BeneficiaryType.ASSANDANT)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Ascendant</span>
            </label>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
