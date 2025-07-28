import { ReactNode } from 'react';
import { Home, Users, Calendar, ClipboardList, UserX, BarChart3, FileText } from 'lucide-react';
import ResponsiveLayout from './ResponsiveLayout';

const navLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Lessons', href: '/admin/lessons', icon: Calendar },
  { name: 'Duties', href: '/admin/duties', icon: ClipboardList },
  { name: 'Absences', href: '/absences', icon: UserX },
  { name: 'Statistics', href: '/admin/stats', icon: BarChart3 },
  { name: 'Assessments', href: '/assessments', icon: FileText },
];

export default function AdminLayout({ children, pageTitle }: { children: ReactNode, pageTitle: string }) {
  return (
    <ResponsiveLayout pageTitle={pageTitle} navLinks={navLinks}>
      {children}
    </ResponsiveLayout>
  );
}
