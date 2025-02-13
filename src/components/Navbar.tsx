import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const Navbar: React.FC = () => {
    const { data: session } = useSession();

    return (
        <div className="bg-white  rounded-sm shadow-md p-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Elite Santé Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {session?.user && (
                            <>
                                <Link
                                    href="/profile"
                                    className="text-gray-700 hover:text-gray-900"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="text-gray-700 hover:text-gray-900"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
