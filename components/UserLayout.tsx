import { ReactNode } from 'react';
import { LayoutDashboard, BookCheck, LogOut, Calendar, ClipboardCheck, Shirt, UserX, FileText } from 'lucide-react';
import ResponsiveLayout from './ResponsiveLayout';

const navLinks = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Full Rota', href: '/rota', icon: Calendar },
  { name: 'My Duties', href: '/my-duties', icon: ClipboardCheck },
  { name: 'Uniform Store', href: '/uniform', icon: Shirt },
  { name: 'Submit Absence', href: '/absences', icon: UserX },
    { name: 'Assessments', href: '/assessments', icon: FileText },
];

export default function UserLayout({ children, pageTitle }: { children: ReactNode, pageTitle: string }) {
  return (
    <ResponsiveLayout pageTitle={pageTitle} navLinks={navLinks}>
      {children}
    </ResponsiveLayout>
  );
}
