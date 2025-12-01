import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditScoreGauge } from './CreditScoreGauge';
import { RiskLevelBadge } from './RiskLevelBadge';
import { 
  RefreshCw, 
  Shield, 
  Wallet, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useMyCreditScore, useRecalculateMyCreditScore } from '@/hooks/useCreditScore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CreditScoreCardProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function CreditScoreCard({ showDetails = true, compact = false }: CreditScoreCardProps) {
  const { data: creditScore, isLoading, error } = useMyCreditScore();
  const recalculate = useRecalculateMyCreditScore();

  if (isLoading) {
    return <CreditScoreCardSkeleton compact={compact} />;
  }

  if (error || !creditScore) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Unable to load credit score</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => recalculate.mutate()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Initialize Score
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (compact) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CreditScoreGauge
              score={creditScore.totalScore}
              maxScore={creditScore.maxScore}
              riskLevel={creditScore.riskLevel}
              size="sm"
              showLabels={false}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-white">{creditScore.totalScore}</span>
                <span className="text-zinc-500">/ {creditScore.maxScore}</span>
              </div>
              <RiskLevelBadge 
                riskLevel={creditScore.riskLevel} 
                riskGrade={creditScore.riskGrade}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-700/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-indigo-400" />
            Credit Score
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", recalculate.isPending && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Score Display */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <CreditScoreGauge
              score={creditScore.totalScore}
              maxScore={creditScore.maxScore}
              riskLevel={creditScore.riskLevel}
              size="md"
            />

            <div className="flex-1 space-y-4">
              <div>
                <RiskLevelBadge 
                  riskLevel={creditScore.riskLevel} 
                  riskGrade={creditScore.riskGrade}
                  size="lg"
                />
                <p className="text-zinc-400 mt-2 text-sm">
                  {creditScore.riskDescription}
                </p>
              </div>

              {/* Loan Eligibility */}
              <div className={cn(
                "p-3 rounded-lg border",
                creditScore.isEligibleForLoan 
                  ? "bg-emerald-500/10 border-emerald-500/30" 
                  : "bg-red-500/10 border-red-500/30"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {creditScore.isEligibleForLoan ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={cn(
                    "font-medium",
                    creditScore.isEligibleForLoan ? "text-emerald-400" : "text-red-400"
                  )}>
                    {creditScore.isEligibleForLoan ? 'Eligible for Loan' : 'Not Eligible'}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{creditScore.eligibilityReason}</p>
              </div>

              {/* Max Loan Amount */}
              {creditScore.isEligibleForLoan && (
                <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Maximum Loan Amount</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(creditScore.maxLoanAmount)}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-zinc-500">Interest Rate</p>
                    <p className="text-sm font-medium text-zinc-300">
                      {creditScore.minInterestRate}% - {creditScore.maxInterestRate}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Score Components */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Score Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScoreComponent 
                  label="Payment History" 
                  score={creditScore.components.paymentHistoryScore}
                  weight={creditScore.components.paymentHistoryWeight}
                />
                <ScoreComponent 
                  label="Credit Utilization" 
                  score={creditScore.components.creditUtilizationScore}
                  weight={creditScore.components.creditUtilizationWeight}
                />
                <ScoreComponent 
                  label="Credit History Length" 
                  score={creditScore.components.creditHistoryLengthScore}
                  weight={creditScore.components.creditHistoryLengthWeight}
                />
                <ScoreComponent 
                  label="Identity Verification" 
                  score={creditScore.components.identityVerificationScore}
                  weight={creditScore.components.identityVerificationWeight}
                />
                <ScoreComponent 
                  label="Income Stability" 
                  score={creditScore.components.incomeStabilityScore}
                  weight={creditScore.components.incomeStabilityWeight}
                />
                <ScoreComponent 
                  label="Behavior Score" 
                  score={creditScore.components.behaviorScore}
                  weight={creditScore.components.behaviorWeight}
                />
              </div>
            </div>
          )}

          {/* Statistics */}
          {showDetails && creditScore.statistics && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-400">Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem 
                  label="Loans Completed" 
                  value={creditScore.statistics.totalLoansCompleted}
                  icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
                />
                <StatItem 
                  label="On-Time Payments" 
                  value={`${creditScore.statistics.onTimePaymentRate.toFixed(1)}%`}
                  icon={<Clock className="w-4 h-4 text-blue-400" />}
                />
                <StatItem 
                  label="Late Payments" 
                  value={creditScore.statistics.totalLatePayments}
                  icon={<AlertCircle className="w-4 h-4 text-orange-400" />}
                />
                <StatItem 
                  label="Total Borrowed" 
                  value={formatCurrency(creditScore.statistics.totalAmountBorrowed)}
                  icon={<Wallet className="w-4 h-4 text-indigo-400" />}
                />
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
            <span>Last calculated: {new Date(creditScore.lastCalculatedAt).toLocaleDateString()}</span>
            <span>Next review: {new Date(creditScore.nextReviewAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreComponent({ label, score, weight }: { label: string; score: number; weight: number }) {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{score}/100</span>
      </div>
      <Progress value={score} className="h-2 bg-zinc-800" indicatorClassName={getColorClass(score)} />
      <p className="text-xs text-zinc-500">Weight: {weight} points</p>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function CreditScoreCardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="w-48 h-48 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

