export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'appointment',
      description: 'New appointment scheduled with Dr. Smith',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'task',
      description: 'Equipment maintenance completed',
      time: '4 hours ago',
    },
    {
      id: 3,
      type: 'patient',
      description: 'New patient registration: John Doe',
      time: '5 hours ago',
    },
    {
      id: 4,
      type: 'stock',
      description: 'Medical supplies restocked',
      time: '1 day ago',
    },
  ];

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <span className="text-white text-sm">
                      {activity.type[0].toUpperCase()}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time>{activity.time}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
