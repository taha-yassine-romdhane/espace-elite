import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import SearchSelect from '../components/SearchSelect';
import FormSection from '../components/FormSection';
import UserForm from '../UserForm';
import { Role } from '@prisma/client';
import { Plus, X } from 'lucide-react';
import { Doctor } from '@/types/models/Doctor';
import { Technician } from '@/types/models/Technician';

interface ResponsiblePersonBlockProps {
  // eslint-disable-next-line no-unused-vars
  form: UseFormReturn<any>;
  doctors: Doctor[];
  technicians: Technician[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function ResponsiblePersonBlock({ 
  form, 
  doctors, 
  technicians, 
  onInputChange 
}: ResponsiblePersonBlockProps) {
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showTechnicianForm, setShowTechnicianForm] = useState(false);
  
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    telephone: '',
    role: 'DOCTOR' as Role,
    isActive: true
  });
  
  const handleAddDoctor = () => {
    setUserFormData({
      ...userFormData,
      role: 'DOCTOR' as Role
    });
    setShowDoctorForm(true);
  };
  
  const handleAddTechnician = () => {
    setUserFormData({
      ...userFormData,
      role: 'EMPLOYEE' as Role
    });
    setShowTechnicianForm(true);
  };
  
  const handleCloseForm = () => {
    setShowDoctorForm(false);
    setShowTechnicianForm(false);
  };
  
  const handleUserFormChange = (name: string, value: string | boolean) => {
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUserFormSubmit = () => {
    // Here you would typically submit the user data to your API
    console.log('Submitting user data:', userFormData);
    
    // After successful submission, close the form
    handleCloseForm();
    
    // Reset the form data
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      telephone: '',
      role: 'DOCTOR' as Role,
      isActive: true
    });
  };
  
  return (
    <FormSection title="Responsables" defaultOpen={true}>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-grow">
            <SearchSelect
              name="medecin"
              label="Médecin"
              form={form}
              options={doctors.map(d => ({ id: d.id, name: d.user ? `${d.user.firstName || ''} ${d.user.lastName || ''}` : 'Unknown Doctor' }))}
              emptyOptionLabel="Sélectionnez un médecin"
              onParentChange={onInputChange}
            />
          </div>
          <div className="flex items-center h-[38px] mt-6">
            <button
              type="button"
              onClick={handleAddDoctor}
              className="w-10 h-10 bg-white border rounded-md hover:bg-blue-600 hover:text-white focus:outline-none flex items-center justify-center"
              title="Ajouter un médecin"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-grow">
            <SearchSelect
              name="technicienResponsable"
              label="Technicien Responsable"
              form={form}
              options={technicians.map(t => ({ id: t.id, name: t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}` : 'Unknown Technician' }))}
              emptyOptionLabel="Sélectionnez un technicien"
              onParentChange={onInputChange}
            />
          </div>
          <div className="flex items-center h-[38px] mt-6">
            <button
              type="button"
              onClick={handleAddTechnician}
              className="w-10 h-10 bg-white border rounded-md hover:bg-blue-600 hover:text-white focus:outline-none flex items-center justify-center"
              title="Ajouter un technicien"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {showDoctorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un médecin</h2>
              <button 
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <UserForm 
              formData={userFormData}
              onChange={handleUserFormChange}
              onSubmit={handleUserFormSubmit}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
      
      {showTechnicianForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un technicien</h2>
              <button 
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <UserForm 
              formData={userFormData}
              onChange={handleUserFormChange}
              onSubmit={handleUserFormSubmit}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </FormSection>
  );
}