import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Users,
  LayoutDashboard,
  Clipboard,
  Box,
  SquareActivity,
  Bell,
  History,
  ShoppingCart,
  CalendarClock,
  MessageCircle,
  User,
  Activity,
  Package,
  FileText,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import EmployeeLayout from './EmployeeLayout';

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, pending: 0 },
    appointments: { today: 0, week: 0 },
    diagnostics: { pending: 0, completed: 0 },
    notifications: { unread: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch stats
  useEffect(() => {
    if (session?.user?.id) {
      // Fetch real stats from API
      fetchEmployeeStats();
      fetchRecentActivities();
    }
  }, [session]);

  const fetchEmployeeStats = async () => {
    try {
      const response = await fetch('/api/employee-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await fetch('/api/employee-activities');
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Quick access actions
  const quickActions = [
    {
      title: "Tableau de Bord",
      description: "Gérer vos opérations quotidiennes",
      icon: <LayoutDashboard className="h-8 w-8" />,
      path: "/roles/employee/dashboard",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    },
    {
      title: "Diagnostique",
      description: "Commencer un nouveau diagnostic",
      icon: <SquareActivity className="h-8 w-8" />,
      path: "/roles/employee/diagnostics",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600"
    },
    {
      title: "Tâches",
      description: "Voir et gérer vos tâches",
      icon: <Clipboard className="h-8 w-8" />,
      path: "/roles/employee/tasks",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: "Patients",
      description: "Gérer vos patients assignés",
      icon: <Users className="h-8 w-8" />,
      path: "/roles/employee/renseignement",
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600"
    },
    {
      title: "Stock",
      description: "Gérer votre inventaire",
      icon: <Box className="h-8 w-8" />,
      path: "/roles/employee/stock",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600"
    },
    {
      title: "Messages",
      description: "Consulter vos messages",
      icon: <MessageCircle className="h-8 w-8" />,
      path: "/roles/employee/chat",
      color: "bg-pink-500",
      hoverColor: "hover:bg-pink-600"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Espace Employé</h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, <span className="font-semibold text-green-600">{session?.user?.name || 'Employé'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/roles/employee/notifications')}
            className="relative p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {stats?.notifications?.unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {stats.notifications.unread}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/roles/employee/profile')}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm">Tâches Aujourd'hui</p>
                <p className="text-3xl font-bold mt-2">{stats?.tasks?.total || 4}</p>
                <p className="text-green-100 text-xs mt-1">
                  {stats?.tasks?.completed || 2} complétées, {stats?.tasks?.pending || 2} en attente
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm">Diagnostics</p>
                <p className="text-3xl font-bold mt-2">{stats?.diagnostics?.pending || 5}</p>
                <p className="text-purple-100 text-xs mt-1">En attente</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm">Rendez-vous</p>
                <p className="text-3xl font-bold mt-2">{stats?.appointments?.today || 3}</p>
                <p className="text-orange-100 text-xs mt-1">Aujourd'hui</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Notifications</p>
                <p className="text-3xl font-bold mt-2">{stats?.notifications?.unread || 7}</p>
                <p className="text-blue-100 text-xs mt-1">Non lues</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Buttons */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Accès Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              onClick={() => router.push(action.path)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-green-500"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Activité Récente</CardTitle>
            <button
              onClick={() => router.push('/roles/employee/history')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Voir tout
            </button>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((item, index) => {
                  // Map icon names to components
                  const iconMap = {
                    'CheckCircle': <CheckCircle className="h-4 w-4" />,
                    'Clock': <Clock className="h-4 w-4" />,
                    'Package': <Package className="h-4 w-4" />,
                    'AlertCircle': <AlertCircle className="h-4 w-4" />,
                    'Activity': <Activity className="h-4 w-4" />
                  };
                  
                  return (
                    <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className={`p-2 rounded-full ${item.color}`}>
                        {iconMap[item.icon] || <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      </div>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/roles/employee/dashboard')}
                className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="p-3 bg-green-500 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <SquareActivity className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">Nouveau Diagnostic</span>
              </button>

              <button
                onClick={() => router.push('/roles/employee/sales')}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="p-3 bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">Nouvelle Vente</span>
              </button>

              <button
                onClick={() => router.push('/roles/employee/rentals')}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="p-3 bg-purple-500 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">Nouvelle Location</span>
              </button>

              <button
                onClick={() => router.push('/roles/employee/tasks')}
                className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
              >
                <div className="p-3 bg-orange-500 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">Voir Tâches</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Define a getLayout function to use the EmployeeLayout
EmployeeDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <EmployeeLayout>{page}</EmployeeLayout>;
};