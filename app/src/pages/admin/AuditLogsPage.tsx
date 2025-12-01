import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Eye,
  Download,
} from 'lucide-react';
import { useAdminAuditLogs } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types';

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

const entityTypeColors: Record<string, string> = {
  USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LOAN: 'bg-green-500/20 text-green-400 border-green-500/30',
  KYC: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TRANSACTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  INVESTMENT: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    entityType: undefined as string | undefined,
    page: 0,
    size: 20,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data, isLoading } = useAdminAuditLogs(filters);

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Export feature coming soon');
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
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">View system activity and changes</p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                value={filters.entityType || 'ALL'}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entityType: value === 'ALL' ? undefined : value, page: 0 }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="LOAN">Loan</SelectItem>
                  <SelectItem value="KYC">KYC</SelectItem>
                  <SelectItem value="TRANSACTION">Transaction</SelectItem>
                  <SelectItem value="INVESTMENT">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Search by action..."
                value={filters.action || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, action: e.target.value || undefined, page: 0 }))
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Logs</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data?.totalElements || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">This Page</p>
                <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Unique Users</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {new Set(logs.map((l) => l.userId).filter(Boolean)).size}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Entity</TableHead>
                    <TableHead className="text-slate-400">Description</TableHead>
                    <TableHead className="text-slate-400">IP Address</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {log.userEmail || 'System'}
                          </p>
                          {log.userId && (
                            <p className="text-xs text-slate-400">ID: {log.userId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge
                            variant="outline"
                            className={
                              entityTypeColors[log.entityType] ||
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }
                          >
                            {log.entityType}
                          </Badge>
                          {log.entityId && (
                            <p className="text-xs text-slate-400 mt-1">ID: {log.entityId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                        {log.description || '-'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(log)}
                          className="h-8 text-slate-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                Page {filters.page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))
                  }
                  disabled={filters.page === 0}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min(totalPages - 1, prev.page + 1),
                    }))
                  }
                  disabled={filters.page >= totalPages - 1}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Audit Log Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Date</p>
                  <p className="text-white font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">User</p>
                  <p className="text-white font-medium">
                    {selectedLog.userEmail || 'System'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Action</p>
                  <p className="text-white font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Entity Type</p>
                  <p className="text-white font-medium">{selectedLog.entityType}</p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <p className="text-sm text-slate-400">Entity ID</p>
                    <p className="text-white font-medium">{selectedLog.entityId}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm text-slate-400">IP Address</p>
                    <p className="text-white font-medium">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedLog.description && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Description</p>
                  <p className="text-white bg-slate-800 p-3 rounded-lg">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {selectedLog.oldValues && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Old Values</p>
                  <pre className="text-white bg-slate-800 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">New Values</p>
                  <pre className="text-white bg-slate-800 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">User Agent</p>
                  <p className="text-white bg-slate-800 p-3 rounded-lg text-xs">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

