import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Box,
    Users,
    SquareActivity,
    Bell,
    Power,
    History,
    ShoppingCart,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Calendar,
    MapPin,
    ListTodo,
    Menu,
    Zap,
    Stethoscope,
    Building2,
    FileText,
    ChevronDown,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CreateAppointmentDialog } from "@/components/appointments/CreateAppointmentDialog";
import { CreateDiagnosticDialog } from "@/components/diagnostics/CreateDiagnosticDialog";
import { CompleteDiagnosticDialog } from "@/components/diagnostics/CompleteDiagnosticDialog";
import { CreateSaleDialog } from "@/components/sales/CreateSaleDialog";
import { RentalCreationDialog } from "@/components/dialogs/RentalCreationDialog";

type MenuItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
};

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [lastNavigationTime, setLastNavigationTime] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Quick actions states
    const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
    const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);
    const [completeDiagnosticDialogOpen, setCompleteDiagnosticDialogOpen] = useState(false);
    const [saleDialogOpen, setSaleDialogOpen] = useState(false);
    const [rentalDialogOpen, setRentalDialogOpen] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch company logo from settings
    const { data: settings } = useQuery({
        queryKey: ['general-settings'],
        queryFn: async () => {
            const response = await fetch('/api/settings/general');
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!session?.user,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const companyLogo = settings?.companyLogo;

    // Default menu items with unique IDs
    const defaultMenuItems: MenuItem[] = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: "Tableau de Bord", path: "/roles/employee/dashboard" },
        { id: 'rdv', icon: <Calendar size={20} />, label: "Rendez-vous", path: "/roles/employee/appointments" },
        { id: 'manual-tasks', icon: <ListTodo size={20} />, label: "Mes Tâches", path: "/roles/employee/manual-tasks" },
        { id: 'renseignement', icon: <Users size={20} />, label: "Renseignement", path: "/roles/employee/renseignement" },
        { id: 'diagnostics', icon: <SquareActivity size={20} />, label: "Polygraphie", path: "/roles/employee/diagnostics" },
        { id: 'sales', icon: <ShoppingCart size={20} />, label: "Vente", path: "/roles/employee/sales" },
        { id: 'location', icon: <CalendarClock size={20} />, label: "Locations", path: "/roles/employee/location" },
        { id: 'calendar', icon: <Calendar size={20} />, label: "Calendrier", path: "/roles/employee/calendar" },
        { id: 'stock', icon: <Box size={20} />, label: "Stock", path: "/roles/employee/stock" },
        { id: 'map', icon: <MapPin size={20} />, label: "Carte", path: "/roles/employee/map" },
        { id: 'chat', icon: <MessageCircle size={20} />, label: "Messages", path: "/roles/employee/chat" },
        { id: 'history', icon: <History size={20} />, label: "Historique", path: "/roles/employee/history" },
    ];

    // Store sidebar state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('employeeSidebarExpanded');
        if (savedState !== null) {
            setIsExpanded(savedState === 'true');
        }
    }, []);

    // Handle router events to track navigation state
    useEffect(() => {
        const handleRouteChangeStart = () => {
            setIsNavigating(true);
        };

        const handleRouteChangeComplete = () => {
            setIsNavigating(false);
        };

        const handleRouteChangeError = () => {
            setIsNavigating(false);
        };

        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeComplete);
        router.events.on('routeChangeError', handleRouteChangeError);

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeComplete);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router]);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('employeeSidebarExpanded', String(newState));
    };

    // Navigation handler with debounce to prevent double clicks
    const handleNavigation = useCallback((path: string) => {
        const now = Date.now();
        if (now - lastNavigationTime < 500 || isNavigating) {
            return; // Prevent navigation if already navigating or clicked recently
        }

        setLastNavigationTime(now);
        setIsMobileMenuOpen(false); // Close mobile menu on navigation
        router.push(path);
    }, [lastNavigationTime, isNavigating, router]);

    // Quick action handler - closes menu and opens dialog
    const handleQuickAction = (openDialog: () => void) => {
        setIsMobileMenuOpen(false);
        // Small delay to let the sheet close smoothly
        setTimeout(() => {
            openDialog();
        }, 150);
    };

    // Mobile Menu Content
    const MobileMenuContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-gray-100 flex justify-center items-center">
                {companyLogo ? (
                    <Image
                        src={companyLogo}
                        alt="Logo de l'entreprise"
                        width={120}
                        height={48}
                        priority
                        className="object-contain h-auto"
                        unoptimized={companyLogo.startsWith('/uploads-public/') || companyLogo.startsWith('/imports/')}
                    />
                ) : (
                    <div className="text-center text-xs text-gray-400 italic">
                        Logo non téléchargé
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2">
                {/* Quick Actions Section */}
                <div className="px-2 mb-2">
                    <button
                        onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-lg"
                    >
                        <div className="flex items-center">
                            <Zap size={18} className="mr-2" />
                            <span>Actions Rapides</span>
                        </div>
                        <ChevronDown
                            size={18}
                            className={cn(
                                "transition-transform duration-200",
                                quickActionsExpanded ? "rotate-180" : ""
                            )}
                        />
                    </button>

                    {quickActionsExpanded && (
                        <div className="mt-1 space-y-1 pl-2">
                            <button
                                onClick={() => handleQuickAction(() => setAppointmentDialogOpen(true))}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                            >
                                <Calendar size={18} className="mr-3 text-green-600" />
                                <span>Nouveau Rendez-vous</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction(() => setDiagnosticDialogOpen(true))}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                            >
                                <Stethoscope size={18} className="mr-3 text-green-600" />
                                <span>Commencer Diagnostic</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction(() => setCompleteDiagnosticDialogOpen(true))}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                                <FileText size={18} className="mr-3 text-blue-600" />
                                <span>Compléter Résultats</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction(() => setSaleDialogOpen(true))}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                            >
                                <ShoppingCart size={18} className="mr-3 text-green-600" />
                                <span>Commencer une Vente</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction(() => setRentalDialogOpen(true))}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                            >
                                <Building2 size={18} className="mr-3 text-green-600" />
                                <span>Commencer une Location</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="mx-4 my-2 border-t border-gray-200"></div>

                {/* Menu Items */}
                <ul className="space-y-1 px-2">
                    {defaultMenuItems.map((item) => (
                        <li key={item.id}>
                            <div
                                onClick={() => handleNavigation(item.path)}
                                className={cn(
                                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                                    router.pathname.startsWith(item.path)
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                                )}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100">
                <button
                    onClick={() => {
                        if (!isNavigating) {
                            setIsMobileMenuOpen(false);
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            signOut({ callbackUrl: `${baseUrl}/welcome` });
                        }
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-green-50 hover:text-green-600"
                    disabled={isNavigating}
                >
                    <span className="mr-3"><Power size={20} /></span>
                    <span>Se déconnecter</span>
                </button>
            </div>
        </div>
    );

    // Mobile View - Hamburger Button + Sheet
    if (isMobile) {
        return (
            <>
                {/* Fixed Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="fixed top-4 left-4 z-[60] bg-green-600 text-white p-2.5 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={24} />
                </button>

                {/* Mobile Sheet */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetContent side="left" className="w-[280px] p-0 bg-white">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Menu de navigation</SheetTitle>
                        </SheetHeader>
                        <MobileMenuContent />
                    </SheetContent>
                </Sheet>

                {/* Quick Action Dialogs */}
                <CreateAppointmentDialog
                    open={appointmentDialogOpen}
                    onOpenChange={setAppointmentDialogOpen}
                />
                <CreateDiagnosticDialog
                    open={diagnosticDialogOpen}
                    onOpenChange={setDiagnosticDialogOpen}
                />
                <CompleteDiagnosticDialog
                    open={completeDiagnosticDialogOpen}
                    onOpenChange={setCompleteDiagnosticDialogOpen}
                />
                <CreateSaleDialog
                    open={saleDialogOpen}
                    onOpenChange={setSaleDialogOpen}
                />
                <RentalCreationDialog
                    open={rentalDialogOpen}
                    onOpenChange={setRentalDialogOpen}
                />
            </>
        );
    }

    // Desktop View - Original Sidebar
    return (
        <div
            className={`flex flex-col h-full bg-white shadow-md transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} relative`}
        >
            {/* Header with Logo and Toggle Button */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                {isExpanded ? (
                    <div className="flex-1 flex justify-center items-center min-h-[60px]">
                        {companyLogo ? (
                            <Image
                                src={companyLogo}
                                alt="Logo de l'entreprise"
                                width={150}
                                height={60}
                                priority
                                className="object-contain h-auto"
                                unoptimized={companyLogo.startsWith('/uploads-public/') || companyLogo.startsWith('/imports/')}
                            />
                        ) : (
                            <div className="text-center text-xs text-gray-400 italic px-2">
                                Logo non téléchargé
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center mx-auto">
                        {companyLogo ? (
                            <Image
                                src={companyLogo}
                                alt="Logo"
                                width={40}
                                height={40}
                                priority
                                className="object-contain"
                                unoptimized={companyLogo.startsWith('/uploads-public/') || companyLogo.startsWith('/imports/')}
                            />
                        ) : (
                            <div className="text-[10px] text-gray-400 italic text-center leading-tight">
                                Logo
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-4 top-20 bg-white rounded-full p-1.5 shadow-md border border-gray-200 text-green-700 hover:bg-green-50 transition-colors z-10"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
                {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                <ul className="space-y-1 px-2">
                    {defaultMenuItems.map((item) => (
                        <li key={item.id}>
                            <div
                                onClick={() => handleNavigation(item.path)}
                                className={cn(
                                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                                    router.pathname.startsWith(item.path)
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                                )}
                            >
                                <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}>
                                    {item.icon}
                                </span>
                                {isExpanded && <span className="flex-1">{item.label}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100">
                <button
                    onClick={() => {
                        // Prevent multiple rapid logout attempts
                        if (!isNavigating) {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            signOut({ callbackUrl: `${baseUrl}/welcome` });
                        }
                    }}
                    className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-green-50 hover:text-green-600"
                    disabled={isNavigating}
                >
                    <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}><Power size={20} /></span>
                    {isExpanded && <span>Se déconnecter</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;