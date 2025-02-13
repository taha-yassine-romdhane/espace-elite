import React from 'react';
import { Button } from "@/components/ui/button";
import { Role } from '@prisma/client';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UserFormProps {
  formData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    telephone?: string;
    role: Role;
    isActive: boolean;
  };
  isEditMode?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  formData,
  isEditMode = false,
  onInputChange,
  onSubmit,
  onCancel
}) => {
  const handleSwitchChange = (checked: boolean) => {
    onInputChange({
      target: { name: 'isActive', value: checked }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold mb-4">
        {isEditMode ? 'Modifier Utilisateur' : 'Ajout d\'un Utilisateur'}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prénom</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            placeholder="Prénom"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            placeholder="Nom"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="email@example.com"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onInputChange}
            placeholder="••••••••"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required={!isEditMode}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={onInputChange}
            placeholder="+216 XX XXX XXX"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={onInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          >
            <option value="">Sélectionner un role</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="DOCTOR">Docteur</option>
            <option value="EMPLOYEE">Employé</option>
          </select>
        </div>

        {isEditMode && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label>Compte actif</Label>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="default" onClick={onSubmit}>
          {isEditMode ? 'Mettre à jour' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
};

export default UserForm;
