import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Welcome() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="py-6">
            <nav className="flex justify-between items-center">
              <div className="text-3xl font-bold text-gray-900">Elite Santé</div>
              <div className="space-x-4">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition duration-300"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300"
                >
                  Sign up
                </Link>
              </div>
            </nav>
          </header>

          {/* Hero Section */}
          <main className="mt-16 sm:mt-24">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1>
                  <span className="block text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base">
                    Welcome to
                  </span>
                  <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl text-gray-900">
                    Elite Santé ERP
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  A comprehensive healthcare management system designed to streamline your medical facility's operations. 
                  From patient care to equipment management, we've got you covered.
                </p>
                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                  <p className="text-base font-medium text-gray-900">
                    Key features:
                  </p>
                  <ul className="mt-3 space-y-3 text-gray-500">
                    <li className="flex items-center">
                      <span className="mr-2">🏥</span>
                      Complete patient management
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">📊</span>
                      Real-time analytics and reporting
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🔧</span>
                      Equipment tracking and maintenance
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">👥</span>
                      Staff and role management
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                  <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                    <img
                      className="w-full"
                      src="/welcome.jpg"
                      alt="Dashboard preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24H12.82v-9.294H9.692V10.24h3.128V7.568c0-3.1 1.893-4.788 4.656-4.788 1.324 0 2.462.098 2.795.142v3.24h-1.917c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.466h-3.12V24h6.122c.73 0 1.324-.593 1.324-1.324V1.324C24 .593 23.407 0 22.676 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.949.555-2.005.959-3.127 1.184-.897-.959-2.178-1.558-3.594-1.558-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124-4.083-.205-7.702-2.161-10.126-5.134-.423.722-.666 1.561-.666 2.475 0 1.709.87 3.213 2.188 4.096-.807-.026-1.566-.247-2.228-.617v.061c0 2.385 1.693 4.374 3.946 4.827-.413.112-.85.171-1.296.171-.317 0-.626-.03-.928-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.797 2.105-6.102 2.105-.396 0-.788-.023-1.175-.068 2.179 1.394 4.768 2.206 7.557 2.206 9.054 0 14.001-7.497 14.001-13.986 0-.21 0-.423-.015-.635.962-.695 1.797-1.562 2.457-2.549z"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M19.616 0H4.384C1.962 0 0 1.962 0 4.384v15.232C0 22.038 1.962 24 4.384 24h15.232C22.038 24 24 22.038 24 19.616V4.384C24 1.962 22.038 0 19.616 0zM7.05 20.452H3.547V9.047H7.05v11.405zM5.294 7.56c-1.14 0-2.063-.926-2.063-2.063 0-1.137.923-2.063 2.063-2.063 1.137 0 2.062.926 2.062 2.063 0 1.137-.925 2.063-2.062 2.063zM20.452 20.452h-3.504V14.83c0-1.344-.03-3.07-1.872-3.07-1.872 0-2.16 1.462-2.16 2.973v5.72H9.412V9.047h3.363v1.557h.048c.468-.885 1.61-1.818 3.315-1.818 3.548 0 4.204 2.338 4.204 5.38v6.286z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Elite Santé. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}