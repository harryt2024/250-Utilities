import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role } from '@prisma/client';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout'; // Import the new layout
import { BookUser, CalendarCheck, ClipboardList, UserCheck, UserX, Home, Shirt, BarChart3 } from 'lucide-react';

export default function AdminDashboard({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    // Wrap the page content with the AdminLayout component
    <AdminLayout pageTitle="Dashboard">
      {/* Welcome Header */}
      <div className="p-6 mb-8 bg-white border-l-4 border-portal-blue rounded-r-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user.name}!</h2>
          <p className="mt-1 text-gray-600">This is your central hub for managing the squadron's rota system.</p>
      </div>
      
      {/* Grid for navigation cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-700">Home</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Return to the standard user dashboard.
            </p>
        </Link>



        {/* User Management Card */}
        <Link href="/admin/users" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookUser className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-700">User Management</h3>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Create new users, change passwords, and assign admin roles.
          </p>
        </Link>

        {/* Lesson Management Card */}
        <Link href="/admin/lessons" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-700">Lesson Calendar</h3>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Schedule lessons via a calendar view and manage assignments.
          </p>
        </Link>

        {/* Duty Rota Card */}
        <Link href="/admin/duties" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClipboardList className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-700">Duty Rota</h3>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Assign Duty Senior and Duty Junior using a calendar interface.
          </p>
        </Link>
        <Link href="/absences" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-700">Absence Management</h3>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Confirm the attendance of NCO's for their duties.
          </p>
        </Link>
                <Link href="/absences" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Shirt className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-700">Uniform</h3>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Manage the uniform that the squadron currently has in stores. This results in you leaving the admin page.
          </p>
        </Link>
          <Link href="/stats" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-700">Statistics</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              View who's been duty and other useful statistics.
            </p>
        </Link>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || session.user.role !== Role.ADMIN) {
    return {
      redirect: {
        destination: '/auth/signin?error=You are not authorized to view this page.',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: {
        name: session.user.name ?? 'Admin',
        role: session.user.role,
      },
    },
  };
};
