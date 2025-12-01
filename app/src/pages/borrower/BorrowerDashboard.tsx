import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Wallet,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyLoans } from '@/hooks/useLoan';
import { useWallet } from '@/hooks/useWallet';
import { useMyCreditScoreSummary } from '@/hooks/useCreditScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskLevelBadge } from '@/components/credit-score';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Loan, RiskLevel } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const BorrowerDashboard = () => {
  const { user } = useAuth();
  const { data: loans, isLoading: loansLoading } = useMyLoans({ size: 5 });
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: creditScoreSummary, isLoading: creditScoreLoading } = useMyCreditScoreSummary();

  const activeLoans = loans?.content.filter(l => ['ACTIVE', 'REPAYING'].includes(l.status)) || [];
  const pendingLoans = loans?.content.filter(l => ['PENDING_REVIEW', 'FUNDING'].includes(l.status)) || [];
  const nextRepayment = activeLoans.find(l => l.nextRepaymentDate);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {user?.firstName || 'Borrower'}! 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your lending overview</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
          <Link to="/dashboard/loans/new">
            <Plus className="w-4 h-4 mr-2" />
            Apply for Loan
          </Link>
        </Button>
      </motion.div>

      {/* KYC Alert */}
      {user?.kycStatus !== 'APPROVED' && (
        <motion.div variants={item}>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-amber-200 font-medium">Complete your KYC verification</p>
                <p className="text-amber-300/70 text-sm">
                  {user?.kycStatus === 'PENDING' 
                    ? 'Your KYC is under review. We\'ll notify you once it\'s approved.'
                    : 'Verify your identity to unlock loan applications.'}
                </p>
              </div>
              {user?.kycStatus !== 'PENDING' && (
                <Button asChild variant="outline" size="sm" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
                  <Link to="/dashboard/kyc">
                    Start KYC
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <Card className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Wallet Balance</p>
                {walletLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <Link
              to="/dashboard/wallet"
              className="text-emerald-400 text-sm mt-4 inline-flex items-center hover:text-emerald-300"
            >
              View wallet
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Active Loans */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Loans</p>
                {loansLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{activeLoans.length}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                {loansLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{pendingLoans.length}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Repayment */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Next Repayment</p>
                {loansLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : nextRepayment ? (
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(nextRepayment.nextRepaymentAmount || 0)}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm mt-1">No upcoming</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            {nextRepayment?.nextRepaymentDate && (
              <p className="text-slate-500 text-xs mt-2">
                Due: {formatDate(nextRepayment.nextRepaymentDate)}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Credit Score Card */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-purple-500/10 border-indigo-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Credit Score
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
              <Link to="/dashboard/credit-score">View Details</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {creditScoreLoading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
            ) : creditScoreSummary ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(creditScoreSummary.totalScore / creditScoreSummary.maxScore) * 283} 283`}
                      className={cn(
                        "transition-all duration-1000",
                        creditScoreSummary.riskLevel === 'LOW' ? 'stroke-emerald-400' :
                        creditScoreSummary.riskLevel === 'MEDIUM' ? 'stroke-yellow-400' :
                        creditScoreSummary.riskLevel === 'HIGH' ? 'stroke-orange-400' :
                        'stroke-red-400'
                      )}
                      style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                      "text-3xl font-bold",
                      creditScoreSummary.riskLevel === 'LOW' ? 'text-emerald-400' :
                      creditScoreSummary.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                      creditScoreSummary.riskLevel === 'HIGH' ? 'text-orange-400' :
                      'text-red-400'
                    )}>
                      {creditScoreSummary.totalScore}
                    </span>
                    <span className="text-slate-500 text-xs">/ {creditScoreSummary.maxScore}</span>
                  </div>
                </div>

                {/* Score Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <RiskLevelBadge 
                      riskLevel={creditScoreSummary.riskLevel as RiskLevel} 
                      riskGrade={creditScoreSummary.riskGrade}
                    />
                    {creditScoreSummary.scoreChange30Days !== 0 && (
                      <Badge className={cn(
                        "gap-1",
                        creditScoreSummary.scoreChange30Days > 0 
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {creditScoreSummary.scoreChange30Days > 0 ? '+' : ''}
                        {creditScoreSummary.scoreChange30Days} (30d)
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-500">Max Loan Amount</p>
                      <p className="text-white font-medium">
                        {formatCurrency(creditScoreSummary.maxLoanAmount)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-500">Loan Eligibility</p>
                      <p className={cn(
                        "font-medium",
                        creditScoreSummary.isEligibleForLoan ? "text-emerald-400" : "text-red-400"
                      )}>
                        {creditScoreSummary.isEligibleForLoan ? 'Eligible' : 'Not Eligible'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Credit score not available</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/dashboard/credit-score">Check Score</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Loans */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Loans</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Link to="/dashboard/loans">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loansLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : loans?.content.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No loan applications yet</p>
                <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
                  <Link to="/dashboard/loans/new">Apply for your first loan</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {loans?.content.slice(0, 5).map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING_REVIEW: { color: 'text-amber-400 bg-amber-400/10', icon: <Clock className="w-3 h-3" /> },
    APPROVED: { color: 'text-emerald-400 bg-emerald-400/10', icon: <CheckCircle2 className="w-3 h-3" /> },
    FUNDING: { color: 'text-blue-400 bg-blue-400/10', icon: <TrendingUp className="w-3 h-3" /> },
    ACTIVE: { color: 'text-cyan-400 bg-cyan-400/10', icon: <DollarSign className="w-3 h-3" /> },
    REPAYING: { color: 'text-purple-400 bg-purple-400/10', icon: <Calendar className="w-3 h-3" /> },
    COMPLETED: { color: 'text-green-400 bg-green-400/10', icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED: { color: 'text-red-400 bg-red-400/10', icon: <AlertCircle className="w-3 h-3" /> },
    DEFAULTED: { color: 'text-red-400 bg-red-400/10', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const config = statusConfig[loan.status] || statusConfig.PENDING_REVIEW;

  return (
    <Link
      to={`/dashboard/loans/${loan.id}`}
      className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-medium">{loan.title}</p>
          <p className="text-slate-500 text-sm">{loan.loanCode}</p>
        </div>
        <Badge className={cn('gap-1', config.color)}>
          {config.icon}
          {loan.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-slate-400">Amount: </span>
          <span className="text-white font-medium">{formatCurrency(loan.requestedAmount)}</span>
        </div>
        <div>
          <span className="text-slate-400">Rate: </span>
          <span className="text-emerald-400 font-medium">{loan.interestRate}%</span>
        </div>
        <div>
          <span className="text-slate-400">Term: </span>
          <span className="text-white">{loan.termMonths} months</span>
        </div>
      </div>

      {loan.status === 'FUNDING' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Funding Progress</span>
            <span className="text-emerald-400">{loan.fundingProgress}%</span>
          </div>
          <Progress value={loan.fundingProgress} className="h-1.5" />
        </div>
      )}
    </Link>
  );
};

export default BorrowerDashboard;

