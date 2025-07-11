import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from '@/components/forms/UserForm';
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Role as PrismaRole } from '@prisma/client';
import { columns } from './components/columns';
import { UsersTable } from './components/UsersTable';

export interface User {
  id: string;
  name: string;
  email: string;
  role: PrismaRole;
  telephone?: string | null;
  address?: string | null;
  speciality?: string | null;
  isActive: boolean;
}

type Role = 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'EMPLOYEE';

const UsersPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [userRelations, setUserRelations] = useState<Record<string, number> | null>(null);
  const [hasRelations, setHasRelations] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    telephone: '',
    role: '' as Role,
    isActive: true,
    address: '',
    speciality: '',
  });

  const resetForm = () => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      telephone: '',
      role: '' as Role,
      isActive: true,
      address: '',
      speciality: '',
    });
    setIsEditMode(false);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = useCallback((user: User) => {
    const [firstName = '', ...lastNameParts] = user.name.split(' ');
    const lastName = lastNameParts.join(' ');

    setFormData({
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      password: '',
      telephone: user.telephone || '',
      role: user.role as Role,
      isActive: user.isActive,
      address: user.address || '',
      speciality: user.speciality || '',
    });
    setIsEditMode(true);
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeleteUserId(id);
    try {
      const response = await fetch(`/api/users/${id}/relations`);
      if (!response.ok) {
        throw new Error('Failed to fetch user relations');
      }
      const data = await response.json();
      setUserRelations(data.relations);
      setHasRelations(data.hasRelations);
      setIsDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error checking user relations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les relations de l'utilisateur.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const confirmAction = useCallback(async (action: 'soft-delete' | 'hard-delete') => {
    if (!deleteUserId) return;

    if (action === 'soft-delete') {
      try {
        const userToUpdate = users.find(user => user.id === deleteUserId);
        if (!userToUpdate) throw new Error("User not found");

        const nameParts = userToUpdate.name.split(' ');
        const updatedUserPayload = {
          ...userToUpdate,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          isActive: false,
        };
        delete (updatedUserPayload as any).name;

        const response = await fetch(`/api/users`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUserPayload),
        });

        if (!response.ok) throw new Error((await response.json()).error || 'Failed to deactivate user');

        toast({ title: "Succès", description: "Utilisateur désactivé avec succès" });
        fetchUsers();
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deactivating user:', error);
        toast({ title: "Erreur", description: error instanceof Error ? error.message : "Échec de la désactivation", variant: "destructive" });
      }
    } else if (action === 'hard-delete') {
      try {
        const response = await fetch(`/api/users?id=${deleteUserId}`, { method: 'DELETE' });

        if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete user');

        toast({ title: "Succès", description: "Utilisateur supprimé définitivement" });
        fetchUsers();
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting user permanently:', error);
        toast({ title: "Erreur", description: error instanceof Error ? error.message : "Échec de la suppression définitive", variant: "destructive" });
      }
    }
  }, [deleteUserId, users, toast, fetchUsers]);

  const cancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeleteUserId(null);
    setUserRelations(null);
    setHasRelations(false);
  }, []);

  const userColumns = useMemo(() => columns(handleEdit, handleDelete), [handleEdit, handleDelete]);

  const handleSubmit = async () => {
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch('/api/users', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          password: formData.password || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      }

      toast({
        title: "Success",
        description: `User ${isEditMode ? 'updated' : 'created'} successfully`,
      });

      setIsOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} user`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900">Utilisateurs</h1>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" disabled>
              <UserPlus className="w-5 h-5 mr-2" />
              Ajouter un utilisateur
            </Button>
          </div>
          <Card className="p-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-blue-600">Chargement...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Gestion des utilisateurs</h1>
          <Button onClick={() => {
            resetForm();
            setIsOpen(true);
          }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>

        <UsersTable columns={userColumns} data={users} />

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
            </DialogHeader>
            <UserForm
              formData={formData}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEditMode={isEditMode}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {hasRelations ? 'Action Requise' : 'Confirmation de Suppression'}
              </DialogTitle>
              <DialogDescription>
                {hasRelations ? (
                  <div className="space-y-4">
                    <p className="text-red-600 font-semibold">Cet utilisateur est lié à des données importantes et ne peut pas être supprimé directement :</p>
                    <ul className="list-disc list-inside bg-gray-100 p-3 rounded-md">
                      {userRelations && Object.entries(userRelations).map(([key, value]) => (
                        <li key={key}>{`${key}: ${value}`}</li>
                      ))}
                    </ul>
                    <p>La suppression permanente entraînera la perte de ces données. Nous vous recommandons de désactiver l'utilisateur à la place.</p>
                  </div>
                ) : (
                  'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.'
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={cancelDelete}>Annuler</Button>
              {hasRelations ? (
                <>
                  <Button variant="destructive" onClick={() => confirmAction('hard-delete')}>Supprimer quand même</Button>
                  <Button onClick={() => confirmAction('soft-delete')}>Désactiver (Recommandé)</Button>
                </>
              ) : (
                <Button variant="destructive" onClick={() => confirmAction('hard-delete')}>Supprimer Définitivement</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersPage;