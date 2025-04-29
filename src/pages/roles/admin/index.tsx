import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Users, Box, Bell, ShoppingCart, Cog, Clipboard, SquareActivity, Home } from 'lucide-react';

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
    { icon: <Users size={32} />, title: 'Utilisateurs', description: 'Gérer les utilisateurs', bgColor: 'bg-blue-600', path: '/roles/admin/users' },
    { icon: <Box size={32} />, title: 'Stock', description: 'Gérer les stocks', bgColor: 'bg-blue-500', path: '/roles/admin/stock' },
    { icon: <ShoppingCart size={32} />, title: 'Produits', description: 'Gérer les produits', bgColor: 'bg-blue-400', path: '/roles/admin/appareils' },
    { icon: <Bell size={32} />, title: 'Notifications', description: 'Gérer les notifications', bgColor: 'bg-blue-300', path: '/roles/admin/notifications' },
    { icon: <Cog size={32} />, title: 'Paramètres', description: 'Configurer le système', bgColor: 'bg-blue-700', path: '/roles/admin/settings' },
    { icon: <Clipboard size={32} />, title: 'Tâches', description: 'Gérer les tâches', bgColor: 'bg-blue-800', path: '/roles/admin/tasks' },
    { icon: <Users size={32} />, title: 'Reparateurs', description: 'Gérer les réparateurs', bgColor: 'bg-blue-500', path: '/roles/admin/reparateur' },
    { icon: <Users size={32} />, title: 'Renseignements', description: 'Gérer les renseignements', bgColor: 'bg-blue-600', path: '/roles/admin/renseignement' },
    { icon: <SquareActivity size={32} />, title: 'Diagnostics', description: 'Gérer les diagnostics', bgColor: 'bg-blue-400', path: '/roles/admin/diagnostic' },
  ];

// Purpose descriptions for each button
function getPurposeDescription(title: string) {
  switch (title) {
    case 'Utilisateurs':
      return "Ajouter, modifier ou supprimer des comptes utilisateurs.";
    case 'Stock':
      return "Suivre et gérer les stocks de produits et appareils.";
    case 'Produits':
      return "Consulter, ajouter ou éditer les produits disponibles.";
    case 'Notifications':
      return "Recevoir et gérer les alertes du système.";
    case 'Paramètres':
      return "Configurer les paramètres généraux de la plateforme.";
    case 'Tâches':
      return "Attribuer et suivre les tâches administratives.";
    case 'Reparateurs':
      return "Gérer les comptes et missions des réparateurs.";
    case 'Renseignements':
      return "Accéder aux informations et historiques.";
    case 'Diagnostics':
      return "Lancer et consulter les diagnostics techniques.";
    default:
      return "Accès rapide à la fonctionnalité.";
  }
}

  return (
    <div className="min-h-screen w-full bg-gray-100 py-10 px-2 md:px-8">
      {/* Welcome and General Info */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">Bienvenue{session?.user?.name ? `, ${session.user.name}` : ' Administrateur'} !</h1>
          <p className="text-lg text-gray-500 font-medium">Heureux de vous revoir sur votre espace d'administration.</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full text-lg font-semibold shadow flex items-center gap-2">
          <span className="uppercase tracking-wider">ADMIN</span>
        </div>
      </div>

      {/* General Info Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-200">
        <div>
          <div className="text-xl font-bold text-blue-700 mb-1">Informations Générales</div>
          <div className="text-gray-600">Aujourd'hui : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-blue-700">Rapide</span>
            <span className="text-blue-500">Navigation</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-blue-700">Sécurisé</span>
            <span className="text-blue-500">Accès</span>
          </div>
        </div>
      </div>

      {/* Accueil (Home) Button */}
      <div className="flex justify-center mb-8">
        <button
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold shadow-lg border-4 border-blue-300 hover:border-blue-500 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
          style={{ minWidth: 320 }}
          onClick={() => router.push('/roles/admin/dashboard')}
        >
          <Home size={32} className="mr-2" />
          Accueil
        </button>
      </div>

      {/* Enhanced Quick Access Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {quickLinks.map((link, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-xl shadow hover:shadow-lg hover:scale-[1.03] transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-400"
            onClick={() => router.push(link.path)}
          >
            <div className="flex flex-col items-center p-7">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 text-white text-3xl shadow ${link.bgColor ?? 'bg-blue-600'} group-hover:scale-110 transition-transform duration-200`}>{link.icon}</div>
              <h3 className="text-lg font-bold text-blue-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">{link.title}</h3>
              <p className="text-xs text-gray-500 text-center font-medium mb-2">{link.description}</p>
              {/* Purpose/Info for each button */}
              <span className="text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-full mt-1 shadow-sm">{getPurposeDescription(link.title)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Define a getLayout function to use the AdminLayout
AdminDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};
