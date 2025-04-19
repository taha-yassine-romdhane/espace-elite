import React from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from 'lucide-react';

const Navbar: React.FC = () => {
    const { data: session } = useSession();

    // Get user initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-[#1e3a8a]">
                            Elite Medicale Services
                        </h1>
                    </div>
                    {session?.user && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-[#1e3a8a] text-white">
                                        {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[#1e3a8a]">
                                        {session.user.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {session.user.email}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
