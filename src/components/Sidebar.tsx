import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
    BarChart2,
    Clipboard,
    Box,
    Users,
    Info,
    User,
    BriefcaseMedical,
    Search,
    Settings,
    HelpCircle,
    Power,
    Package,
    ClipboardList,
} from 'lucide-react';

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    path: string;
};

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();

    const menuItems: MenuItem[] = [
        { icon: <BarChart2 size={20} />, label: "Accueil", path: "/dashboard" },
        { icon: <Clipboard size={20} />, label: "Gestion des taches", path: "/tasks" },
        { icon: <Box size={20} />, label: "Gestion des Stock", path: "/stock" },
        { icon: <Users size={20} />, label: "Utilisateurs", path: "/users" },
        { icon: <Info size={20} />, label: "Renseignement", path: "/renseignement" },
        { icon: <User size={20} />, label: "Medecin", path: "/doctors" },
        { icon: <BriefcaseMedical size={20} />, label: "Appareil", path: "/appareils" },
        { icon: <Search size={20} />, label: "Diagnostique", path: "/diagnostic" },
        { icon: <Package size={20} />, label: "Pieces de Rechange", path: "/spare-parts" },
        { icon: <ClipboardList size={20} />, label: "Accessoire", path: "/accessories" },
        { icon: <HelpCircle size={20} />, label: "Help", path: "/help" },
        { icon: <Settings size={20} />, label: "Settings", path: "/settings" },
    ];

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 rounded-sm shadow-md">
            {/* Header */}
            <div className="p-6 bg-white rounded-sm ">
                <h1 className="text-2xl font-bold text-gray-900">Elite Santé</h1>
                {session?.user && (
                    <div className="mt-2 text-sm text-gray-500">
                        {session.user.name}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="space-y-1 p-4">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link href={item.path} passHref>
                                <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer
                                    ${router.pathname === item.path
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="mr-3 text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => signOut()}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    <span className="mr-3"><Power size={20} /></span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;