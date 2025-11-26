import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    User,
    Bell,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Calendar,
    HelpCircle,
    Link,
    AlertCircle,
    RotateCw,
    UserPlus,
    Stethoscope,
    Eye,
    EyeOff
} from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface NavbarProps {
    onSidebarToggle?: () => void;
    sidebarExpanded?: boolean;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    status: NotificationStatus;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
    actionUrl?: string;
    priority?: string;
    metadata?: any;
}

type NotificationType = 'FOLLOW_UP' | 'MAINTENANCE' | 'APPOINTMENT' | 'PAYMENT_DUE' | 'TRANSFER' | 'OTHER';
type NotificationStatus = 'PENDING' | 'COMPLETED' | 'DISMISSED' | 'READ';

const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, sidebarExpanded = true }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Fetch company settings for company name
    const { data: settings } = useQuery({
        queryKey: ['general-settings'],
        queryFn: async () => {
            const response = await fetch('/api/settings/general');
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!session?.user,
        staleTime: 5 * 60 * 1000,
    });

    const companyName = settings?.companyName || "Elite Médicale";

    // Quick patient creation dialog
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [similarPatients, setSimilarPatients] = useState<any[]>([]);
    const [showSimilarPatients, setShowSimilarPatients] = useState(false);

    // Quick doctor creation dialog
    const [isQuickDoctorCreateOpen, setIsQuickDoctorCreateOpen] = useState(false);
    const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);
    const [doctorFirstName, setDoctorFirstName] = useState('');
    const [doctorLastName, setDoctorLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifyingDoctor, setIsVerifyingDoctor] = useState(false);
    const [similarDoctors, setSimilarDoctors] = useState<any[]>([]);
    const [showSimilarDoctors, setShowSimilarDoctors] = useState(false);

    // Update time every minute and fetch notifications
    useEffect(() => {
        // Set initial time on client side only
        setCurrentTime(new Date());
        
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
        // Fetch notifications when component mounts
        fetchNotifications();
        
        return () => clearInterval(timer);
    }, []);
    
    // Function to fetch notifications from the API
    const fetchNotifications = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            const response = await axios.get('/api/notifications/get-user-notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to mark a notification as read
    const markNotificationAsRead = async (notificationId: string) => {
        try {
            await axios.post('/api/notifications/mark-as-read', { notificationId });
            
            // Update local state
            setNotifications(prev => 
                prev.map(notification => 
                    notification.id === notificationId 
                        ? { ...notification, isRead: true, readAt: new Date().toISOString() } 
                        : notification
                )
            );
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get user initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };
    
    // Get current page title based on route
    const getPageTitle = () => {
        const path = router.pathname;

        if (path.includes('/dashboard')) return 'Tableau de Bord';
        if (path.includes('/renseignement')) return 'Renseignement';
        if (path.includes('/diagnostics')) return 'Diagnostique';
        if (path.includes('/sales')) return 'Vente';
        if (path.includes('/rentals')) return 'Location';
        if (path.includes('/tasks')) return 'Tâches';
        if (path.includes('/stock')) return 'Stock';
        if (path.includes('/notifications')) return 'Notifications';
        if (path.includes('/history')) return 'Historique';

        return companyName;
    };
    
    // Get notification icon based on type
    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'FOLLOW_UP':
                return <Calendar className="h-5 w-5 text-blue-500" />;
            case 'MAINTENANCE':
                return <Settings className="h-5 w-5 text-orange-500" />;
            case 'APPOINTMENT':
                return <Calendar className="h-5 w-5 text-green-500" />;
            case 'PAYMENT_DUE':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'TRANSFER':
                return <Link className="h-5 w-5 text-purple-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };
    
    // Format relative time for notifications
    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
        } catch (error) {
            return 'Date inconnue';
        }
    };
    
    const handleLogout = () => {
        // Use window.location.origin to get the current domain for production compatibility
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        signOut({ callbackUrl: `${baseUrl}/welcome` });
    };
    
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Generate email and password for doctor
    const generateDoctorEmail = (firstName: string, lastName: string) => {
        const cleanFirst = firstName.trim().toLowerCase().replace(/\s+/g, '');
        const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');
        return `${cleanFirst}.${cleanLast}@elite.com`;
    };

    const generateDoctorPassword = (firstName: string, lastName: string) => {
        const cleanFirst = firstName.trim().toUpperCase().replace(/\s+/g, '');
        const cleanLast = lastName.trim().toUpperCase().replace(/\s+/g, '');
        return `${cleanFirst}-${cleanLast}`;
    };

    const generatedEmail = doctorFirstName && doctorLastName
        ? generateDoctorEmail(doctorFirstName, doctorLastName)
        : '';
    const generatedPassword = doctorFirstName && doctorLastName
        ? generateDoctorPassword(doctorFirstName, doctorLastName)
        : '';

    // Verify similar patients
    const handleVerifyPatient = async () => {
        if (!patientName.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez entrer un nom de patient",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsVerifying(true);
            const response = await axios.get('/api/patients', {
                params: { search: patientName.trim() }
            });

            const patients = response.data || [];
            const nameParts = patientName.trim().toLowerCase().split(' ');

            // Filter patients with similar names
            const similar = patients.filter((patient: any) => {
                const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
                return nameParts.some(part => fullName.includes(part) && part.length > 2);
            });

            setSimilarPatients(similar);
            setShowSimilarPatients(true);

            if (similar.length === 0) {
                toast({
                    title: "Vérification",
                    description: "Aucun patient similaire trouvé",
                });
            }
        } catch (error) {
            console.error('Error verifying patient:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de la vérification",
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    // Verify similar doctors
    const handleVerifyDoctor = async () => {
        if (!doctorFirstName.trim() && !doctorLastName.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez entrer un prénom ou un nom de docteur",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsVerifyingDoctor(true);
            const response = await axios.get('/api/users/list', {
                params: { role: 'DOCTOR' }
            });

            const doctors = response.data.users || [];
            const searchFirstName = doctorFirstName.trim().toLowerCase();
            const searchLastName = doctorLastName.trim().toLowerCase();

            // Filter doctors with similar names
            const similar = doctors.filter((doctor: any) => {
                const docFirstName = (doctor.firstName || '').toLowerCase().trim();
                const docLastName = (doctor.lastName || '').toLowerCase().trim();
                const docName = (doctor.name || '').toLowerCase().trim();

                // If doctor has no firstName/lastName, use name field split
                let effectiveFirstName = docFirstName;
                let effectiveLastName = docLastName;

                if (!docFirstName && !docLastName && docName) {
                    const nameParts = docName.split(' ');
                    effectiveFirstName = nameParts[0] || '';
                    effectiveLastName = nameParts.slice(1).join(' ') || '';
                }

                let firstNameMatch = false;
                let lastNameMatch = false;

                // Check first name match (if provided and at least 3 chars)
                if (searchFirstName && searchFirstName.length >= 3 && effectiveFirstName) {
                    if (effectiveFirstName === searchFirstName ||
                        effectiveFirstName.startsWith(searchFirstName) ||
                        (effectiveFirstName.length >= 3 && searchFirstName.startsWith(effectiveFirstName))) {
                        firstNameMatch = true;
                    }
                }

                // Check last name match (if provided and at least 3 chars)
                if (searchLastName && searchLastName.length >= 3 && effectiveLastName) {
                    if (effectiveLastName === searchLastName ||
                        effectiveLastName.startsWith(searchLastName) ||
                        (effectiveLastName.length >= 3 && searchLastName.startsWith(effectiveLastName))) {
                        lastNameMatch = true;
                    }
                }

                // If both provided, need at least one match
                if (searchFirstName && searchLastName) {
                    return firstNameMatch || lastNameMatch;
                }

                // If only first name provided
                if (searchFirstName && !searchLastName) {
                    return firstNameMatch;
                }

                // If only last name provided
                if (searchLastName && !searchFirstName) {
                    return lastNameMatch;
                }

                return false;
            });

            setSimilarDoctors(similar);
            setShowSimilarDoctors(true);

            if (similar.length === 0) {
                toast({
                    title: "Vérification",
                    description: "Aucun docteur similaire trouvé. Vous pouvez créer ce docteur.",
                });
            }
        } catch (error) {
            console.error('Error verifying doctor:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de la vérification",
                variant: "destructive"
            });
        } finally {
            setIsVerifyingDoctor(false);
        }
    };

    // Quick patient creation
    const handleQuickCreatePatient = async () => {
        if (!patientName.trim() || !patientPhone.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez remplir tous les champs",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsCreating(true);

            const formData = new FormData();
            formData.append('type', 'Patient');
            formData.append('nomComplet', patientName);
            formData.append('telephonePrincipale', patientPhone);
            formData.append('technicienResponsable', session?.user.id || '');

            const response = await axios.post('/api/renseignements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Succès",
                description: "Patient créé avec succès",
            });

            // Reset form
            setPatientName('');
            setPatientPhone('');
            setSimilarPatients([]);
            setShowSimilarPatients(false);
            setIsQuickCreateOpen(false);

            // Optionally navigate to patient details
            if (response.data.id) {
                router.push(`/roles/employee/renseignement/patient/${response.data.id}`);
            }
        } catch (error: any) {
            console.error('Error creating patient:', error);
            toast({
                title: "Erreur",
                description: error.response?.data?.error || "Erreur lors de la création du patient",
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Quick doctor creation
    const handleQuickCreateDoctor = async () => {
        if (!doctorFirstName.trim() || !doctorLastName.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez remplir tous les champs",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsCreatingDoctor(true);

            // Create doctor with generated email and password
            const response = await axios.post('/api/users', {
                firstName: doctorFirstName.trim(),
                lastName: doctorLastName.trim(),
                email: generatedEmail,
                password: generatedPassword,
                role: 'DOCTOR',
                status: 'ACTIVE'
            });

            toast({
                title: "Succès",
                description: `Docteur créé avec succès\nEmail: ${generatedEmail}`,
            });

            // Reset form
            setDoctorFirstName('');
            setDoctorLastName('');
            setSimilarDoctors([]);
            setShowSimilarDoctors(false);
            setIsQuickDoctorCreateOpen(false);
        } catch (error: any) {
            console.error('Error creating doctor:', error);
            toast({
                title: "Erreur",
                description: error.response?.data?.error || "Erreur lors de la création du docteur",
                variant: "destructive"
            });
        } finally {
            setIsCreatingDoctor(false);
        }
    };

    return (
        <div className="bg-white shadow-md z-10">
            <div className="max-w-full px-4 sm:px-6 tablet:px-8 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left side - Toggle button and page title */}
                    <div className="flex items-center">
                        {onSidebarToggle && (
                            <button
                                onClick={onSidebarToggle}
                                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#16a34a] lg:hidden"
                            >
                                <span className="sr-only">Open sidebar</span>
                                {sidebarExpanded ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        )}
                        <h1 className="text-xl font-semibold text-[#16a34a] ml-2 lg:ml-0">
                            {getPageTitle()}
                        </h1>
                    </div>

                    {/* Center - Search */}
                    <div className="hidden tablet:flex items-center flex-1 justify-center px-4">
                        <GlobalSearch />
                    </div>

                    {/* Right side - User info, notifications, etc */}
                    {session?.user && (
                        <div className="flex items-center space-x-4">
                            {/* Current date and time */}
                            <div className="hidden tablet-lg:flex flex-col items-end mr-4">
                                <span className="text-sm font-medium text-gray-700">{currentTime ? formatTime(currentTime) : '--:--'}</span>
                                <span className="text-xs text-gray-500">{currentTime ? formatDate(currentTime) : ''}</span>
                            </div>

                            {/* Quick Patient Create Button */}
                            <button
                                onClick={() => setIsQuickCreateOpen(true)}
                                className="p-2 rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                title="Créer patient rapidement"
                            >
                                <UserPlus className="h-5 w-5" />
                            </button>

                            {/* Quick Doctor Create Button */}
                            <button
                                onClick={() => setIsQuickDoctorCreateOpen(true)}
                                className="p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                title="Créer docteur rapidement"
                            >
                                <Stethoscope className="h-5 w-5" />
                            </button>

                            {/* Notifications dropdown */}
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => {
                                        setIsNotificationsOpen(!isNotificationsOpen);
                                        if (!isNotificationsOpen) {
                                            fetchNotifications();
                                        }
                                    }}
                                    className="p-1 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#16a34a] relative"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <Bell className="h-6 w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-[#16a34a] text-xs text-white font-medium  items-center justify-center transform -translate-y-1/4 translate-x-1/4">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications panel */}
                                {isNotificationsOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        <div className="py-2">
                                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                                <button
                                                    onClick={fetchNotifications}
                                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                                                >
                                                    <RotateCw className="h-4 w-4" />
                                                </button>
                                            </div>
                                            
                                            {isLoading ? (
                                                <div className="px-4 py-6 flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#16a34a]"></div>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="max-h-96 overflow-y-auto">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={cn(
                                                                "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0",
                                                                !notification.isRead && "bg-green-50"
                                                            )}
                                                            onClick={async () => {
                                                                markNotificationAsRead(notification.id);

                                                                // Try to extract patient ID from metadata first
                                                                let patientId = notification.metadata?.patientId;

                                                                // If no patientId in metadata, try to extract from actionUrl
                                                                if (!patientId && notification.actionUrl) {
                                                                    // Check for patient URL pattern
                                                                    const patientMatch = notification.actionUrl.match(/patient\/([^\/\?]+)/);
                                                                    if (patientMatch) {
                                                                        patientId = patientMatch[1];
                                                                    }
                                                                    // Check for appointment URL pattern and fetch patient ID
                                                                    else {
                                                                        const appointmentMatch = notification.actionUrl.match(/appointments\/([^\/\?]+)/);
                                                                        if (appointmentMatch) {
                                                                            try {
                                                                                const appointmentId = appointmentMatch[1];
                                                                                const response = await axios.get(`/api/appointments/${appointmentId}`);
                                                                                patientId = response.data.appointment?.patient?.id;
                                                                            } catch (error) {
                                                                                console.error('Error fetching appointment:', error);
                                                                            }
                                                                        }
                                                                        // Check for diagnostic URL pattern
                                                                        else {
                                                                            const diagnosticMatch = notification.actionUrl.match(/diagnostics\/([^\/\?]+)/);
                                                                            if (diagnosticMatch) {
                                                                                try {
                                                                                    const diagnosticId = diagnosticMatch[1];
                                                                                    const response = await axios.get(`/api/diagnostics/${diagnosticId}`);
                                                                                    patientId = response.data.diagnostic?.patientId || response.data.diagnostic?.patient?.id;
                                                                                } catch (error) {
                                                                                    console.error('Error fetching diagnostic:', error);
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                                                // Always redirect to patient details page if we have a patient ID
                                                                if (patientId) {
                                                                    router.push(`/roles/employee/renseignement/patient/${patientId}`);
                                                                    setIsNotificationsOpen(false);
                                                                }
                                                                // Fallback to actionUrl if no patient ID found
                                                                else if (notification.actionUrl && notification.actionUrl !== '#') {
                                                                    router.push(notification.actionUrl);
                                                                    setIsNotificationsOpen(false);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 pt-0.5">
                                                                    {getNotificationIcon(notification.type)}
                                                                </div>
                                                                <div className="ml-3 w-0 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                                                    <p className="mt-1 text-xs text-gray-500">{getRelativeTime(notification.createdAt)}</p>
                                                                </div>
                                                                {!notification.isRead && (
                                                                    <div className="ml-3 flex-shrink-0">
                                                                        <div className="h-2 w-2 rounded-full bg-[#16a34a]"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-6 text-center text-gray-500">
                                                    <p>Aucune notification</p>
                                                </div>
                                            )}
                                            
                                            <div className="px-4 py-2 border-t border-gray-100">
                                                <a 
                                                    href="/roles/employee/notifications" 
                                                    className="block text-center text-sm text-[#16a34a] hover:text-[#15803d] font-medium"
                                                >
                                                    Voir toutes les notifications
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-[#16a34a] text-white">
                                            {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden tablet:flex flex-col items-start">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                                            {session.user.name}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                            {session.user.role === 'EMPLOYEE' ? 'Employé' : session.user.role}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 hidden tablet:block" />
                                </button>

                                {isProfileOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-[#16a34a] to-green-600 text-white font-semibold">
                                                        {session.user.name ? getInitials(session.user.name) : <User className="h-5 w-5" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {session.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {session.user.email}
                                                    </p>
                                                    <div className="flex items-center mt-1">
                                                        <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                                                        <span className="text-xs text-green-600 font-medium">En ligne</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-1">
                                            <a href="/roles/employee/profile" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                                <User className="h-4 w-4 mr-3" />
                                                Mon Profil
                                            </a>
                                        </div>

                                        <div className="border-t border-gray-100 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4 mr-3" />
                                                Se déconnecter
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Patient Creation Dialog */}
            <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-green-600" />
                            Création Rapide de Patient
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quick-name">Nom Complet</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="quick-name"
                                    placeholder="Ex: Ahmed Ben Ali"
                                    value={patientName}
                                    onChange={(e) => {
                                        setPatientName(e.target.value);
                                        setShowSimilarPatients(false);
                                    }}
                                    disabled={isCreating}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleVerifyPatient}
                                    disabled={isVerifying || isCreating || !patientName.trim()}
                                    className="shrink-0"
                                >
                                    {isVerifying ? 'Vérification...' : 'Vérifier'}
                                </Button>
                            </div>
                        </div>

                        {/* Similar Patients Alert */}
                        {showSimilarPatients && similarPatients.length > 0 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Patients similaires trouvés ({similarPatients.length})</span>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {similarPatients.map((patient) => (
                                        <div key={patient.id} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                                                {patient.telephone && <span className="ml-2 text-yellow-600">• {patient.telephone}</span>}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={() => router.push(`/roles/employee/renseignement/patient/${patient.id}`)}
                                            >
                                                Voir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-yellow-700">
                                    ⚠️ Vérifiez que ce patient n'existe pas déjà avant de continuer
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="quick-phone">Téléphone</Label>
                            <Input
                                id="quick-phone"
                                placeholder="Ex: 22123456"
                                value={patientPhone}
                                onChange={(e) => setPatientPhone(e.target.value)}
                                disabled={isCreating}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Le patient sera automatiquement assigné à vous en tant que technicien
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsQuickCreateOpen(false);
                                setPatientName('');
                                setPatientPhone('');
                                setSimilarPatients([]);
                                setShowSimilarPatients(false);
                            }}
                            disabled={isCreating}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleQuickCreatePatient}
                            disabled={isCreating}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isCreating ? 'Création...' : 'Créer Patient'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Doctor Creation Dialog */}
            <Dialog open={isQuickDoctorCreateOpen} onOpenChange={setIsQuickDoctorCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            Création Rapide de Docteur
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="doctor-firstname">Prénom <span className="text-red-500">*</span></Label>
                                <Input
                                    id="doctor-firstname"
                                    placeholder="Ex: Ahmed"
                                    value={doctorFirstName}
                                    onChange={(e) => {
                                        setDoctorFirstName(e.target.value);
                                        setShowSimilarDoctors(false);
                                    }}
                                    disabled={isCreatingDoctor}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctor-lastname">Nom <span className="text-red-500">*</span></Label>
                                <Input
                                    id="doctor-lastname"
                                    placeholder="Ex: Ben Ali"
                                    value={doctorLastName}
                                    onChange={(e) => {
                                        setDoctorLastName(e.target.value);
                                        setShowSimilarDoctors(false);
                                    }}
                                    disabled={isCreatingDoctor}
                                />
                            </div>
                        </div>

                        {/* Verify button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleVerifyDoctor}
                            disabled={isVerifyingDoctor || isCreatingDoctor || (!doctorFirstName.trim() && !doctorLastName.trim())}
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            {isVerifyingDoctor ? 'Vérification...' : 'Vérifier si le docteur existe'}
                        </Button>

                        {/* Similar Doctors Alert */}
                        {showSimilarDoctors && similarDoctors.length > 0 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Docteurs similaires trouvés ({similarDoctors.length})</span>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {similarDoctors.map((doctor) => (
                                        <div key={doctor.id} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">
                                                    {doctor.firstName || ''} {doctor.lastName || doctor.name || 'Sans nom'}
                                                </span>
                                                {doctor.email && <span className="ml-2 text-yellow-600">• {doctor.email}</span>}
                                                {doctor.speciality && <span className="ml-2 text-yellow-600">• {doctor.speciality}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-yellow-700">
                                    ⚠️ Vérifiez que ce docteur n'existe pas déjà avant de continuer
                                </p>
                            </div>
                        )}

                        {/* Success message when no similar doctors found */}
                        {showSimilarDoctors && similarDoctors.length === 0 && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                                    <span>✓ Aucun docteur similaire trouvé. Vous pouvez créer ce docteur.</span>
                                </div>
                            </div>
                        )}

                        {/* Generated Email (read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="generated-email" className="flex items-center gap-2">
                                Email (généré automatiquement)
                                <span className="text-xs text-gray-500 font-normal">- @elite.com</span>
                            </Label>
                            <Input
                                id="generated-email"
                                value={generatedEmail}
                                readOnly
                                disabled
                                className="bg-gray-50 font-mono text-sm"
                                placeholder="prenom.nom@elite.com"
                            />
                        </div>

                        {/* Generated Password (read-only with show/hide) */}
                        <div className="space-y-2">
                            <Label htmlFor="generated-password" className="flex items-center gap-2">
                                Mot de passe (généré automatiquement)
                                <span className="text-xs text-gray-500 font-normal">- PRENOM-NOM</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="generated-password"
                                    type={showPassword ? "text" : "password"}
                                    value={generatedPassword}
                                    readOnly
                                    disabled
                                    className="bg-gray-50 font-mono text-sm pr-10"
                                    placeholder="PRENOM-NOM"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={!generatedPassword}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Le docteur sera créé avec le rôle DOCTOR et un statut ACTIVE
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsQuickDoctorCreateOpen(false);
                                setDoctorFirstName('');
                                setDoctorLastName('');
                                setSimilarDoctors([]);
                                setShowSimilarDoctors(false);
                                setShowPassword(false);
                            }}
                            disabled={isCreatingDoctor}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleQuickCreateDoctor}
                            disabled={isCreatingDoctor || !doctorFirstName.trim() || !doctorLastName.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isCreatingDoctor ? 'Création...' : 'Créer Docteur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Navbar;
