import React from 'react';
import Sidebar from './AdminSidebar';
import Navbar from './AdminNavbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();

  // List of public paths that don't need authentication or sidebar
  const publicPaths = ['/welcome', '/auth/signin', '/auth/signup'];

  // Handle authentication and routing
  React.useEffect(() => {
    if (status === 'unauthenticated' && !publicPaths.includes(router.pathname)) {
      router.push('/auth/signin');
    }
  }, [status, router, router.pathname]);

  // Render layout based on path
  if (publicPaths.includes(router.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;