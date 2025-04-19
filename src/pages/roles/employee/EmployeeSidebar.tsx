import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
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
} from 'lucide-react';
import { cn } from "@/lib/utils";

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    path: string;
};

const Sidebar: React.FC = () => {
    const router = useRouter();


    const menuItems: MenuItem[] = [
        { icon: <LayoutDashboard size={20} />, label: "Tableau de Bord", path: "/roles/employee" },
        { icon: <Clipboard size={20} />, label: "Tâches", path: "/roles/employee/tasks" },
        { icon: <Box size={20} />, label: "Inventaire", path: "/roles/employee/inventory" },
        { icon: <Bell size={20} />, label: "Notifications", path: "/roles/employee/notifications" },
        { icon: <Users size={20} />, label: "Renseignement", path: "/roles/employee/renseignement" },
        { icon: <BriefcaseMedical size={20} />, label: "Appareils", path: "/roles/employee/appareils" },
        { icon: <SquareActivity size={20} />, label: "Diagnostique", path: "/roles/employee/diagnostic" },
        { icon: <User size={20} />, label: "Profil", path: "/roles/employee/profile" },
        { icon: <HelpCircle size={20} />, label: "Aide", path: "/roles/employee/help" },
        { icon: <Settings size={20} />, label: "Paramètres", path: "/roles/employee/settings" },
    ];

    return (
        <div className="flex flex-col h-full bg-white shadow-md">
            {/* Header with Logo */}
            <div className="p-6 border-b border-gray-100 flex justify-center items-center">
                <Image
                    src="/logo_No_BG.png"
                    alt="Elite Santé Logo"
                    width={150}
                    height={60}
                    priority
                    className="object-contain"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link href={item.path} passHref>
                                <div className={cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                                    router.pathname === item.path
                                        ? "bg-[#16a34a] text-white"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#16a34a]"
                                )}>
                                    <span className="mr-3">{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => signOut({ callbackUrl: '/welcome' })}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#16a34a] transition-colors"
                >
                    <span className="mr-3"><Power size={20} /></span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;