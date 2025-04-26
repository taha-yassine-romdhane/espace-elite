import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from '@/pages/roles/admin/AdminLayout';
import { Toaster } from "@/components/ui/toaster";
import '@/styles/globals.css';
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';
import SEO from '@/components/layout/SEO';
import Head from 'next/head';
import { Session } from 'next-auth';

const queryClient = new QueryClient();

// Add layout support
export type NextPageWithLayout<P = {session: Session}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

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
        {getLayout(<Component {...pageProps} />)}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}