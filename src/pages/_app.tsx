import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from '@/pages/roles/admin/AdminLayout';
import { Toaster } from "@/components/ui/toaster";
import '@/styles/globals.css';
import { NextPage } from 'next';
import { ReactElement, ReactNode, useEffect } from 'react';
import SEO from '@/components/layout/SEO';
import Head from 'next/head';
import { Session } from 'next-auth';
import { useRouter } from 'next/router';

// Configure QueryClient with more aggressive cache invalidation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shorter staleTime for faster invalidation
      staleTime: 10 * 1000, // 10 seconds
      // Don't retry failed queries to avoid hanging
      retry: false,
      // Disable caching by default - use gcTime instead of cacheTime (updated property name)
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Add layout support
export type NextPageWithLayout<P = {session: Session}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Navigation state management - improved for production compatibility
function NavigationEvents() {
  const router = useRouter();
  
  useEffect(() => {
    // Variable to track if navigation is in progress
    let isNavigating = false;
    let navigationTimeout: NodeJS.Timeout;
    
    // Routes that need cache clearing on navigation
    const cacheSensitiveRoutes = [
      '/roles/admin/renseignement',
      '/roles/admin/appareils'
    ];
    
    const handleStart = (url: string) => {
      // Clear any existing timeout
      if (navigationTimeout) clearTimeout(navigationTimeout);
      
      // Parse the URL to get just the pathname
      const targetPath = new URL(url, window.location.origin).pathname;
      
      // Check if this is a cache-sensitive route
      if (cacheSensitiveRoutes.includes(targetPath)) {
        // Clear query cache for sensitive routes
        queryClient.clear();
      }
      
      // Set navigating state
      isNavigating = true;
      
      // Set a timeout to reset the state if navigation takes too long
      navigationTimeout = setTimeout(() => {
        isNavigating = false;
      }, 5000); // 5 seconds timeout
    };
    
    const handleComplete = (url: string) => {
      // Clear timeout and reset state
      if (navigationTimeout) clearTimeout(navigationTimeout);
      isNavigating = false;
    };
    
    // Add event listeners
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete); // Also reset on error
    
    // Clean up event listeners
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [router]);
  
  return null;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  // Use the router pathname as a key to force complete re-renders on route changes
  const router = useRouter();
  
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <link rel="icon" href="/health-icon.svg" type="image/svg+xml" />
          <link rel="manifest" href="/site.webmanifest" type="application/manifest+json" />
          <meta name="theme-color" content="#1E88E5" />
        </Head>
        <SEO />
        <NavigationEvents />
        {getLayout(<Component key={router.pathname} {...pageProps} />)}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}