import React, { useEffect, useState } from 'react';
import { User } from '@prisma/client'; // Assuming User type is available from Prisma
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'; // Assuming you use Shadcn UI
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Assuming you use Shadcn UI
import { Briefcase, CalendarDays, CheckCircle, Mail, MapPin, Phone, UserCircle } from 'lucide-react';
interface ProfileData extends Omit<User, 'password' | 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

const AdminProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile/me');
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U'; // Default User
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading profile...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              {/* <AvatarImage src={profile.imageUrl || undefined} alt={`${profile.firstName} ${profile.lastName}`} /> */}
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(profile.firstName, profile.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">{profile.firstName} {profile.lastName}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-sm">{profile.email}</span>
              </div>
              {profile.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">{profile.telephone}</span>
                </div>
              )}
            </div>
            {profile.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="text-sm">{profile.address}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.speciality && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">Speciality: {profile.speciality}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5 text-gray-500" />
                <span className="text-sm">Role: {profile.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`h-5 w-5 ${profile.isActive ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm">Status: {profile.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Timestamps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                <span className="text-sm">Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                <span className="text-sm">Last Updated: {new Date(profile.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Add more sections as needed, e.g., for recent activity, settings, etc. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfilePage;
