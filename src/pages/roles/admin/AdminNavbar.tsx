import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    User,
    Bell,
    Settings,
    LogOut,
    ChevronDown,
    Calendar,
    HelpCircle,
    Link,
    AlertCircle,
    RotateCw,
    Users,
    ContactRound,
    UserPlus,
    Stethoscope,
    Eye,
    EyeOff,
    Search,
    X
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NavbarProps {
    // Props kept for backwards compatibility but no longer used
    // Mobile sidebar is now handled by the sidebar component itself
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

const Navbar: React.FC<NavbarProps> = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Quick patient creation dialog state - MUST be before useQuery hooks that reference it
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [similarPatients, setSimilarPatients] = useState<any[]>([]);
    const [showSimilarPatients, setShowSimilarPatients] = useState(false);
    const [selectedTechnicien, setSelectedTechnicien] = useState<string>('');
    const [selectedSuperviseur, setSelectedSuperviseur] = useState<string>('');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');

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

    const companyName = settings?.companyName || "Entreprise";

    // Fetch employees for patient creation
    const { data: employeesData } = useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const response = await axios.get('/api/users/list', {
                params: { role: 'EMPLOYEE' }
            });
            return response.data.users || [];
        },
        enabled: isQuickCreateOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch doctors for patient creation
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors-list'],
        queryFn: async () => {
            const response = await axios.get('/api/users/list', {
                params: { role: 'DOCTOR' }
            });
            return response.data.users || [];
        },
        enabled: isQuickCreateOpen,
        staleTime: 5 * 60 * 1000,
    });

    const employees = employeesData || [];
    const doctors = doctorsData || [];

    // Doctor selection dialog
    const [isDoctorSelectOpen, setIsDoctorSelectOpen] = useState(false);
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');

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
        const titleMap: { [key: string]: string } = {
            '/roles/admin/dashboard': 'Tableau de Bord',
            '/roles/admin/tasks': 'Gestion des Tâches',
            '/roles/admin/info-step': 'Info des Steps',
            '/roles/admin/users': 'Utilisateurs',
            '/roles/admin/espace-technicien': 'Espace Technicien',
            '/roles/admin/renseignement': 'Renseignement',
            '/roles/admin/appareils': 'Gestion des Produits',
            '/roles/admin/reparateur': 'Gestion des Réparateurs',
            '/roles/admin/stock': 'Gestion des Stock',
            '/roles/admin/help': 'Aide',
            '/roles/admin/settings': 'Paramètres',
        };
        return titleMap[path] || companyName;
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'FOLLOW_UP':
                return <Calendar className="h-4 w-4" />;
            case 'MAINTENANCE':
                return <Settings className="h-4 w-4" />;
            case 'APPOINTMENT':
                return <Calendar className="h-4 w-4" />;
            case 'PAYMENT_DUE':
                return <AlertCircle className="h-4 w-4" />;
            case 'TRANSFER':
                return <Link className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    // Format relative time for notifications
    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
        } catch (error) {
            return 'récemment';
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
            minute: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
                description: "Veuillez remplir le nom et le téléphone",
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

            // Use selected technicien or fallback to current user
            formData.append('technicienResponsable', selectedTechnicien || session?.user.id || '');

            // Add superviseur if selected
            if (selectedSuperviseur) {
                formData.append('superviseur', selectedSuperviseur);
            }

            // Add doctor if selected
            if (selectedDoctor) {
                formData.append('medecinPrescripteur', selectedDoctor);
            }

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
            setSelectedTechnicien('');
            setSelectedSuperviseur('');
            setSelectedDoctor('');
            setDoctorSearchTerm('');
            setIsQuickCreateOpen(false);

            // Optionally navigate to patient details
            if (response.data.id) {
                router.push(`/roles/admin/renseignement/patient/${response.data.id}`);
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

            // Invalidate doctors query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['doctors-list'] });

            // Auto-select the newly created doctor if we have the response
            if (response.data?.id) {
                setSelectedDoctor(response.data.id);
            }

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
        <div className="bg-white border-b border-gray-100 shadow-md relative z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4 ml-14 md:ml-0">
                        {/* Page Title & Breadcrumb */}
                        <div className="flex flex-col">
                            <h1 className="text-lg font-semibold text-[#1e3a8a] leading-tight">
                                {getPageTitle()}
                            </h1>
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                                <span>{companyName}</span>
                                <span>•</span>
                                <span className="font-medium">{currentTime ? formatTime(currentTime) : '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Center Section - Global Search & Quick Access Buttons */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center gap-3">
                        <GlobalSearch />

                        {/* Quick Access Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/roles/admin/renseignement')}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                title="Renseignement"
                            >
                                <Users className="h-5 w-5" />
                                <span className="hidden lg:inline">Renseignement</span>
                            </button>
                            <button
                                onClick={() => router.push('/roles/admin/users')}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                title="Utilisateurs"
                            >
                                <ContactRound className="h-5 w-5" />
                                <span className="hidden lg:inline">Utilisateurs</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        {/* Current Date */}
                        <div className="hidden lg:block text-right">
                            <div className="text-xs text-gray-500">{currentTime ? formatDate(currentTime) : ''}</div>
                            <div className="text-sm font-medium text-[#1e3a8a]">{currentTime ? formatTime(currentTime) : '--:--'}</div>
                        </div>

                        {/* Quick Patient Create Button */}
                        <button
                            onClick={() => setIsQuickCreateOpen(true)}
                            className="p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            title="Créer patient rapidement"
                        >
                            <UserPlus className="h-5 w-5" />
                        </button>

                        {/* Quick Doctor Create Button */}
                        <button
                            onClick={() => setIsQuickDoctorCreateOpen(true)}
                            className="p-2 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            title="Créer docteur rapidement"
                        >
                            <Stethoscope className="h-5 w-5" />
                        </button>

                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 rounded-lg text-gray-600 hover:text-[#1e3a8a] hover:bg-gray-50 transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-[38rem] max-w-[95vw] bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                            <span className="text-xs text-gray-500">{unreadCount} non lues</span>
                                        </div>
                                        <button
                                            className="p-1 rounded hover:bg-blue-100 transition-colors"
                                            title="Rafraîchir"
                                            onClick={fetchNotifications}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <span className="inline-block h-5 w-5 align-middle">
                                                    <svg className="animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                    </svg>
                                                </span>
                                            ) : (
                                                <RotateCw className="h-5 w-5 text-blue-600" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="max-h-[32rem] overflow-y-auto divide-y divide-gray-100">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-gray-500">
                                                <Bell className="h-5 w-5 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Aucune notification</p>
                                            </div>
                                        ) : (
                                            // Sort: unread first, then read; both by date desc
                                            [...notifications].sort((a, b) => {
                                                if (a.isRead === b.isRead) {
                                                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                                }
                                                return a.isRead ? 1 : -1;
                                            }).map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={cn(
                                                        "px-4 py-3 flex gap-3 items-start cursor-pointer border-l-4 transition-colors group",
                                                        !notification.isRead
                                                            ? "border-l-blue-500 bg-blue-50/40 hover:bg-blue-100/60"
                                                            : "border-l-transparent hover:bg-gray-50"
                                                    )}
                                                    onClick={() => {
                                                        markNotificationAsRead(notification.id);
                                                        if (notification.actionUrl && notification.actionUrl !== '#') {
                                                            router.push(notification.actionUrl);
                                                            setIsNotificationsOpen(false);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className="p-1 bg-blue-100 rounded-full text-blue-600">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className={cn("text-sm font-medium truncate", !notification.isRead ? "text-blue-900" : "text-gray-900")}>{notification.title}</p>
                                                            <span className="text-xs text-gray-500 ml-2">{getRelativeTime(notification.createdAt)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                        {notification.isRead && (
                                                            <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">Lu</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
                        {session?.user && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-[#1e3a8a] to-blue-600 text-white font-semibold">
                                            {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start">
                                        <span className="text-sm font-medium text-gray-900 leading-tight">
                                            {session.user.name}
                                        </span>
                                        <span className="text-xs text-gray-500 leading-tight">
                                            Administrateur
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-[#1e3a8a] to-blue-600 text-white font-semibold">
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
                                            <a href="/roles/admin/profile" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                <User className="h-4 w-4 mr-3" />
                                                Mon Profil
                                            </a>
                                            <a href="/roles/admin/settings" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Settings className="h-4 w-4 mr-3" />
                                                Paramètres
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
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Patient Creation Dialog */}
            <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            Création Rapide de Patient
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quick-name">Nom Complet <span className="text-red-500">*</span></Label>
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
                                                onClick={() => router.push(`/roles/admin/renseignement/patient/${patient.id}`)}
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
                            <Label htmlFor="quick-phone">Téléphone <span className="text-red-500">*</span></Label>
                            <Input
                                id="quick-phone"
                                placeholder="Ex: 22123456"
                                value={patientPhone}
                                onChange={(e) => setPatientPhone(e.target.value)}
                                disabled={isCreating}
                            />
                        </div>

                        {/* Technicien Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="quick-technicien">Technicien Responsable</Label>
                            <Select
                                value={selectedTechnicien}
                                onValueChange={setSelectedTechnicien}
                                disabled={isCreating}
                            >
                                <SelectTrigger id="quick-technicien">
                                    <SelectValue placeholder="Sélectionner un technicien" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee: any) => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                            {employee.firstName || ''} {employee.lastName || employee.name || 'Sans nom'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Superviseur Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="quick-superviseur">Superviseur</Label>
                            <Select
                                value={selectedSuperviseur}
                                onValueChange={setSelectedSuperviseur}
                                disabled={isCreating}
                            >
                                <SelectTrigger id="quick-superviseur">
                                    <SelectValue placeholder="Sélectionner un superviseur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee: any) => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                            {employee.firstName || ''} {employee.lastName || employee.name || 'Sans nom'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Doctor Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="quick-doctor">Docteur Prescripteur</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDoctorSelectOpen(true)}
                                    disabled={isCreating}
                                    className="flex-1 justify-start text-left font-normal"
                                >
                                    <Stethoscope className="h-4 w-4 mr-2 text-indigo-600" />
                                    {selectedDoctor ? (
                                        <span className="truncate">
                                            {doctors.find((d: any) => d.id === selectedDoctor)?.firstName || ''}{' '}
                                            {doctors.find((d: any) => d.id === selectedDoctor)?.lastName ||
                                             doctors.find((d: any) => d.id === selectedDoctor)?.name || 'Docteur sélectionné'}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Sélectionner un docteur...</span>
                                    )}
                                </Button>
                                {selectedDoctor && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedDoctor('')}
                                        disabled={isCreating}
                                        className="shrink-0 text-gray-400 hover:text-red-500"
                                        title="Effacer la sélection"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            * Champs obligatoires. Les sélections sont optionnelles et peuvent être complétées plus tard.
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
                                setSelectedTechnicien('');
                                setSelectedSuperviseur('');
                                setSelectedDoctor('');
                                setDoctorSearchTerm('');
                            }}
                            disabled={isCreating}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleQuickCreatePatient}
                            disabled={isCreating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isCreating ? 'Création...' : 'Créer Patient'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Doctor Selection Dialog */}
            <Dialog open={isDoctorSelectOpen} onOpenChange={setIsDoctorSelectOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-indigo-600" />
                            Sélectionner un Docteur
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Rechercher par nom..."
                                value={doctorSearchTerm}
                                onChange={(e) => setDoctorSearchTerm(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                        </div>

                        {/* Doctors List */}
                        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                            {doctors
                                .filter((doctor: any) => {
                                    if (!doctorSearchTerm.trim()) return true;
                                    const search = doctorSearchTerm.toLowerCase();
                                    const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''} ${doctor.name || ''}`.toLowerCase();
                                    const speciality = (doctor.speciality || '').toLowerCase();
                                    return fullName.includes(search) || speciality.includes(search);
                                })
                                .map((doctor: any) => (
                                    <button
                                        key={doctor.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDoctor(doctor.id);
                                            setIsDoctorSelectOpen(false);
                                            setDoctorSearchTerm('');
                                        }}
                                        className={cn(
                                            "w-full p-3 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between",
                                            selectedDoctor === doctor.id && "bg-indigo-100"
                                        )}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {doctor.firstName || ''} {doctor.lastName || doctor.name || 'Sans nom'}
                                            </div>
                                            {doctor.speciality && (
                                                <div className="text-xs text-gray-500">{doctor.speciality}</div>
                                            )}
                                        </div>
                                        {selectedDoctor === doctor.id && (
                                            <span className="text-indigo-600 text-sm font-medium">Sélectionné</span>
                                        )}
                                    </button>
                                ))}
                            {doctors.filter((doctor: any) => {
                                if (!doctorSearchTerm.trim()) return true;
                                const search = doctorSearchTerm.toLowerCase();
                                const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''} ${doctor.name || ''}`.toLowerCase();
                                return fullName.includes(search);
                            }).length === 0 && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Aucun docteur trouvé
                                </div>
                            )}
                        </div>

                        {/* Create New Doctor Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDoctorSelectOpen(false);
                                setIsQuickDoctorCreateOpen(true);
                                setDoctorSearchTerm('');
                            }}
                            className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Créer un nouveau docteur
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Doctor Creation Dialog */}
            <Dialog open={isQuickDoctorCreateOpen} onOpenChange={setIsQuickDoctorCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-indigo-600" />
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
                            className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
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
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={() => router.push(`/roles/admin/users`)}
                                            >
                                                Voir
                                            </Button>
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
                            className="bg-indigo-600 hover:bg-indigo-700"
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