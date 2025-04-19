import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Clipboard,
    Box,
    Users,
    User,
    BriefcaseMedical,
    SquareActivity,
    Bell,
    Settings,
    HelpCircle,
    Power,
    UserCog,
    Building,
    ChevronLeft,
    ChevronRight,
    Menu,
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
    const { data: session } = useSession();
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Store sidebar state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
        if (savedState !== null) {
            setIsExpanded(savedState === 'true');
        }
    }, []);
    
    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('sidebarExpanded', String(newState));
    };

    const menuItems: MenuItem[] = [
        { icon: <LayoutDashboard size={20} />, label: "Accueil", path: "/roles/admin/dashboard" },
        { icon: <Clipboard size={20} />, label: "Gestion des taches", path: "/roles/admin/tasks" },
        { icon: <Box size={20} />, label: "Gestion des Stock", path: "/roles/admin/stock" },
        { icon: <Bell size={20} />, label: "Gestion des Notifications", path: "/roles/admin/notifications" },
        { icon: <Users size={20} />, label: "Utilisateurs", path: "/roles/admin/users" },
        { icon: <UserCog size={20} />, label: "Espace Technicien", path: "/roles/admin/espace-technicien" },
        { icon: <User size={20} />, label: "Renseignement", path: "/roles/admin/renseignement" },
        { icon: <BriefcaseMedical size={20} />, label: "Gestion des Produits", path: "/roles/admin/appareils" },
        { icon: <SquareActivity size={20} />, label: "Diagnostique", path: "/roles/admin/diagnostic" },
        { icon: <Building size={20} />, label: "Gestion des Reparateurs", path: "/roles/admin/reparateur" },
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
                            <Link href={item.path} passHref>
                                <div className={cn(
                                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                                    router.pathname === item.path
                                        ? "bg-[#1e3a8a] text-white"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#1e3a8a]"
                                )}>
                                    <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}>{item.icon}</span>
                                    {isExpanded && <span>{item.label}</span>}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100">
                <button
                    onClick={() => signOut({ callbackUrl: '/welcome' })}
                    className="flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#1e3a8a] transition-colors"
                >
                    <span className={`${isExpanded ? 'mr-3' : 'mx-auto'}`}><Power size={20} /></span>
                    {isExpanded && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;