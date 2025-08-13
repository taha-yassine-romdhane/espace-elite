import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  CalendarDays
} from 'lucide-react';
import EmployeeLayout from '../EmployeeLayout';

const AppointmentsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAppointments();
    }
  }, [session, searchTerm, filterStatus, selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (selectedDate) params.append('date', selectedDate);
      
      const response = await fetch(`/api/appointments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'SCHEDULED': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: <Clock className="h-3 w-3" />,
        label: 'Programmé'
      },
      'COMPLETED': { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Terminé'
      },
      'CANCELLED': { 
        color: 'bg-red-100 text-red-800', 
        icon: <XCircle className="h-3 w-3" />,
        label: 'Annulé'
      },
      'IN_PROGRESS': { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <AlertCircle className="h-3 w-3" />,
        label: 'En cours'
      }
    };
    
    const config = statusConfig[status] || { 
      color: 'bg-gray-100 text-gray-800', 
      icon: null, 
      label: status 
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500';
      case 'NORMAL':
        return 'border-l-blue-500';
      case 'LOW':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos rendez-vous et planifications
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {/* Open new appointment dialog */}}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tous les statuts</option>
              <option value="SCHEDULED">Programmé</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setSelectedDate('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Effacer
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : appointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {appointments.map((appointment: any, index) => (
                <div 
                  key={index} 
                  className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(appointment.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.appointmentType}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {appointment.patient 
                              ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                              : appointment.company?.name || 'Client non spécifié'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(appointment.scheduledDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {new Date(appointment.scheduledDate).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {appointment.location}
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mb-3">
                          {appointment.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        {getStatusBadge(appointment.status)}
                        {appointment.priority === 'HIGH' && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun rendez-vous trouvé</p>
              <p className="text-sm text-gray-400 mt-2">
                Créez votre premier rendez-vous ou modifiez vos filtres
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Aujourd'hui</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => 
                    new Date(a.scheduledDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Terminés</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">En attente</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'SCHEDULED').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Annulés</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'CANCELLED').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

AppointmentsPage.getLayout = (page: React.ReactNode) => (
  <EmployeeLayout>{page}</EmployeeLayout>
);

export default AppointmentsPage;