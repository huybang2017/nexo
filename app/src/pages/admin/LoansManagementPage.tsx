import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminLoans } from '@/hooks/useAdmin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileText, Eye, CheckCircle, XCircle, Clock, CreditCard, Filter } from 'lucide-react';

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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING_REVIEW: { label: 'Pending', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  FUNDING: { label: 'Funding', variant: 'default' },
  ACTIVE: { label: 'Active', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  DEFAULTED: { label: 'Defaulted', variant: 'destructive' },
};

export default function LoansManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  
  const { data, isLoading } = useAdminLoans({ 
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
    page,
    size,
  });

  const loans = data?.content || [];

  const pendingCount = statusFilter === 'PENDING_REVIEW' || statusFilter === 'all'
    ? (data?.totalElements || 0)
    : loans.filter((l: any) => l.status === 'PENDING_REVIEW').length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Loans Management</h1>
          <p className="text-slate-400 mt-1">Review and manage all loan requests</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Clock className="mr-2 h-4 w-4" />
            {pendingCount} Pending Review
          </Badge>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Loans</p>
                <p className="text-xl font-bold text-white">{data?.totalElements || 0}</p>
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
                <p className="text-slate-400 text-xs">Pending Review</p>
                <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
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
                <p className="text-slate-400 text-xs">Active</p>
                <p className="text-xl font-bold text-emerald-400">
                  {statusFilter === 'ACTIVE' || statusFilter === 'all'
                    ? (data?.totalElements || 0)
                    : loans.filter((l: any) => l.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Volume</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(loans.reduce((sum: number, l: any) => sum + (l.requestedAmount || 0), 0), true)}
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
                  placeholder="Search by code, title, or borrower..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="FUNDING">Funding</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setPage(0)} 
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loans Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Loans ({data?.totalElements || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                ))}
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No loans found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Loan Code</TableHead>
                    <TableHead className="text-slate-400">Borrower</TableHead>
                    <TableHead className="text-slate-400">Title</TableHead>
                    <TableHead className="text-right text-slate-400">Amount</TableHead>
                    <TableHead className="text-center text-slate-400">Rate</TableHead>
                    <TableHead className="text-center text-slate-400">Term</TableHead>
                    <TableHead className="text-center text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan: any) => {
                    const status = statusConfig[loan.status] || statusConfig.PENDING_REVIEW;
                    return (
                      <TableRow key={loan.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-mono text-sm text-white">{loan.loanCode}</TableCell>
                        <TableCell>
                          <div className="text-sm text-white">{loan.borrower?.fullName || '-'}</div>
                          <div className="text-xs text-slate-400">{loan.borrower?.email || '-'}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-white">{loan.title}</TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatCurrency(loan.requestedAmount)}
                        </TableCell>
                        <TableCell className="text-center text-slate-300">{loan.interestRate}%</TableCell>
                        <TableCell className="text-center text-slate-300">{loan.termMonths}m</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={status.variant}
                            className={
                              status.variant === 'default' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              status.variant === 'destructive' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                              status.variant === 'secondary' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {formatDate(loan.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" asChild className="hover:bg-slate-800">
                              <Link to={`/admin/loans/${loan.id}`}>
                                <Eye className="h-4 w-4 text-slate-400" />
                              </Link>
                            </Button>
                            {loan.status === 'PENDING_REVIEW' && (
                              <>
                                <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <motion.div variants={item} className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {page * size + 1} to {Math.min((page + 1) * size, data.totalElements)} of {data.totalElements} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.first || isLoading}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                let pageNum;
                if (data.totalPages <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > data.totalPages - 4) {
                  pageNum = data.totalPages - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    className={
                      pageNum === page 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={data.last || isLoading}
              onClick={() => setPage((prev) => Math.min(data.totalPages - 1, prev + 1))}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}


