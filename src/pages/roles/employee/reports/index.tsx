import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Activity,
  Package,
  ShoppingCart,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import EmployeeLayout from '../EmployeeLayout';

const ReportsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    diagnostics: { total: 0, completed: 0, pending: 0 },
    appointments: { total: 0, completed: 0, cancelled: 0 },
    sales: { total: 0, amount: 0 },
    rentals: { active: 0, completed: 0 },
    tasks: { total: 0, completed: 0, overdue: 0 }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReportData();
    }
  }, [session, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/employee-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type
      });
      
      const response = await fetch(`/api/employee-reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${type}-${dateRange.startDate}-${dateRange.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const reportCards = [
    {
      title: 'Activité Générale',
      icon: <Activity className="h-8 w-8" />,
      color: 'bg-green-500',
      description: 'Résumé complet de vos activités',
      type: 'general'
    },
    {
      title: 'Diagnostics',
      icon: <Activity className="h-8 w-8" />,
      color: 'bg-purple-500',
      description: 'Rapport détaillé des diagnostics',
      type: 'diagnostics'
    },
    {
      title: 'Rendez-vous',
      icon: <Calendar className="h-8 w-8" />,
      color: 'bg-blue-500',
      description: 'Analyse des rendez-vous',
      type: 'appointments'
    },
    {
      title: 'Ventes',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'bg-orange-500',
      description: 'Performance des ventes',
      type: 'sales'
    },
    {
      title: 'Locations',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-indigo-500',
      description: 'Gestion des locations',
      type: 'rentals'
    },
    {
      title: 'Tâches',
      icon: <Clock className="h-8 w-8" />,
      color: 'bg-red-500',
      description: 'Productivité et tâches',
      type: 'tasks'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600 mt-1">
            Analysez vos performances et générez des rapports
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Période d'analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Diagnostics</p>
                <p className="text-2xl font-bold">{stats.diagnostics.total}</p>
                <p className="text-purple-100 text-xs">
                  {stats.diagnostics.completed} complétés
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">RDV</p>
                <p className="text-2xl font-bold">{stats.appointments.total}</p>
                <p className="text-blue-100 text-xs">
                  {stats.appointments.completed} terminés
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Ventes</p>
                <p className="text-2xl font-bold">{stats.sales.total}</p>
                <p className="text-orange-100 text-xs">
                  {stats.sales.amount}€ CA
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Locations</p>
                <p className="text-2xl font-bold">{stats.rentals.active}</p>
                <p className="text-indigo-100 text-xs">actives</p>
              </div>
              <Package className="h-8 w-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Tâches</p>
                <p className="text-2xl font-bold">{stats.tasks.total}</p>
                <p className="text-red-100 text-xs">
                  {stats.tasks.completed} terminées
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rapports disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((report, index) => (
            <Card key={index} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${report.color} text-white`}>
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {report.description}
                    </p>
                    <button
                      onClick={() => exportReport(report.type)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance sur la période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Graphique de performance</p>
              <p className="text-sm text-gray-400 mt-2">
                Intégration des graphiques en cours de développement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ReportsPage.getLayout = (page: React.ReactNode) => (
  <EmployeeLayout>{page}</EmployeeLayout>
);

export default ReportsPage;