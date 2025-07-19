import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role } from '@prisma/client';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout'; // Import the new layout
import { BookUser, CalendarCheck, ClipboardList } from 'lucide-react';

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
