import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { Home, Users, Calendar, ClipboardList, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

// Define the props for the layout component
interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

// Define the structure for our navigation links
const navLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Lessons', href: '/admin/lessons', icon: Calendar },
  { name: 'Duties', href: '/admin/duties', icon: ClipboardList },
];

export default function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-portal-bg font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-portal-dark text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-portal-dark-light">
          <Link href="/">RAFAC Rota</Link>
        </div>
        <nav className="flex-grow px-4 py-4">
          <ul>
            {navLinks.map((link) => {
              const isActive = router.pathname.startsWith(link.href);
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-3 py-3 my-1 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-portal-blue text-white'
                        : 'text-gray-300 hover:bg-portal-dark-light hover:text-white'
                    }`}
                  >
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Sign Out Button */}
        <div className="px-4 py-4 border-t border-portal-dark-light">
            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center px-3 py-3 my-1 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-portal-dark-light hover:text-white"
            >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
           <h1 className="text-xl font-semibold text-gray-700">{pageTitle}</h1>
           {/* You can add user profile info here later */}
        </header>
        <main className="flex-1 overflow-y-auto p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
