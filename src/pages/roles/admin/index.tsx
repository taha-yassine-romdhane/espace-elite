import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  Users,
  Package,
  ShoppingCart,
  Activity,
  Stethoscope,
  FileText,
  Shield,
  Clock,
  Calendar,
  CalendarCheck,
  BarChart3,
  KeyRound,
  Home,
  ClipboardCheck,
  MessageCircle,
  MapPin,
  Wrench,
  Database,
  FileSpreadsheet,
  Settings,
  ListTodo
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);


  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-slate-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      icon: <Home size={24} />,
      title: 'Tableau de Bord',
      description: 'Vue d\'ensemble et statistiques principales',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      path: '/roles/admin/dashboard',
      category: 'Tableau de Bord'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Analyses & Rapports',
      description: 'Statistiques et analyses détaillées',
      bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
      path: '/roles/admin/analytics',
      category: 'Analyses'
    },
    {
      icon: <Calendar size={24} />,
      title: 'Rendez-vous',
      description: 'Gestion des rendez-vous patients',
      bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
      path: '/roles/admin/appointments',
      category: 'Planning'
    },
    {
      icon: <Stethoscope size={24} />,
      title: 'Polygraphies',
      description: 'Gestion des examens de polygraphie',
      bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
      path: '/roles/admin/diagnostics',
      category: 'Examens'
    },
    {
      icon: <ShoppingCart size={24} />,
      title: 'Gestion des Ventes',
      description: 'Gestion complète des ventes',
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      path: '/roles/admin/sales',
      category: 'Ventes'
    },
    {
      icon: <KeyRound size={24} />,
      title: 'Gestion des Locations',
      description: 'Gestion des équipements en location',
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      path: '/roles/admin/location',
      category: 'Locations'
    },
    {
      icon: <ListTodo size={24} />,
      title: 'Tâches Manuelles',
      description: 'Créer et assigner des tâches',
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      path: '/roles/admin/manual-tasks',
      category: 'Gestion des Tâches'
    },
    {
      icon: <CalendarCheck size={24} />,
      title: 'Calendrier & Tâches',
      description: 'Vue calendrier et gestion des tâches',
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      path: '/roles/admin/calendar',
      category: 'Planification'
    },
    {
      icon: <ClipboardCheck size={24} />,
      title: 'Notifications',
      description: 'Notifications système et alertes',
      bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500',
      path: '/roles/admin/notifications',
      category: 'Surveillance'
    },
    {
      icon: <MessageCircle size={24} />,
      title: 'Messages',
      description: 'Messagerie et communication interne',
      bgColor: 'bg-gradient-to-br from-sky-500 to-sky-600',
      path: '/roles/admin/chat',
      category: 'Communication'
    },
    {
      icon: <Users size={24} />,
      title: 'Utilisateurs',
      description: 'Gestion des comptes utilisateurs',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      path: '/roles/admin/users',
      category: 'Gestion Utilisateurs'
    },
    {
      icon: <FileText size={24} />,
      title: 'Renseignement',
      description: 'Gestion des patients et entreprises',
      bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      path: '/roles/admin/renseignement',
      category: 'Gestion'
    },
    {
      icon: <MapPin size={24} />,
      title: 'Carte des Patients',
      description: 'Localisation géographique des patients',
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      path: '/roles/admin/map',
      category: 'Géolocalisation'
    },
    {
      icon: <Package size={24} />,
      title: 'Gestion des Appareils',
      description: 'Catalogue des équipements médicaux',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      path: '/roles/admin/appareils',
      category: 'Équipements'
    },
    {
      icon: <Wrench size={24} />,
      title: 'Gestion des Réparateurs',
      description: 'Équipe technique et réparateurs',
      bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      path: '/roles/admin/reparateur',
      category: 'Personnel'
    },
    {
      icon: <Database size={24} />,
      title: 'Gestion des Stocks',
      description: 'Inventaire et stocks des équipements',
      bgColor: 'bg-gradient-to-br from-lime-500 to-lime-600',
      path: '/roles/admin/stock',
      category: 'Inventaire'
    },
    {
      icon: <Shield size={24} />,
      title: 'Gestion CNAM',
      description: 'Gestion des dossiers CNAM',
      bgColor: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
      path: '/roles/admin/cnam-management',
      category: 'CNAM'
    },
    {
      icon: <FileSpreadsheet size={24} />,
      title: 'Import/Export Excel',
      description: 'Importation et exportation de données',
      bgColor: 'bg-gradient-to-br from-gray-500 to-gray-600',
      path: '/roles/admin/excel-import',
      category: 'Données'
    },
    {
      icon: <Settings size={24} />,
      title: 'Paramètres',
      description: 'Configuration système',
      bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
      path: '/roles/admin/settings',
      category: 'Administration'
    }
  ];

  // Get current time for professional greeting
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // TODO: Connect to real API for system stats
  // const getSystemStats = () => {
  //   return [
  //     { label: 'Patients Actifs', value: '847', trend: '+12', icon: <Users size={16} /> },
  //     { label: 'Équipements', value: '234', trend: '+3', icon: <Package size={16} /> },
  //     { label: 'Interventions', value: '45', trend: '+8', icon: <Activity size={16} /> },
  //     { label: 'Alertes', value: '3', trend: '-2', icon: <AlertCircle size={16} /> },
  //   ];
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100">
      {/* Professional Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {getCurrentTimeGreeting()}{session?.user?.name ? `, ${session.user.name}` : ''}
                  </h1>
                  <p className="text-slate-600 font-medium">Centre de Gestion Oxygénothérapie</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">ADMINISTRATEUR</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Dernière connexion</div>
                <div className="font-semibold text-slate-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {typeof window !== 'undefined' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">


        {/* Quick Access Navigation */}
        <div className="space-y-6">
      

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Link href={link.path} key={index}>
                <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${link.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        {link.icon}
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {link.category}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                        {link.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Système Sécurisé</div>
                <div className="text-sm text-slate-600">Conforme aux normes médicales</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Système Opérationnel</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Connexion Sécurisée</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define a getLayout function to use the AdminLayout
AdminDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};