import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    BriefcaseMedical,
    SquareActivity,
    Settings,
    HelpCircle,
    Power,
    UserCog,
    ChevronLeft,
    ChevronRight,
    ContactRound,
    CalendarCheck,
    ClipboardCheck,
    Database,
    Wrench,
    Users,
} from 'lucide-react';
import { cn } from "@/lib/utils";
// import { redirect } from 'next/navigation'; // Not needed, using router instead

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    path: string;
};

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { } = useSession();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [lastNavigationTime, setLastNavigationTime] = useState(0);
    
    // Store sidebar state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
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
        localStorage.setItem('sidebarExpanded', String(newState));
    };
    
    // List of problematic route pairs that need hard navigation
    const problematicRoutes = [
        '/roles/admin/renseignement',
        '/roles/admin/appareils'
    ];
    
    // Navigation handler with special handling for problematic routes
    const handleNavigation = useCallback((path: string) => {
        const now = Date.now();
        
        // Prevent navigation if already navigating or if less than 300ms since last navigation
        if (isNavigating || (now - lastNavigationTime < 300)) {
            return;
        }
        
        setLastNavigationTime(now);
        
        // Check if current path is in the problematic routes list
        const currentPathIsProblematic = problematicRoutes.includes(router.pathname);
        
        // If navigating FROM a problematic route, always use hard navigation
        // This ensures clean navigation both between problematic routes and from problematic routes to other pages
        if (currentPathIsProblematic) {
            console.log('Using hard navigation from problematic route');
            window.location.href = path; // Force hard reload
        } else {
            // Use normal Next.js navigation for other routes
            router.push(path);
        }
    }, [isNavigating, lastNavigationTime, router]);

    const menuItems: MenuItem[] = [
        { icon: <LayoutDashboard size={20} />, label: "Accueil", path: "/roles/admin/dashboard" },
        { icon: <CalendarCheck size={20} />, label: "Gestion des taches", path: "/roles/admin/tasks" },
        { icon: <ClipboardCheck size={20} />, label: "Gestion des Notifications", path: "/roles/admin/notifications" },
        { icon: <SquareActivity size={20} />, label: "Diagnostique", path: "/roles/admin/diagnostic" },
        { icon: <ContactRound size={20} />, label: "Utilisateurs", path: "/roles/admin/users" },
        { icon: <UserCog size={20} />, label: "Espace Technicien", path: "/roles/admin/espace-technicien" },
        { icon: <Users size={20} />, label: "Renseignement", path: "/roles/admin/renseignement" },
        { icon: <BriefcaseMedical size={20} />, label: "Gestion des Produits", path: "/roles/admin/appareils" },
        { icon: <Wrench size={20} />, label: "Gestion des Reparateurs", path: "/roles/admin/reparateur" },
        { icon: <Database size={20} />, label: "Gestion des Stock", path: "/roles/admin/stock" },
        { icon: <HelpCircle size={20} />, label: "Help", path: "/roles/admin/help" },
        { icon: <Settings size={20} />, label: "Settings", path: "/roles/admin/settings" },
    ];

    return (
        <div 
            className={`flex flex-col h-full bg-white shadow-md transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} relative`}
        >
            {/* Header with Logo and Toggle Button */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                {isExpanded ? (
                    <div className="flex-1 flex justify-center">
                        <Image
                            src="/logo_No_BG.png"
                            alt="Elite Santé Logo"
                            width={150}
                            height={60}
                            priority
                            className="object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center mx-auto">
                        <Image
                            src="/logo_No_BG.png"
                            alt="Elite Santé Icon"
                            width={40}
                            height={40}
                            priority
                        />
                    </div>
                )}
            </div>
            
            {/* Toggle Button */}
            <button 
                onClick={toggleSidebar}
                className="absolute -right-4 top-20 bg-white rounded-full p-1.5 shadow-md border border-gray-200 text-blue-900 hover:bg-blue-50 transition-colors z-10"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
                {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            {/* Use onClick instead of Link for better control */}
                            <div 
                                onClick={() => handleNavigation(item.path)}
                                className={cn(
                                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                                    router.pathname === item.path
                                        ? "bg-[#1e3a8a] text-white"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#1e3a8a]"
                                )}
                            >
                                <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}>{item.icon}</span>
                                {isExpanded && <span>{item.label}</span>}
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
                            signOut({ callbackUrl: '/welcome' });
                        }
                    }}
                    className="flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#1e3a8a] transition-colors"
                    disabled={isNavigating}
                >
                    <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}><Power size={20} /></span>
                    {isExpanded && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;