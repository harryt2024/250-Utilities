import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import UserLayout from '../components/UserLayout'; // Import the new user layout
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-portal-bg">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  // If the user is signed in, show the main user dashboard
  if (session) {
    return (
      <UserLayout pageTitle="Dashboard">
        {/* Admin Panel Link */}
        {session.user.role === Role.ADMIN && (
            <div className="p-4 mb-6 text-blue-800 bg-blue-100 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                    <ShieldCheck className="w-6 h-6 mr-3" />
                    <div>
                        <h3 className="font-semibold">Admin Access</h3>
                        <p className="text-sm">You have admin privileges. <Link href="/admin/dashboard" className="font-semibold underline hover:text-blue-600">Go to the Admin Panel</Link> to manage the system.</p>
                    </div>
                </div>
            </div>
        )}

        {/* User-specific content will go here */}
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800">Welcome to the Rota System</h2>
            <p className="mt-1 text-gray-600">Use the navigation on the left to view your assigned lessons and the overall schedule.</p>
        </div>
      </UserLayout>
    );
  }

  // If the user is not signed in, show the landing/login page
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-portal-bg">
      <div className="p-10 text-center bg-white rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          RAFAC Rota System
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Please sign in to view the rota and uniform.
        </p>
        <div className="mt-8">
          <button
            onClick={() => signIn(undefined, { callbackUrl: '/' })}
            className="px-8 py-3 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-portal-blue hover:bg-portal-blue-light"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
