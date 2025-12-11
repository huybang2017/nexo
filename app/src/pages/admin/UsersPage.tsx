import { useState } from "react";
import * as React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Users,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Mail,
} from "lucide-react";
import {
  useAdminUsers,
  UserFilters,
  useBanUser,
  useUnbanUser,
  useUpdateUserStatus,
} from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate, getInitials } from "@/lib/utils";
import type { User, UserRole, UserStatus } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const statusColors: Record<UserStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/30",
  BANNED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-violet-500/10 text-violet-400",
  BORROWER: "bg-blue-500/10 text-blue-400",
  LENDER: "bg-emerald-500/10 text-emerald-400",
};

export const UsersPage = () => {
  const [filters, setFilters] = useState<UserFilters>({
    page: 0,
    size: 20,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading } = useAdminUsers(filters);

  // Auto-search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchQuery || undefined,
        page: 0,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery || undefined,
      page: 0,
    }));
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Users Management
          </h1>
          <p className="text-slate-400 mt-1">Manage all platform users</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select
                value={filters.role || "ALL"}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: v === "ALL" ? undefined : (v as UserRole),
                    page: 0,
                  }))
                }
              >
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="BORROWER">Borrower</SelectItem>
                  <SelectItem value="LENDER">Lender</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: v === "ALL" ? undefined : (v as UserStatus),
                    page: 0,
                  }))
                }
              >
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="BANNED">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-400" />
              Users ({users?.totalElements || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users?.content.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">KYC</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.content.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {users && users.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.first}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: (prev.page || 0) - 1,
                    }))
                  }
                  className="border-slate-700"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-slate-400">
                  Page {(filters.page || 0) + 1} of {users.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.last}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: (prev.page || 0) + 1,
                    }))
                  }
                  className="border-slate-700"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const UserRow: React.FC<{ user: User }> = ({ user }) => {
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const updateStatus = useUpdateUserStatus();

  return (
    <TableRow className="border-slate-800 hover:bg-slate-800/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{user.fullName}</p>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={roleColors[user.role]}>{user.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn("border", statusColors[user.status])}>
          {user.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          className={cn(
            "border",
            user.kycStatus === "APPROVED"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : user.kycStatus === "PENDING"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-slate-500/10 text-slate-400 border-slate-500/30"
          )}
        >
          {user.kycStatus}
        </Badge>
      </TableCell>
      <TableCell className="text-slate-400">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-slate-800">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-slate-800 border-slate-700"
          >
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={`/admin/users/${user.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            {user.status === "ACTIVE" ? (
              <DropdownMenuItem
                className="cursor-pointer text-amber-400 focus:text-amber-400"
                onClick={() =>
                  updateStatus.mutate({ id: user.id, status: "SUSPENDED" })
                }
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend User
              </DropdownMenuItem>
            ) : user.status === "SUSPENDED" ? (
              <DropdownMenuItem
                className="cursor-pointer text-emerald-400 focus:text-emerald-400"
                onClick={() =>
                  updateStatus.mutate({ id: user.id, status: "ACTIVE" })
                }
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </DropdownMenuItem>
            ) : null}
            {user.status === "BANNED" && (
              <DropdownMenuItem
                className="cursor-pointer text-emerald-400 focus:text-emerald-400"
                onClick={() => unbanUser.mutate(user.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Unban User
              </DropdownMenuItem>
            )}
            {user.status !== "BANNED" && user.role !== "ADMIN" && (
              <DropdownMenuItem
                className="cursor-pointer text-red-400 focus:text-red-400"
                onClick={() =>
                  banUser.mutate({ id: user.id, reason: "Violation of terms" })
                }
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default UsersPage;
