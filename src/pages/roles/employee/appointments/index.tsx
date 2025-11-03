import { useState } from 'react';
import Head from 'next/head';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus } from 'lucide-react';
import EmployeeLayout from '../EmployeeLayout';
import { useRouter } from 'next/router';
import AppointmentsExcelTable from '../dashboard/components/tables/AppointmentsExcelTable';

const AppointmentsPage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Rendez-vous - Espace Elite</title>
        <meta name="description" content="Gestion des rendez-vous employé" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Calendar className="h-8 w-8" />
                  Mes Rendez-vous
                </h1>
                <p className="text-green-100 mt-2">
                  Gérez vos rendez-vous et planifications
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/roles/employee/appointments/create')}
                  className="bg-white text-green-700 hover:bg-green-50 font-semibold shadow-lg flex items-center gap-2 px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Nouveau RDV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 -mt-6 space-y-6">
          {/* Appointments Table */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <AppointmentsExcelTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

AppointmentsPage.getLayout = (page: React.ReactNode) => (
  <EmployeeLayout>{page}</EmployeeLayout>
);

export default AppointmentsPage;
