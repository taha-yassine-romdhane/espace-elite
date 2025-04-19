import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Card, CardContent } from "@/components/ui/Card";
import { Users, Box, Bell, ShoppingCart, Cog, Clipboard, SquareActivity } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Debug session information
  useEffect(() => {
    console.log('Admin Dashboard - Auth Status:', status);
    console.log('Admin Dashboard - Session:', session);
  }, [status, session]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const quickLinks = [
    { icon: <Users size={24} />, title: 'Utilisateurs', description: 'Gérer les utilisateurs', bgColor: 'bg-blue-500', path: '/roles/admin/users' },
    { icon: <Box size={24} />, title: 'Stock', description: 'Gérer les stocks', bgColor: 'bg-green-500', path: '/roles/admin/stock' },
    { icon: <ShoppingCart size={24} />, title: 'Produits', description: 'Gérer les produits', bgColor: 'bg-purple-500', path: '/roles/admin/appareils' },
    { icon: <Bell size={24} />, title: 'Notifications', description: 'Gérer les notifications', bgColor: 'bg-yellow-500', path: '/roles/admin/notifications' },
    { icon: <Cog size={24} />, title: 'Paramètres', description: 'Configurer le système', bgColor: 'bg-red-500', path: '/roles/admin/settings' },
    { icon: <Clipboard size={24} />, title: 'Tâches', description: 'Gérer les tâches', bgColor: 'bg-blue-500', path: '/roles/admin/tasks' },
    { icon: <Users size={24} />, title: 'Reparateurs', description: 'Gérer les reparateurs', bgColor: 'bg-blue-500', path: '/roles/admin/reparateur' },
    { icon: <Users size={24} />, title: 'Renseignements', description: 'Gérer les Renseignements', bgColor: 'bg-blue-500', path: '/roles/admin/renseignement' },
    { icon: <SquareActivity size={24} />, title: 'Diagnostics', description: 'Gérer les Diagnostics', bgColor: 'bg-blue-500', path: '/roles/admin/diagnostic' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
          <p className="text-gray-500">Bienvenue, {session?.user?.name || 'Administrateur'}</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          ADMIN
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {quickLinks.map((link, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => router.push(link.path)}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-full ${link.bgColor} text-white flex items-center justify-center mb-4`}>
                {link.icon}
              </div>
              <h3 className="font-medium text-gray-900">{link.title}</h3>
              <p className="text-sm text-gray-500">{link.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Define a getLayout function to use the AdminLayout
AdminDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};
