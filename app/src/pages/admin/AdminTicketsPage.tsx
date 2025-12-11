import { useState } from "react";
import * as React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  MoreVertical,
  XCircle,
} from "lucide-react";
import {
  useAdminTickets,
  useUpdateTicketStatus,
  useUpdateTicketPriority,
  useAssignTicket,
  TicketFilters,
} from "@/hooks/useAdmin";
import { useAdminUsers } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  User as UserType,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";

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

const statusConfig: Record<
  TicketStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  OPEN: {
    label: "Open",
    variant: "default",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "secondary",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  WAITING_SUPPORT: {
    label: "Waiting Support",
    variant: "secondary",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  WAITING_CUSTOMER: {
    label: "Waiting Customer",
    variant: "secondary",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "default",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  CLOSED: {
    label: "Closed",
    variant: "outline",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> =
  {
    LOW: { label: "Low", color: "bg-slate-500/10 text-slate-400" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/10 text-blue-400" },
    HIGH: { label: "High", color: "bg-amber-500/10 text-amber-400" },
    URGENT: { label: "Urgent", color: "bg-red-500/10 text-red-400" },
  };

export const AdminTicketsPage = () => {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<TicketFilters>({
    page: 0,
    size: 20,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { data: tickets, isLoading } = useAdminTickets(filters);
  const { data: admins } = useAdminUsers({ role: "ADMIN", page: 0, size: 100 });

  const updateStatus = useUpdateTicketStatus();
  const updatePriority = useUpdateTicketPriority();
  const assignTicket = useAssignTicket();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

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

  const handleStatusChange = (ticketId: number, status: TicketStatus) => {
    updateStatus.mutate({ id: ticketId, status });
  };

  const handlePriorityChange = (ticketId: number, priority: TicketPriority) => {
    updatePriority.mutate({ id: ticketId, priority });
  };

  const handleAssign = () => {
    if (selectedTicket && selectedStaffId) {
      assignTicket.mutate({ id: selectedTicket.id, staffId: selectedStaffId });
      setShowAssignDialog(false);
      setSelectedTicket(null);
      setSelectedStaffId(null);
    }
  };

  const openAssignDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSelectedStaffId(ticket.assignedTo?.id || null);
    setShowAssignDialog(true);
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
            Support Tickets
          </h1>
          <p className="text-slate-400 mt-1">
            Manage and resolve customer support tickets
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Tickets</p>
                <p className="text-xl font-bold text-white">
                  {tickets?.totalElements || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Open</p>
                <p className="text-xl font-bold text-blue-400">
                  {filters.status === "OPEN" || !filters.status
                    ? tickets?.totalElements || 0
                    : tickets?.content.filter(
                        (t: Ticket) => t.status === "OPEN"
                      ).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">In Progress</p>
                <p className="text-xl font-bold text-amber-400">
                  {filters.status === "IN_PROGRESS" || !filters.status
                    ? tickets?.totalElements || 0
                    : tickets?.content.filter(
                        (t: Ticket) => t.status === "IN_PROGRESS"
                      ).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Resolved</p>
                <p className="text-xl font-bold text-emerald-400">
                  {filters.status === "RESOLVED" || !filters.status
                    ? tickets?.totalElements || 0
                    : tickets?.content.filter(
                        (t: Ticket) => t.status === "RESOLVED"
                      ).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by ticket code or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    setFilters((prev) => ({ ...prev, page: 0 }))
                  }
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: v === "ALL" ? undefined : (v as TicketStatus),
                    page: 0,
                  }))
                }
              >
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_SUPPORT">Waiting Support</SelectItem>
                  <SelectItem value="WAITING_CUSTOMER">Waiting Customer</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority || "ALL"}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: v === "ALL" ? undefined : (v as TicketPriority),
                    page: 0,
                  }))
                }
              >
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setFilters((prev) => ({ ...prev, page: 0 }))}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Tickets ({tickets?.totalElements || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                ))}
              </div>
            ) : tickets?.content.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No tickets found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">
                      Ticket Code
                    </TableHead>
                    <TableHead className="text-slate-400">Subject</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-center text-slate-400">
                      Priority
                    </TableHead>
                    <TableHead className="text-center text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Assigned To
                    </TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-right text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.content.map((ticket: Ticket) => {
                    const status =
                      statusConfig[ticket.status] || statusConfig.OPEN;
                    const priority =
                      priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
                    return (
                      <TableRow
                        key={ticket.id}
                        className="border-slate-800 hover:bg-slate-800/50"
                      >
                        <TableCell className="font-mono text-sm text-white">
                          {ticket.ticketCode}
                        </TableCell>
                        <TableCell>
                          <div className="text-white font-medium">
                            {ticket.subject}
                          </div>
                          <div className="text-xs text-slate-400">
                            {ticket.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">
                            {ticket.user?.fullName || `User #${ticket.userId}`}
                          </div>
                          <div className="text-xs text-slate-400">
                            {ticket.user?.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("border", priority.color)}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("border", status.color)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {ticket.assignedTo ? (
                            <div className="text-sm">
                              {ticket.assignedTo.fullName}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-slate-800"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-slate-800 border-slate-700"
                            >
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={`/admin/tickets/${ticket.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => openAssignDialog(ticket)}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Ticket
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              {ticket.status === "OPEN" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-amber-400 focus:text-amber-400"
                                  onClick={() =>
                                    handleStatusChange(ticket.id, "IN_PROGRESS")
                                  }
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {ticket.status !== "RESOLVED" &&
                                ticket.status !== "CLOSED" && (
                                  <DropdownMenuItem
                                    className="cursor-pointer text-emerald-400 focus:text-emerald-400"
                                    onClick={() =>
                                      handleStatusChange(ticket.id, "RESOLVED")
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Resolve Ticket
                                  </DropdownMenuItem>
                                )}
                              {ticket.status !== "CLOSED" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-slate-400 focus:text-slate-400"
                                  onClick={() =>
                                    handleStatusChange(ticket.id, "CLOSED")
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Close Ticket
                                </DropdownMenuItem>
                              )}
                              {ticket.status === "CLOSED" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-emerald-400 focus:text-emerald-400"
                                  onClick={() =>
                                    handleStatusChange(ticket.id, "OPEN")
                                  }
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reopen Ticket
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Assign Ticket Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Ticket</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign this ticket to a staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTicket && (
              <div className="space-y-2">
                <div className="text-sm text-slate-300">
                  <span className="font-medium">Ticket:</span>{" "}
                  {selectedTicket.ticketCode}
                </div>
                <div className="text-sm text-slate-300">
                  <span className="font-medium">Subject:</span>{" "}
                  {selectedTicket.subject}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Assign To
              </label>
              <Select
                value={selectedStaffId?.toString() || ""}
                onValueChange={(v) => setSelectedStaffId(Number(v))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {admins?.content.map((admin: UserType) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.fullName} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedTicket(null);
                setSelectedStaffId(null);
              }}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedStaffId || assignTicket.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {assignTicket.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {tickets && tickets.totalPages > 1 && (
        <motion.div
          variants={item}
          className="flex items-center justify-between"
        >
          <div className="text-sm text-slate-400">
            Showing {filters.page! * filters.size! + 1} to{" "}
            {Math.min(
              (filters.page! + 1) * filters.size!,
              tickets.totalElements
            )}{" "}
            of {tickets.totalElements} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={tickets.first || isLoading}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page || 0) - 1 }))
              }
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, tickets.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (tickets.totalPages <= 5) {
                    pageNum = i;
                  } else if ((filters.page || 0) < 3) {
                    pageNum = i;
                  } else if ((filters.page || 0) > tickets.totalPages - 4) {
                    pageNum = tickets.totalPages - 5 + i;
                  } else {
                    pageNum = (filters.page || 0) - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === (filters.page || 0) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: pageNum }))
                      }
                      disabled={isLoading}
                      className={
                        pageNum === (filters.page || 0)
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-slate-700 text-slate-300 hover:bg-slate-800"
                      }
                    >
                      {pageNum + 1}
                    </Button>
                  );
                }
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={tickets.last || isLoading}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page || 0) + 1 }))
              }
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminTicketsPage;
