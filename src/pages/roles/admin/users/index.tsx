import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserForm from '@/components/forms/UserForm';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Card } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  address?: string;
  speciality?: string;
}

type Role = 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'EMPLOYEE';

const UsersPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleEdit = (user: User) => {
    // Split the name into firstName and lastName
    const [firstName = '', ...lastNameParts] = user.name.split(' ');
    const lastName = lastNameParts.join(' ');

    setFormData({
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      password: '', // Don't set password when editing
      telephone: user.telephone,
      role: user.role as Role,
      isActive: user.isActive,
      address: user.address || '',
      speciality: user.speciality || '',
    });
    setIsEditMode(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

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
          // Only include password in the request if it's provided
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

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) || 
      user.role.toLowerCase().includes(query) ||
      user.telephone.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const fetchUsers = async () => {
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Utilisateurs</h1>
          <Button 
            variant="default" 
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher par nom, email, rôle ou téléphone..."
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card className="overflow-hidden border-blue-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead className="text-blue-900">Nom</TableHead>
                  <TableHead className="text-blue-900">Email</TableHead>
                  <TableHead className="text-blue-900">Téléphone</TableHead>
                  <TableHead className="text-blue-900">Rôle</TableHead>
                  <TableHead className="text-blue-900">Statut</TableHead>
                  <TableHead className="text-blue-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Chargement des utilisateurs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      {searchQuery ? (
                        <p className="text-gray-500">Aucun utilisateur ne correspond à votre recherche</p>
                      ) : (
                        <p className="text-gray-500">Aucun utilisateur disponible</p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-blue-50/50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.telephone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? "default" : "secondary"}
                          className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                        >
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-blue-900 mb-4"
                  >
                    {isEditMode ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                  </Dialog.Title>
                  <UserForm
                    formData={formData}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isEditMode={isEditMode}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default UsersPage;