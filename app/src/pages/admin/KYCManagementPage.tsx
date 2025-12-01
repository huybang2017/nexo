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
import { useAdminKyc } from '@/hooks/useAdmin';
import { formatDate } from '@/lib/utils';
import { Search, Eye, CheckCircle, XCircle, Clock, Shield, FileCheck, Filter } from 'lucide-react';

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
  NOT_SUBMITTED: { label: 'Not Submitted', variant: 'outline' },
  PENDING: { label: 'Pending', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
};

export default function KYCManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  
  const { data, isLoading } = useAdminKyc({ 
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    size,
  });

  const kycProfiles = data?.content || [];

  const filteredProfiles = kycProfiles.filter((kyc: any) =>
    kyc.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kyc.idCardNumber?.includes(searchTerm)
  );

  const pendingCount = statusFilter === 'PENDING' 
    ? (data?.totalElements || 0)
    : kycProfiles.filter((k: any) => k.status === 'PENDING').length;

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">KYC Management</h1>
          <p className="text-slate-400 mt-1">Review and verify user identities</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
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
                <FileCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total KYC</p>
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
                <p className="text-slate-400 text-xs">Pending</p>
                <p className="text-xl font-bold text-amber-400">
                  {statusFilter === 'PENDING' || statusFilter === 'all' 
                    ? (data?.totalElements || 0) 
                    : kycProfiles.filter((k: any) => k.status === 'PENDING').length}
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
                <p className="text-slate-400 text-xs">Approved</p>
                <p className="text-xl font-bold text-emerald-400">
                  {statusFilter === 'APPROVED' || statusFilter === 'all'
                    ? (data?.totalElements || 0)
                    : kycProfiles.filter((k: any) => k.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Rejected</p>
                <p className="text-xl font-bold text-red-400">
                  {statusFilter === 'REJECTED' || statusFilter === 'all'
                    ? (data?.totalElements || 0)
                    : kycProfiles.filter((k: any) => k.status === 'REJECTED').length}
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
                  placeholder="Search by name or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setPage(0)} 
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KYC Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              KYC Profiles ({data?.totalElements || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                ))}
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No KYC records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Full Name</TableHead>
                    <TableHead className="text-slate-400">ID Number</TableHead>
                    <TableHead className="text-slate-400">City</TableHead>
                    <TableHead className="text-center text-slate-400">Documents</TableHead>
                    <TableHead className="text-center text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Submitted</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((kyc: any) => {
                    const status = statusConfig[kyc.status] || statusConfig.NOT_SUBMITTED;
                    return (
                      <TableRow key={kyc.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell>
                          <div className="text-sm font-medium text-white">User #{kyc.userId}</div>
                        </TableCell>
                        <TableCell className="text-white">{kyc.fullName || '-'}</TableCell>
                        <TableCell className="font-mono text-slate-300">
                          {kyc.idCardNumber ? `***${kyc.idCardNumber.slice(-4)}` : '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">{kyc.city || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-slate-700 text-slate-300">
                            {kyc.documents?.length || 0} files
                          </Badge>
                        </TableCell>
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
                          {kyc.submittedAt ? formatDate(kyc.submittedAt) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" asChild className="hover:bg-slate-800">
                              <Link to={`/admin/kyc/${kyc.id}`}>
                                <Eye className="h-4 w-4 text-slate-400" />
                              </Link>
                            </Button>
                            {kyc.status === 'PENDING' && (
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
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
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


