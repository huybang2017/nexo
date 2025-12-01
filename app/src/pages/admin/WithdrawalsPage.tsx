import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowDownUp,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { Transaction, TransactionStatus } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

export default function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Transaction | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filters = {
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    size: 20,
  };

  const { data, isLoading } = useAdminWithdrawals(filters);
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();

  const withdrawals = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleApprove = (withdrawal: Transaction) => {
    if (confirm(`Approve withdrawal of ${formatCurrency(withdrawal.amount)}?`)) {
      approveWithdrawal.mutate(withdrawal.id);
    }
  };

  const handleReject = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      return;
    }
    rejectWithdrawal.mutate(
      { transactionId: selectedWithdrawal.id, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setRejectReason('');
          setSelectedWithdrawal(null);
        },
      }
    );
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      COMPLETED: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    };
    const variant = variants[status];
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-slate-400 mt-1">Manage and process withdrawal requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v as TransactionStatus | 'ALL');
                setPage(0);
              }}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Withdrawals</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data?.totalElements || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <ArrowDownUp className="h-6 w-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {withdrawals.filter((w) => w.status === 'PENDING').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {withdrawals.filter((w) => w.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(
                    withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Fee</TableHead>
                    <TableHead className="text-slate-400">Net Amount</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Description</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow
                      key={withdrawal.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-700">
                            <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">
                              {getInitials(withdrawal.userName || withdrawal.userEmail || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {withdrawal.userName || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {withdrawal.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatCurrency(withdrawal.fee)}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(withdrawal.netAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                        {withdrawal.description || '-'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(withdrawal.createdAt)}
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === 'PENDING' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                              <DropdownMenuItem
                                onClick={() => handleApprove(withdrawal)}
                                className="text-green-400 focus:text-green-400 cursor-pointer"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem
                                onClick={() => handleReject(withdrawal)}
                                className="text-red-400 focus:text-red-400 cursor-pointer"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-400">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Withdrawal</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWithdrawal && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Amount</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <p className="text-sm text-slate-400 mt-2">User</p>
                <p className="text-sm text-white">
                  {selectedWithdrawal.userName || selectedWithdrawal.userEmail}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="reason" className="text-slate-300">
                Rejection Reason
              </Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-2 bg-slate-800 border-slate-700 text-white"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectWithdrawal.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejectWithdrawal.isPending ? 'Rejecting...' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}


