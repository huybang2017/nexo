import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCount } from "@/hooks/useNotification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

// Combined nav items for both BORROWER and LENDER
const userNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Loans", href: "/dashboard/loans", icon: CreditCard },
  { label: "Marketplace", href: "/dashboard/marketplace", icon: TrendingUp },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: PiggyBank },
  { label: "Repayments", href: "/dashboard/repayments", icon: FileText },
  { label: "Credit Score", href: "/dashboard/credit-score", icon: Shield },
  { label: "KYC", href: "/dashboard/kyc", icon: ShieldCheck },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const location = useLocation();
  const navigate = useNavigate();

  // Use combined nav items for both BORROWER and LENDER
  const navItems = userNavItems;
  const dashboardBase = "/dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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

          <Link to={dashboardBase} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold">NEXO</span>
          </Link>

          <Link
            to={`${dashboardBase}/notifications`}
            className="relative p-2 text-slate-400 hover:text-white"
          >
            <Bell className="w-6 h-6" />
            {unreadCount && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800"
            >
              <SidebarContent
                navItems={navItems}
                dashboardBase={dashboardBase}
                user={user}
                unreadCount={unreadCount}
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
        <SidebarContent
          navItems={navItems}
          dashboardBase={dashboardBase}
          user={user}
          unreadCount={unreadCount}
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

interface SidebarContentProps {
  navItems: NavItem[];
  dashboardBase: string;
  user: any;
  unreadCount?: number;
  location: ReturnType<typeof useLocation>;
  onClose?: () => void;
  onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navItems,
  dashboardBase,
  user,
  unreadCount,
  location,
  onClose,
  onLogout,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800">
        <Link
          to={dashboardBase}
          className="flex items-center gap-3"
          onClick={onClose}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">N</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">
            NEXO
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== dashboardBase &&
              location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto bg-emerald-500/20 text-emerald-400"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-slate-800">
          <Link
            to={`${dashboardBase}/notifications`}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname.includes("/notifications")
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {unreadCount && unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto bg-emerald-500/20 text-emerald-400"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>

          <Link
            to={`${dashboardBase}/support`}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname.includes("/support")
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Support</span>
          </Link>

          <Link
            to={`${dashboardBase}/settings`}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname.includes("/settings")
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors">
              <Avatar className="w-10 h-10 border-2 border-emerald-500/30">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-slate-900 border-slate-800"
          >
            <DropdownMenuItem asChild>
              <Link to={`${dashboardBase}/profile`} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`${dashboardBase}/settings`} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DashboardLayout;
