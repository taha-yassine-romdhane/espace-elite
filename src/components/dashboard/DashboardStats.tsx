import { Card } from '@/components/ui/Card';

export function DashboardStats() {
  const stats = [
    {
      name: 'Total Patients',
      value: '2,345',
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Active Appointments',
      value: '45',
      change: '+5%',
      changeType: 'increase',
    },
    {
      name: 'Equipment Status',
      value: '98%',
      change: '+2%',
      changeType: 'increase',
    },
    {
      name: 'Tasks Completed',
      value: '24',
      change: '+8%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500">{stat.name}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </div>
              <div className={`text-sm ${
                stat.changeType === 'increase' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
