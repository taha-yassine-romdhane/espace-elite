import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Users,
    MessageCircle,
    Stethoscope,
    HelpCircle,
    Power,
    ChevronLeft,
    ChevronRight,
    Bell,
    FileText,
    Menu,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type MenuItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
    comingSoon?: boolean;
};

const DoctorSidebar: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [lastNavigationTime, setLastNavigationTime] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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

    // Default menu items with unique IDs for doctor dashboard
    const defaultMenuItems: MenuItem[] = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: "Tableau de Bord", path: "/roles/doctor/dashboard" },
        { id: 'patients', icon: <Users size={20} />, label: "Mes Patients", path: "/roles/doctor/patients" },
        { id: 'diagnostics', icon: <Stethoscope size={20} />, label: "Diagnostics", path: "/roles/doctor/diagnostics" },
        { id: 'reports', icon: <FileText size={20} />, label: "Rapports", path: "/roles/doctor/reports", comingSoon: true },
        { id: 'notifications', icon: <Bell size={20} />, label: "Notifications", path: "/roles/doctor/notifications" },
        { id: 'chat', icon: <MessageCircle size={20} />, label: "Messages", path: "/roles/doctor/chat" },
        { id: 'help', icon: <HelpCircle size={20} />, label: "Aide & Support", path: "/roles/doctor/help" },
    ];

    // Store sidebar state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('doctorSidebarExpanded');
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
        localStorage.setItem('doctorSidebarExpanded', String(newState));
    };

    // Navigation handler
    const handleNavigation = useCallback((path: string, comingSoon?: boolean) => {
        if (comingSoon) return; // Prevent navigation for coming soon items

        const now = Date.now();

        // Prevent navigation if already navigating or if less than 300ms since last navigation
        if (isNavigating || (now - lastNavigationTime < 300)) {
            return;
        }

        setLastNavigationTime(now);
        setIsMobileMenuOpen(false); // Close mobile menu on navigation
        router.push(path);
    }, [isNavigating, lastNavigationTime, router]);

    // Mobile Menu Content
    const MobileMenuContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-red-100 flex justify-center items-center">
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
                <ul className="space-y-1 px-2">
                    {defaultMenuItems.map((item) => (
                        <li key={item.id}>
                            <div
                                onClick={() => handleNavigation(item.path, item.comingSoon)}
                                className={cn(
                                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                    item.comingSoon
                                        ? "cursor-not-allowed opacity-60"
                                        : "cursor-pointer",
                                    !item.comingSoon && (router.pathname === item.path || router.asPath === item.path)
                                        ? "bg-red-600 text-white shadow-md"
                                        : item.comingSoon
                                        ? "text-gray-500 bg-gray-50"
                                        : "text-gray-700 hover:bg-red-50 hover:text-red-700"
                                )}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <div className="flex items-center justify-between flex-1">
                                    <span>{item.label}</span>
                                    {item.comingSoon && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
                                            Bientôt
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-red-100">
                <button
                    onClick={() => {
                        if (!isNavigating) {
                            setIsMobileMenuOpen(false);
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            signOut({ callbackUrl: `${baseUrl}/welcome` });
                        }
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-700"
                    disabled={isNavigating}
                >
                    <span className="mr-3"><Power size={20} /></span>
                    <span>Déconnexion</span>
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
                    className="fixed top-4 left-4 z-[60] bg-red-600 text-white p-2.5 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
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
            </>
        );
    }

    // Desktop View - Original Sidebar
    return (
        <div
            className={`flex flex-col h-full bg-white shadow-md transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} relative border-r border-red-100`}
        >
            {/* Header with Logo and Toggle Button */}
            <div className="p-4 border-b border-red-100 flex justify-between items-center">
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
                className="absolute -right-4 top-20 bg-white rounded-full p-1.5 shadow-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors z-10"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
                {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {defaultMenuItems.map((item) => (
                        <li key={item.id}>
                            <div
                                onClick={() => handleNavigation(item.path, item.comingSoon)}
                                className={cn(
                                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                    item.comingSoon
                                        ? "cursor-not-allowed opacity-60"
                                        : "cursor-pointer",
                                    !item.comingSoon && (router.pathname === item.path || router.asPath === item.path)
                                        ? "bg-red-600 text-white shadow-md"
                                        : item.comingSoon
                                        ? "text-gray-500 bg-gray-50"
                                        : "text-gray-700 hover:bg-red-50 hover:text-red-700"
                                )}
                            >
                                <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}>
                                    {item.icon}
                                </span>
                                {isExpanded && (
                                    <div className="flex items-center justify-between flex-1">
                                        <span>{item.label}</span>
                                        {item.comingSoon && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
                                                Bientôt
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-red-100">
                <button
                    onClick={() => {
                        // Prevent multiple rapid logout attempts
                        if (!isNavigating) {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            signOut({ callbackUrl: `${baseUrl}/welcome` });
                        }
                    }}
                    className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-700"
                    disabled={isNavigating}
                >
                    <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}><Power size={20} /></span>
                    {isExpanded && <span>Déconnexion</span>}
                </button>
            </div>
        </div>
    );
};

export default DoctorSidebar;