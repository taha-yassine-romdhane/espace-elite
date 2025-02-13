export function TasksList() {
  const tasks = [
    {
      id: 1,
      title: 'Review patient reports',
      priority: 'High',
      status: 'In Progress',
    },
    {
      id: 2,
      title: 'Equipment maintenance check',
      priority: 'Medium',
      status: 'Pending',
    },
    {
      id: 3,
      title: 'Update medical records',
      priority: 'High',
      status: 'In Progress',
    },
    {
      id: 4,
      title: 'Stock inventory check',
      priority: 'Low',
      status: 'Completed',
    },
  ];

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <li key={task.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${
                    task.priority === 'High'
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                  {task.priority}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${
                    task.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                  {task.status}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
