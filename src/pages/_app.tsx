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

// Navigation state management
function NavigationEvents() {
  const router = useRouter();
  
  useEffect(() => {
    // Variable to track if navigation is in progress
    let isNavigating = false;
    let navigationTimeout: NodeJS.Timeout;
    
    // Problematic route pairs that need special handling
    const problematicRoutePairs = [
      // Add specific route pairs that have navigation issues
      ['/roles/admin/renseignement', '/roles/admin/appareils'],
      ['/roles/admin/appareils', '/roles/admin/renseignement']
    ];
    
    // Check if navigation is between problematic routes
    const isProblematicNavigation = (from: string, to: string) => {
      return problematicRoutePairs.some(pair => 
        (pair[0] === from && pair[1] === to) || 
        (pair[0] === to && pair[1] === from)
      );
    };
    
    const handleStart = (url: string) => {
      // Clear any existing timeout
      if (navigationTimeout) clearTimeout(navigationTimeout);
      
      // Parse the URL to get just the pathname
      const targetPath = new URL(url, window.location.origin).pathname;
      const currentPath = router.pathname;
      
      // Check if this is a problematic navigation
      if (isProblematicNavigation(currentPath, targetPath)) {
        // For problematic routes, clear all query cache
        queryClient.clear();
      }
      
      // Set navigating state
      isNavigating = true;
      
      // Set a timeout to reset the state if navigation takes too long
      navigationTimeout = setTimeout(() => {
        isNavigating = false;
        
        // If still on the same page after timeout, force reload
        if (router.pathname === currentPath && isProblematicNavigation(currentPath, targetPath)) {
          window.location.href = url; // Force hard reload
        }
      }, 3000); // 3 seconds timeout
    };
    
    const handleComplete = (url: string) => {
      // Clear timeout and reset state
      if (navigationTimeout) clearTimeout(navigationTimeout);
      isNavigating = false;
    };
    
    const handleBeforeHistoryChange = (url: string) => {
      // This event fires right before the URL changes
      // We can use it to ensure the navigation completes
      if (isNavigating) {
        // Force a hard navigation if needed
        // This is a last resort to ensure navigation completes
        if (navigationTimeout) clearTimeout(navigationTimeout);
      }
    };
    
    // Add event listeners
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete); // Also reset on error
    router.events.on('beforeHistoryChange', handleBeforeHistoryChange);
    
    // Clean up event listeners
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
      router.events.off('beforeHistoryChange', handleBeforeHistoryChange);
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
          <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
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