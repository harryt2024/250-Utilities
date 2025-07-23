import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface NavLink {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface ResponsiveLayoutProps {
  children: ReactNode;
  pageTitle: string;
  navLinks: NavLink[];
}

export default function ResponsiveLayout({ children, pageTitle, navLinks }: ResponsiveLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <>
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
                  onClick={() => setSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="flex h-screen bg-portal-bg font-sans">
      {/* Static Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-portal-dark text-white flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Slide-out) */}
      <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className="w-64 bg-portal-dark text-white flex flex-col flex-shrink-0">
          <SidebarContent />
        </aside>
        <div className="flex-shrink-0 w-14 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
           <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
             <Menu className="w-6 h-6" />
           </button>
           <h1 className="text-xl font-semibold text-gray-700">{pageTitle}</h1>
           {session?.user && (
             <div className="hidden sm:block text-sm text-gray-600">
                Signed in as <span className="font-semibold">{session.user.name}</span>
             </div>
           )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}