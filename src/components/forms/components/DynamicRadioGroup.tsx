import React from 'react';
import { UseFormReturn } from 'react-hook-form';

interface RadioOption {
  value: string;
  label: string;
}

interface DynamicRadioGroupProps {
  name: string;
  label: string;
  form: UseFormReturn<any>;
  options: RadioOption[];
  inline?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export default function DynamicRadioGroup({
  name,
  label,
  form,
  options,
  inline = true,
  onChange,
  className,
}: DynamicRadioGroupProps) {
  const handleChange = (value: string) => {
    form.setValue(name, value);
    
    if (onChange) {
      onChange(value);
    }
  };
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className={`${inline ? 'flex space-x-4' : 'space-y-2'} mt-1`}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={form.watch(name) === option.value}
              onChange={() => handleChange(option.value)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
