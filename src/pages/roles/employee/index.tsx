import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import EmployeeLayout from './EmployeeLayout';

export default function EmployeeDashboard() {
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Employé</h1>
        <p className="text-sm text-gray-500">
          Bienvenue, {session?.user?.name || 'Employé'}
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tâches Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">4</div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">2 complétées, 2 en attente</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">3</div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Prochain: 14:30 - Mme. Dupont</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Heures de Travail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">32h</div>
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Cette semaine (sur 40h)</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">43</div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">12 nouveaux ce mois</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Tâches Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, title: "Vérifier l'inventaire des fournitures", status: "Terminé", date: "Aujourd'hui, 09:30" },
              { id: 2, title: "Appeler M. Martin pour rappel RDV", status: "En attente", date: "Aujourd'hui, 11:00" },
              { id: 3, title: "Mettre à jour dossier patient #472", status: "En attente", date: "Aujourd'hui, 14:00" }
            ].map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500">{task.date}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'Terminé' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Define a getLayout function to use the EmployeeLayout
EmployeeDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <EmployeeLayout>{page}</EmployeeLayout>;
};
