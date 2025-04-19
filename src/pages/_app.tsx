import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from '@/pages/roles/admin/AdminLayout';
import { Toaster } from "@/components/ui/toaster";
import '@/styles/globals.css';
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';

const queryClient = new QueryClient();

// Add layout support
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
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
        {getLayout(<Component {...pageProps} />)}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}