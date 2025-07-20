import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { LayoutDashboard, BookCheck, LogOut, Calendar, ClipboardCheck, Shirt } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface UserLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

// Add the new "Uniform Store" link to this array
const navLinks = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Full Rota', href: '/rota', icon: Calendar },
  { name: 'My Assigned Lessons', href: '/my-lessons', icon: BookCheck },
  { name: 'My Duties', href: '/my-duties', icon: ClipboardCheck },
  { name: 'Uniform Store', href: '/uniform', icon: Shirt },
];

export default function UserLayout({ children, pageTitle }: UserLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex h-screen bg-portal-bg font-sans">
      <aside className="w-64 flex-shrink-0 bg-portal-dark text-white flex flex-col print-layout-hidden">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-portal-dark-light">
          <Link href="/">RAFAC Rota</Link>
        </div>
        <nav className="flex-grow px-4 py-4">
          <ul>
            {navLinks.map((link) => {
              const isActive = router.pathname === link.href;
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b print-layout-hidden">
           <h1 className="text-xl font-semibold text-gray-700">{pageTitle}</h1>
           {session?.user && (
             <div className="text-sm text-gray-600">
                Signed in as <span className="font-semibold">{session.user.name}</span>
             </div>
           )}
        </header>
        <main className="flex-1 overflow-y-auto p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
