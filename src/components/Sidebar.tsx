import React from 'react';
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
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { redirect } from 'next/navigation';

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    path: string;
};

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();

    const menuItems: MenuItem[] = [
        { icon: <LayoutDashboard size={20} />, label: "Accueil", path: "/dashboard" },
        { icon: <Clipboard size={20} />, label: "Gestion des taches", path: "/tasks" },
        { icon: <Box size={20} />, label: "Gestion des Stock", path: "/stock" },
        { icon: <Bell size={20} />, label: "Gestion des Notifications", path: "/notifications" },
        { icon: <Users size={20} />, label: "Utilisateurs", path: "/users" },
        { icon: <UserCog size={20} />, label: "Espace Technicien", path: "/espace-technicien" },
        { icon: <User size={20} />, label: "Renseignement", path: "/renseignement" },
        { icon: <BriefcaseMedical size={20} />, label: "Gestion des Produits", path: "/appareils" },
        { icon: <SquareActivity size={20} />, label: "Diagnostique", path: "/diagnostic" },
        { icon: <Building size={20} />, label: "Gestion des Reparateurs", path: "/reparateur" },
        { icon: <HelpCircle size={20} />, label: "Help", path: "/help" },
        { icon: <Settings size={20} />, label: "Settings", path: "/settings" },
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
                                        ? "bg-[#1e3a8a] text-white"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#1e3a8a]"
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
                    onClick={() => signOut().then(() => redirect('/welcome'))}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#1e3a8a] transition-colors"
                >
                    <span className="mr-3"><Power size={20} /></span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;