import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, AlertCircle, Bell, Clock, CheckCircle2 } from 'lucide-react';

// Define notification types
interface BaseNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED' | 'IN_PROGRESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  type: string;
}

interface DiagnosticResultNotification extends BaseNotification {
  type: 'DIAGNOSTIC_RESULT';
  deviceId: string;
  deviceName: string;
  patientId: string;
  patientName: string;
  parameterId: string;
  parameterName: string;
  dueDate: string;
  value?: string;
  notes?: string;
}

interface TaskNotification extends BaseNotification {
  type: 'TASK';
  taskId: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: string;
}

interface RepairNotification extends BaseNotification {
  type: 'REPAIR';
  deviceId: string;
  deviceName: string;
  repairId: string;
  technicianId?: string;
  technicianName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

type Notification = DiagnosticResultNotification | TaskNotification | RepairNotification;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [resultValue, setResultValue] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const { toast } = useToast();

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch(`/api/notifications?type=${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les notifications',
        variant: 'destructive',
      });
      
      // For development purposes, use mock data
      setNotifications(getMockNotifications(activeTab));
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for development
  const getMockNotifications = (type: string): Notification[] => {
    const allNotifications: Notification[] = [
      {
        id: '1',
        title: 'Résultat d\'échographie en attente',
        description: 'Le résultat d\'échographie pour Mohamed Ben Ali est attendu',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'PENDING',
        priority: 'MEDIUM',
        type: 'DIAGNOSTIC_RESULT',
        deviceId: 'dev-001',
        deviceName: 'Scanner à ultrasons XYZ',
        patientId: 'pat-001',
        patientName: 'Mohamed Ben Ali',
        parameterId: 'param-001',
        parameterName: 'Résultat d\'échographie',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
      {
        id: '2',
        title: 'Résultat d\'électrocardiogramme en retard',
        description: 'Le résultat d\'électrocardiogramme pour Fatima Trabelsi est en retard',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'PENDING',
        priority: 'HIGH',
        type: 'DIAGNOSTIC_RESULT',
        deviceId: 'dev-002',
        deviceName: 'Appareil ECG CardioPlus',
        patientId: 'pat-002',
        patientName: 'Fatima Trabelsi',
        parameterId: 'param-002',
        parameterName: 'Résultat d\'électrocardiogramme',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
      },
      {
        id: '3',
        title: 'Maintenance du respirateur artificiel',
        description: 'Tâche de maintenance programmée pour le respirateur artificiel',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        status: 'PENDING',
        priority: 'HIGH',
        type: 'TASK',
        taskId: 'task-001',
        assigneeId: 'tech-001',
        assigneeName: 'Ahmed Technicien',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // In 2 days
      },
      {
        id: '4',
        title: 'Réparation du moniteur cardiaque',
        description: 'Réparation en cours pour le moniteur cardiaque de la chambre 203',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        type: 'REPAIR',
        deviceId: 'dev-003',
        deviceName: 'Moniteur cardiaque BedSide',
        repairId: 'rep-001',
        technicianId: 'tech-002',
        technicianName: 'Sami Réparateur',
      },
    ];

    if (type === 'all') {
      return allNotifications;
    }
    
    return allNotifications.filter(notification => 
      type === 'diagnostic' ? notification.type === 'DIAGNOSTIC_RESULT' :
      type === 'task' ? notification.type === 'TASK' :
      type === 'repair' ? notification.type === 'REPAIR' : true
    );
  };

  const handleNotificationAction = (notification: Notification) => {
    setSelectedNotification(notification);
    
    if (notification.type === 'DIAGNOSTIC_RESULT') {
      setResultValue((notification as DiagnosticResultNotification).value || '');
      setResultNotes((notification as DiagnosticResultNotification).notes || '');
      setIsUpdateDialogOpen(true);
    } else if (notification.type === 'TASK') {
      // Handle task notification action
      // For now, just mark it as viewed
      markNotificationAsViewed(notification.id);
    } else if (notification.type === 'REPAIR') {
      // Handle repair notification action
      // For now, just mark it as viewed
      markNotificationAsViewed(notification.id);
    }
  };

  const markNotificationAsViewed = async (notificationId: string) => {
    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch(`/api/notifications/${notificationId}/view`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as viewed');
      }

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'COMPLETED' as const } 
            : notification
        )
      );

      toast({
        title: 'Succès',
        description: 'Notification marquée comme vue',
      });
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la notification comme vue',
        variant: 'destructive',
      });
    }
  };

  const submitDiagnosticResult = async () => {
    if (!selectedNotification || selectedNotification.type !== 'DIAGNOSTIC_RESULT') return;

    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch(`/api/diagnostic-results/${(selectedNotification as DiagnosticResultNotification).parameterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: resultValue,
          notes: resultNotes,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update diagnostic result');
      }

      // Mark the notification as completed
      await markNotificationAsViewed(selectedNotification.id);

      toast({
        title: 'Succès',
        description: 'Le résultat a été mis à jour avec succès',
      });

      // Refresh the list of notifications
      fetchNotifications();
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating result:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le résultat',
        variant: 'destructive',
      });
    }
  };

  // Calculate if a notification is overdue
  const isOverdue = (notification: Notification) => {
    if ('dueDate' in notification) {
      const today = new Date();
      const due = new Date(notification.dueDate);
      return due < today && notification.status === 'PENDING';
    }
    return false;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive">Haute</Badge>;
      case 'MEDIUM':
        return <Badge variant="default">Moyenne</Badge>;
      case 'LOW':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (notification: Notification) => {
    if (isOverdue(notification)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          En retard
        </Badge>
      );
    }

    switch (notification.status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Complété
          </Badge>
        );
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DIAGNOSTIC_RESULT':
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case 'TASK':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'REPAIR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionButton = (notification: Notification) => {
    if (notification.status === 'COMPLETED') {
      return (
        <Button variant="outline" size="sm" disabled>
          Complété
        </Button>
      );
    }

    switch (notification.type) {
      case 'DIAGNOSTIC_RESULT':
        return (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleNotificationAction(notification)}
          >
            Saisir le résultat
          </Button>
        );
      case 'TASK':
        return (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleNotificationAction(notification)}
          >
            Voir la tâche
          </Button>
        );
      case 'REPAIR':
        return (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleNotificationAction(notification)}
          >
            Voir la réparation
          </Button>
        );
      default:
        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markNotificationAsViewed(notification)}
          >
            Marquer comme lu
          </Button>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Centre de Notifications</h1>
        <Button variant="outline" onClick={fetchNotifications} disabled={isLoading}>
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="diagnostic">Résultats</TabsTrigger>
          <TabsTrigger value="task">Tâches</TabsTrigger>
          <TabsTrigger value="repair">Réparations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Toutes les notifications</h2>
          {renderNotifications()}
        </TabsContent>
        
        <TabsContent value="diagnostic" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Résultats de diagnostic</h2>
          {renderNotifications()}
        </TabsContent>
        
        <TabsContent value="task" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Tâches</h2>
          {renderNotifications()}
        </TabsContent>
        
        <TabsContent value="repair" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Réparations</h2>
          {renderNotifications()}
        </TabsContent>
      </Tabs>

      {selectedNotification && selectedNotification.type === 'DIAGNOSTIC_RESULT' && (
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-[500px] rounded-lg">
            <DialogHeader>
              <DialogTitle>Saisir le résultat</DialogTitle>
              <DialogDescription>
                Entrez le résultat pour {(selectedNotification as DiagnosticResultNotification).parameterName} du patient{' '}
                {(selectedNotification as DiagnosticResultNotification).patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="resultValue">Valeur du résultat</Label>
                <Input
                  id="resultValue"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder="Entrez la valeur du résultat"
                />
              </div>
              <div>
                <Label htmlFor="resultNotes">Notes (optionnel)</Label>
                <Textarea
                  id="resultNotes"
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  placeholder="Ajoutez des notes ou observations"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={submitDiagnosticResult}>Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  function renderNotifications() {
    if (isLoading) {
      return <div className="text-center py-8">Chargement des notifications...</div>;
    }

    if (notifications.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucune notification à afficher
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`${isOverdue(notification) ? 'border-red-300' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.type)}
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(notification.priority)}
                  {getStatusBadge(notification)}
                </div>
              </div>
              <CardDescription>
                {notification.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="text-sm text-gray-600">
                  Créé le {new Date(notification.createdAt).toLocaleDateString()} à {new Date(notification.createdAt).toLocaleTimeString()}
                </div>
                
                {notification.type === 'DIAGNOSTIC_RESULT' && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Appareil:</span> {(notification as DiagnosticResultNotification).deviceName}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Patient:</span> {(notification as DiagnosticResultNotification).patientName}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Date d'échéance:</span> {new Date((notification as DiagnosticResultNotification).dueDate).toLocaleDateString()}
                    </div>
                  </>
                )}
                
                {notification.type === 'TASK' && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Assigné à:</span> {(notification as TaskNotification).assigneeName || 'Non assigné'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Date d'échéance:</span> {new Date((notification as TaskNotification).dueDate).toLocaleDateString()}
                    </div>
                  </>
                )}
                
                {notification.type === 'REPAIR' && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Appareil:</span> {(notification as RepairNotification).deviceName}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Technicien:</span> {(notification as RepairNotification).technicianName || 'Non assigné'}
                    </div>
                  </>
                )}
                
                <div className="pt-2">
                  {getActionButton(notification)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
