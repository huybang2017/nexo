import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  CreditCard,
  User,
  Calendar,
  TrendingUp,
  Shield,
  Clock,
  Users,
  DollarSign,
  Loader2,
  Info,
  CheckCircle2,
  FileText,
  Eye,
} from 'lucide-react';
import { useMarketplaceLoanDetail, useLoanDocuments } from '@/hooks/useLoan';
import { useCreateInvestment } from '@/hooks/useInvestment';
import { useWallet } from '@/hooks/useWallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn, formatCurrency, formatDate, calculateLoanMonthlyPayment } from '@/lib/utils';

const riskGradeColors: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  B: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  C: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  D: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  E: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  F: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

const purposeLabels: Record<string, string> = {
  PERSONAL: '💼 Personal',
  BUSINESS: '🏢 Business',
  EDUCATION: '📚 Education',
  MEDICAL: '🏥 Medical',
  HOME_IMPROVEMENT: '🏠 Home Improvement',
  DEBT_CONSOLIDATION: '💳 Debt Consolidation',
  STARTUP: '🚀 Startup',
  OTHER: '📝 Other',
};

export const LoanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading } = useMarketplaceLoanDetail(Number(id));
  const { data: documents } = useLoanDocuments(Number(id));
  const { data: wallet } = useWallet();
  const [investDialogOpen, setInvestDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Loan not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
      </div>
    );
  }

  const riskColors = riskGradeColors[loan.riskGrade] || riskGradeColors.C;
  const monthlyPayment = calculateLoanMonthlyPayment(loan.requestedAmount, loan.interestRate, loan.termMonths);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{loan.title}</h1>
            <p className="text-slate-400">{loan.loanCode}</p>
          </div>
        </div>
        <Badge className={cn('text-lg px-4 py-1 border', riskColors.bg, riskColors.text, riskColors.border)}>
          Grade {loan.riskGrade}
        </Badge>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="details">Loan Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loan Details Card */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
              {/* Amount & Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Funding Progress</span>
                  <span className="text-emerald-400 font-semibold">{loan.fundingProgress}%</span>
                </div>
                <Progress value={loan.fundingProgress} className="h-3" />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-slate-500">
                    {formatCurrency(loan.fundedAmount)} raised
                  </span>
                  <span className="text-slate-500">
                    {formatCurrency(loan.remainingAmount)} remaining
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
                  <p className="text-slate-400 text-sm">Amount</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(loan.requestedAmount, true)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <TrendingUp className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-slate-400 text-sm">Interest Rate</p>
                  <p className="text-xl font-bold text-emerald-400">{loan.interestRate}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <Clock className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-slate-400 text-sm">Term</p>
                  <p className="text-xl font-bold text-white">{loan.termMonths} months</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <Users className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-slate-400 text-sm">Investors</p>
                  <p className="text-xl font-bold text-white">{loan.investorCount}</p>
                </div>
              </div>

              {/* Purpose & Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-800">{purposeLabels[loan.purpose] || loan.purpose}</Badge>
                </div>
                {loan.description && (
                  <p className="text-slate-400">{loan.description}</p>
                )}
              </div>

              {/* Deadline */}
              {loan.fundingDeadline && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Calendar className="w-5 h-5" />
                    <span>Funding deadline: {formatDate(loan.fundingDeadline)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Borrower Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Borrower Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {loan.borrowerName.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{loan.borrowerName}</p>
                  <p className="text-slate-500 text-sm">Verified Borrower</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-sm">Credit Score</p>
                  <p className="text-xl font-bold text-white">{loan.borrowerCreditScore || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-sm">Member Since</p>
                  <p className="text-white font-medium">{formatDate(loan.createdAt, { year: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Panel */}
        <div>
          <Card className="bg-slate-900/50 border-slate-800 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Invest in This Loan
              </CardTitle>
              <CardDescription>
                Earn {loan.interestRate}% annual interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Your Balance</span>
                  <span className="text-white font-medium">{formatCurrency(wallet?.availableBalance || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Min. Investment</span>
                  <span className="text-white font-medium">{formatCurrency(100000)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Max. Available</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(loan.remainingAmount)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">Est. Monthly Return</span>
                  <span className="text-white font-bold">
                    {formatCurrency(Math.round((100000 * loan.interestRate / 100) / 12))}
                  </span>
                </div>
                <p className="text-emerald-400/70 text-xs">
                  Based on ₫100,000 investment at {loan.interestRate}% p.a.
                </p>
              </div>

              <InvestDialog
                loan={loan}
                wallet={wallet}
                open={investDialogOpen}
                onOpenChange={setInvestDialogOpen}
              />

              <div className="flex items-start gap-2 text-slate-500 text-xs">
                <Shield className="w-4 h-4 mt-0.5" />
                <span>Your investment is protected by our platform guarantee policy.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Loan Documents
              </CardTitle>
              <CardDescription>Supporting documents for this loan application</CardDescription>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-800/50 border-slate-700">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-white">{doc.fileName}</div>
                          <div className="text-sm text-slate-400">
                            {doc.documentType} {doc.description && `• ${doc.description}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(doc.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-slate-700 hover:bg-slate-800"
                      >
                        <a href={`http://localhost:8080${doc.fileUrl}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

interface InvestDialogProps {
  loan: any;
  wallet: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvestDialog: React.FC<InvestDialogProps> = ({ loan, wallet, open, onOpenChange }) => {
  const [amount, setAmount] = useState('');
  const createInvestment = useCreateInvestment();

  const investmentAmount = parseFloat(amount) || 0;
  const expectedReturn = investmentAmount * (1 + (loan.interestRate / 100) * (loan.termMonths / 12));
  const profit = expectedReturn - investmentAmount;

  const handleInvest = () => {
    if (!amount || investmentAmount < 100000) return;

    createInvestment.mutate(
      { loanId: loan.id, amount: investmentAmount },
      {
        onSuccess: () => {
          setAmount('');
          onOpenChange(false);
        },
      }
    );
  };

  const canInvest = 
    investmentAmount >= 100000 && 
    investmentAmount <= loan.remainingAmount && 
    investmentAmount <= (wallet?.availableBalance || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold">
          Invest Now
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Confirm Investment</DialogTitle>
          <DialogDescription className="text-slate-400">
            Invest in: {loan.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Investment Amount (VND)</Label>
            <Input
              type="number"
              placeholder="Enter amount (min ₫100,000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <div className="flex gap-2 flex-wrap">
              {[100000, 500000, 1000000, 5000000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 text-slate-300"
                  onClick={() => setAmount(preset.toString())}
                  disabled={preset > loan.remainingAmount || preset > (wallet?.availableBalance || 0)}
                >
                  {formatCurrency(preset, true)}
                </Button>
              ))}
            </div>
          </div>

          {investmentAmount > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Investment</span>
                <span className="text-white font-medium">{formatCurrency(investmentAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Interest Rate</span>
                <span className="text-emerald-400">{loan.interestRate}% p.a.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Term</span>
                <span className="text-white">{loan.termMonths} months</span>
              </div>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expected Return</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(expectedReturn)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Est. Profit</span>
                  <span className="text-emerald-400">+{formatCurrency(profit)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <p className="text-blue-300 text-sm">
              This investment will be locked until the loan is fully repaid. Monthly returns will be credited to your wallet.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Cancel
          </Button>
          <Button
            onClick={handleInvest}
            disabled={!canInvest || createInvestment.isPending}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {createInvestment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Investment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailPage;

