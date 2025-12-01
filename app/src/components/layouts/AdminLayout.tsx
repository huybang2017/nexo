import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileCheck,
  ArrowDownUp,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data: stats } = useDashboardStats();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'KYC Review', href: '/admin/kyc', icon: FileCheck, badge: stats?.kyc.pending },
    { label: 'Loans', href: '/admin/loans', icon: CreditCard, badge: stats?.loans.pending },
    { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownUp },
    { label: 'Support Tickets', href: '/admin/tickets', icon: MessageSquare, badge: stats?.support.openTickets },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">Admin</span>
          </Link>

          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800"
            >
              <AdminSidebarContent
                navItems={navItems}
                user={user}
                location={location}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:flex lg:w-72 lg:flex-col bg-slate-900/50 backdrop-blur-sm border-r border-slate-800">
        <AdminSidebarContent
          navItems={navItems}
          user={user}
          location={location}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

interface AdminSidebarContentProps {
  navItems: NavItem[];
  user: any;
  location: ReturnType<typeof useLocation>;
  onClose?: () => void;
  onLogout: () => void;
}

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({
  navItems,
  user,
  location,
  onClose,
  onLogout,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800">
        <Link to="/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-semibold text-lg tracking-tight">NEXO</span>
            <span className="text-violet-400 text-xs block">Admin Panel</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/admin' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="secondary" className="ml-auto bg-violet-500/20 text-violet-400">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors">
              <Avatar className="w-10 h-10 border-2 border-violet-500/30">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-violet-400">Administrator</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuItem asChild>
              <Link to="/admin/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-400 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AdminLayout;

