import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyCreditScoreHistory } from '@/hooks/useCreditScore';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronLeft, 
  ChevronRight,
  History,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  // Positive events
  INITIAL_SCORE: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  KYC_VERIFIED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  REPAYMENT_ON_TIME: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  REPAYMENT_EARLY: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  LOAN_COMPLETED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  INCOME_VERIFIED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  EMPLOYMENT_VERIFIED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  BANK_ACCOUNT_LINKED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  PROFILE_COMPLETED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  LONG_TERM_MEMBER: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  // Negative events
  REPAYMENT_LATE_1_7_DAYS: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  REPAYMENT_LATE_8_14_DAYS: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  REPAYMENT_LATE_15_30_DAYS: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  REPAYMENT_LATE_OVER_30_DAYS: { bg: 'bg-red-500/20', text: 'text-red-400' },
  LOAN_DEFAULTED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  FRAUD_DETECTED: { bg: 'bg-red-600/20', text: 'text-red-500' },
  KYC_REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  LOAN_REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  ACCOUNT_WARNING: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  // Neutral events
  SCORE_RECALCULATED: { bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
  MANUAL_ADJUSTMENT: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export function CreditScoreHistoryTable() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { data, isLoading } = useMyCreditScoreHistory(page, pageSize);

  if (isLoading) {
    return <CreditScoreHistoryTableSkeleton />;
  }

  if (!data || data.content.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="w-12 h-12 text-zinc-600 mb-3" />
          <p className="text-zinc-500">No credit score history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-indigo-400" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Event</TableHead>
                  <TableHead className="text-zinc-400">Change</TableHead>
                  <TableHead className="text-zinc-400">Score</TableHead>
                  <TableHead className="text-zinc-400">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((history) => {
                  const colors = eventTypeColors[history.eventType] || eventTypeColors.SCORE_RECALCULATED;
                  return (
                    <TableRow key={history.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-zinc-300">
                        {new Date(history.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-medium', colors.bg, colors.text)}>
                          {history.eventDescription}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {history.scoreChange > 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : history.scoreChange < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-500" />
                          )}
                          <span className={cn(
                            'font-medium',
                            history.scoreChange > 0 ? 'text-emerald-400' : 
                            history.scoreChange < 0 ? 'text-red-400' : 'text-zinc-500'
                          )}>
                            {history.scoreChange > 0 ? '+' : ''}{history.scoreChange}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{history.scoreBefore}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-white font-medium">{history.scoreAfter}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 max-w-xs truncate">
                        {history.description}
                        {history.relatedLoanId && (
                          <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-indigo-400">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Loan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-zinc-500">
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.totalElements)} of {data.totalElements}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={data.first}
                className="border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-zinc-400">
                Page {page + 1} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={data.last}
                className="border-zinc-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreditScoreHistoryTableSkeleton() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

