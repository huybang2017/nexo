import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePortfolio, useMyInvestments } from "@/hooks/useInvestment";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  PiggyBank,
  Wallet,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

export default function PortfolioPage() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: investmentsData, isLoading: investmentsLoading } =
    useMyInvestments();

  const investments = investmentsData?.content || [];

  const activeInvestments = investments.filter(
    (i: any) => i.status === "ACTIVE"
  );
  const completedInvestments = investments.filter(
    (i: any) => i.status === "COMPLETED"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <p className="text-muted-foreground">
          Track your investments and returns
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm">Total Invested</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio?.totalInvested || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Expected Returns</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(portfolio?.expectedReturns || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Actual Returns</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(portfolio?.actualReturns || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm">Avg. Return Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {portfolio?.averageReturnRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeInvestments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInvestments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeInvestments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No active investments</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the marketplace to find investment opportunities
                </p>
                <Button asChild>
                  <Link to="/dashboard/marketplace">Browse Marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeInvestments.map((investment: any) => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedInvestments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No completed investments yet
              </CardContent>
            </Card>
          ) : (
            completedInvestments.map((investment: any) => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvestmentCard({ investment }: { investment: any }) {
  const returnProgress =
    investment.expectedReturn > 0
      ? (investment.actualReturn / investment.expectedReturn) * 100
      : 0;

  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={
                  investment.status === "ACTIVE" ? "default" : "secondary"
                }
              >
                {investment.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {investment.investmentCode}
              </span>
            </div>
            <h3 className="font-semibold truncate mb-1">
              {investment.loanTitle ||
                investment.loan?.title ||
                "Loan Investment"}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Invested: {formatCurrency(investment.amount)}</span>
              <span>Rate: {investment.interestRate}%/year</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(investment.investedAt)}
              </span>
            </div>
          </div>

          <div className="w-full lg:w-48">
            <div className="flex justify-between text-sm mb-1">
              <span>Returns</span>
              <span>{returnProgress.toFixed(0)}%</span>
            </div>
            <Progress value={returnProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className="text-green-500">
                {formatCurrency(investment.actualReturn)}
              </span>
              <span>{formatCurrency(investment.expectedReturn)}</span>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to={`/dashboard/marketplace/${investment.loanId}`}>
              Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
