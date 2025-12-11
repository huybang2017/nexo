import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PiggyBank,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Percent,
  Target,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio, useMyInvestments } from "@/hooks/useInvestment";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Investment } from "@/types";

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

export const LenderDashboard = () => {
  const { user } = useAuth();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: investments, isLoading: investmentsLoading } = useMyInvestments(
    { size: 5 }
  );
  const { data: wallet, isLoading: walletLoading } = useWallet();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {user?.firstName || "Investor"}! 📈
          </h1>
          <p className="text-slate-400 mt-1">
            Your investment portfolio at a glance
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
        >
          <Link to="/dashboard/marketplace">
            <Target className="w-4 h-4 mr-2" />
            Browse Loans
          </Link>
        </Button>
      </motion.div>

      {/* KYC Alert */}
      {user?.kycStatus !== "APPROVED" && (
        <motion.div variants={item}>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-amber-200 font-medium">
                  Complete your KYC verification
                </p>
                <p className="text-amber-300/70 text-sm">
                  {user?.kycStatus === "PENDING"
                    ? "Your KYC is under review. We'll notify you once it's approved."
                    : "Verify your identity to start investing."}
                </p>
              </div>
              {user?.kycStatus !== "PENDING" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                >
                  <Link to="/dashboard/kyc">Start KYC</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Wallet Balance */}
        <Card className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Available Balance</p>
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
              Deposit funds
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Invested</p>
                {portfolioLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(portfolio?.totalInvested || 0)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected Returns */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Expected Returns</p>
                {portfolioLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(portfolio?.totalExpectedReturn || 0)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Rate */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg. Interest Rate</p>
                {portfolioLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {portfolio?.averageInterestRate?.toFixed(1) || 0}%
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio Summary & Risk Distribution */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Portfolio Health */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div>
                    <p className="text-slate-400 text-sm">Active Investments</p>
                    <p className="text-xl font-bold text-white">
                      {portfolio?.totalActiveInvestments || 0}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div>
                    <p className="text-slate-400 text-sm">Completed</p>
                    <p className="text-xl font-bold text-white">
                      {portfolio?.totalCompletedInvestments || 0}
                    </p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">
                    Completed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div>
                    <p className="text-slate-400 text-sm">Actual Returns</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {formatCurrency(portfolio?.totalActualReturn || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">
                      Portfolio Health
                    </span>
                    <Badge
                      className={cn(
                        portfolio?.portfolioHealth === "GOOD"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : portfolio?.portfolioHealth === "MODERATE"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {portfolio?.portfolioHealth || "N/A"}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : portfolio?.riskDistribution ? (
              Object.entries(portfolio.riskDistribution).map(
                ([grade, percentage]) => (
                  <div key={grade} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 font-medium">
                        Grade {grade}
                      </span>
                      <span className="text-slate-400">{percentage}%</span>
                    </div>
                    <Progress value={percentage as number} className="h-2" />
                  </div>
                )
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No investments yet</p>
                <Button
                  asChild
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600"
                >
                  <Link to="/dashboard/marketplace">Start Investing</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Investments */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Investments</CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <Link to="/dashboard/portfolio">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {investmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : investments?.content.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No investments yet</p>
                <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
                  <Link to="/dashboard/marketplace">Browse Loans</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {investments?.content.map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const InvestmentCard: React.FC<{ investment: Investment }> = ({
  investment,
}) => {
  const statusConfig: Record<string, { color: string }> = {
    ACTIVE: { color: "text-emerald-400 bg-emerald-400/10" },
    COMPLETED: { color: "text-blue-400 bg-blue-400/10" },
    CANCELLED: { color: "text-red-400 bg-red-400/10" },
  };

  const config = statusConfig[investment.status] || statusConfig.ACTIVE;

  return (
    <Link
      to={`/dashboard/portfolio`}
      className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-medium">{investment.loanTitle}</p>
          <p className="text-slate-500 text-sm">{investment.investmentCode}</p>
        </div>
        <Badge className={config.color}>{investment.status}</Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-slate-400">Invested: </span>
          <span className="text-white font-medium">
            {formatCurrency(investment.amount)}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Rate: </span>
          <span className="text-emerald-400 font-medium">
            {investment.interestRate}%
          </span>
        </div>
        <div>
          <span className="text-slate-400">Expected: </span>
          <span className="text-emerald-400">
            {formatCurrency(investment.expectedReturn)}
          </span>
        </div>
      </div>

      {investment.status === "ACTIVE" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Return Progress</span>
            <span className="text-emerald-400">
              {investment.returnProgress}%
            </span>
          </div>
          <Progress value={investment.returnProgress} className="h-1.5" />
        </div>
      )}
    </Link>
  );
};

export default LenderDashboard;
