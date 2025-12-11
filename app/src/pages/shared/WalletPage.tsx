import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  History,
  CreditCard,
  Building,
  Loader2,
  Eye,
} from "lucide-react";
import {
  useWallet,
  useTransactions,
  useDeposit,
  useWithdraw,
  useTransaction,
} from "@/hooks/useWallet";
import { useMyInvestments } from "@/hooks/useInvestment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  Transaction,
  PaymentProvider,
  TransactionType,
  TransactionStatus,
} from "@/types";
import { Filter } from "lucide-react";

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

export const WalletPage = () => {
  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useWallet();
  const [transactionFilters, setTransactionFilters] = useState<{
    type?: TransactionType;
    status?: TransactionStatus;
  }>({});
  const {
    data: transactions,
    isLoading: txLoading,
    refetch: refetchTransactions,
  } = useTransactions({
    type: transactionFilters.type,
    status: transactionFilters.status,
    size: 20,
  });
  const { data: investmentsData } = useMyInvestments();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);

  // Calculate locked balance from active investments
  const investments = investmentsData?.content || [];
  const activeInvestments = investments.filter(
    (i: any) => i.status === "ACTIVE"
  );
  const lockedInInvestments = activeInvestments.reduce(
    (sum: number, inv: any) => sum + (inv.amount || 0),
    0
  );

  // Calculate total balance = available + locked (in investments)
  const totalBalance = (wallet?.availableBalance || 0) + lockedInInvestments;

  // Refetch when page becomes visible (user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchWallet();
        refetchTransactions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetchWallet, refetchTransactions]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Wallet</h1>
          <p className="text-slate-400 mt-1">Manage your funds</p>
        </div>
        <div className="flex gap-3">
          <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
          <WithdrawDialog
            open={withdrawOpen}
            onOpenChange={setWithdrawOpen}
            availableBalance={wallet?.availableBalance || 0}
          />
        </div>
      </motion.div>

      {/* Balance Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Available Balance</p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-40 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Locked Balance</p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-32 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-amber-400">
                    {formatCurrency(lockedInInvestments)}
                  </p>
                )}
                <p className="text-slate-500 text-xs mt-1">
                  In active investments/loans
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Balance</p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-36 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(totalBalance)}
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Building className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Transaction History
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select
                  value={transactionFilters.type || "ALL"}
                  onValueChange={(value) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      type:
                        value === "ALL"
                          ? undefined
                          : (value as TransactionType),
                    }))
                  }
                >
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                    <SelectItem value="INVESTMENT">Investment</SelectItem>
                    <SelectItem value="INVESTMENT_RETURN">
                      Investment Return
                    </SelectItem>
                    <SelectItem value="REPAYMENT_PAID">
                      Repayment Paid
                    </SelectItem>
                    <SelectItem value="REPAYMENT_RECEIVED">
                      Repayment Received
                    </SelectItem>
                    <SelectItem value="LOAN_DISBURSEMENT">
                      Loan Disbursement
                    </SelectItem>
                    <SelectItem value="FEE">Fee</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={transactionFilters.status || "ALL"}
                  onValueChange={(value) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      status:
                        value === "ALL"
                          ? undefined
                          : (value as TransactionStatus),
                    }))
                  }
                >
                  <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions?.content.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions?.content.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onViewDetail={setSelectedTransactionId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Detail Dialog */}
      {selectedTransactionId && (
        <TransactionDetailDialog
          transactionId={selectedTransactionId}
          open={!!selectedTransactionId}
          onOpenChange={(open) => !open && setSelectedTransactionId(null)}
        />
      )}
    </motion.div>
  );
};

const TransactionItem: React.FC<{
  transaction: Transaction;
  onViewDetail: (id: number) => void;
}> = ({ transaction, onViewDetail }) => {
  const isIncoming = [
    "DEPOSIT",
    "INVESTMENT_RETURN",
    "REPAYMENT_RECEIVED",
    "LOAN_DISBURSEMENT",
    "REFUND",
  ].includes(transaction.type);

  const statusColors: Record<string, string> = {
    COMPLETED: "text-emerald-400 bg-emerald-400/10",
    PENDING: "text-amber-400 bg-amber-400/10",
    FAILED: "text-red-400 bg-red-400/10",
    CANCELLED: "text-slate-400 bg-slate-400/10",
  };

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group"
      onClick={() => onViewDetail(transaction.id)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isIncoming ? "bg-emerald-500/20" : "bg-red-500/20"
          )}
        >
          {isIncoming ? (
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">
            {transaction.type.replace(/_/g, " ")}
          </p>
          <p className="text-slate-500 text-sm">{transaction.referenceCode}</p>
          {transaction.description && (
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
              {transaction.description}
            </p>
          )}
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        <div>
          <p
            className={cn(
              "font-semibold",
              isIncoming ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isIncoming ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
          <div className="flex items-center gap-2 justify-end mt-1">
            <Badge
              className={
                statusColors[transaction.status] || statusColors.PENDING
              }
            >
              {transaction.status}
            </Badge>
            <span className="text-slate-500 text-xs">
              {formatDate(transaction.createdAt)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(transaction.id);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepositDialog: React.FC<DepositDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("VNPAY");
  const deposit = useDeposit();
  const queryClient = useQueryClient();

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    deposit.mutate(
      { amount: parseFloat(amount), provider },
      {
        onSuccess: () => {
          setAmount("");
          onOpenChange(false);
          // Invalidate and refetch wallet after deposit
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.refetchQueries({ queryKey: ["wallet"] });
          queryClient.refetchQueries({ queryKey: ["transactions"] });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Deposit Funds</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add money to your wallet using VNPay or MoMo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Amount (VND)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
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
                >
                  {formatCurrency(preset, true)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Payment Method</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as PaymentProvider)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="VNPAY">VNPay</SelectItem>
                <SelectItem value="MOMO">MoMo</SelectItem>
                <SelectItem value="STRIPE">Stripe (Visa/Mastercard)</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={!amount || deposit.isPending}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {deposit.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const withdraw = useWithdraw();

  const handleWithdraw = async () => {
    if (!amount || !bankName || !accountNumber || !accountHolder) return;

    withdraw.mutate(
      {
        amount: parseFloat(amount),
        bankName,
        bankAccountNumber: accountNumber,
        bankAccountHolder: accountHolder,
      },
      {
        onSuccess: () => {
          setAmount("");
          setBankName("");
          setAccountNumber("");
          setAccountHolder("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
        >
          <Minus className="w-4 h-4 mr-2" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Withdraw Funds</DialogTitle>
          <DialogDescription className="text-slate-400">
            Transfer money to your bank account. Available:{" "}
            {formatCurrency(availableBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Amount (VND)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={availableBalance}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Bank Name</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="VIETCOMBANK">Vietcombank</SelectItem>
                <SelectItem value="TECHCOMBANK">Techcombank</SelectItem>
                <SelectItem value="MBBANK">MB Bank</SelectItem>
                <SelectItem value="VPBANK">VPBank</SelectItem>
                <SelectItem value="ACBBANK">ACB</SelectItem>
                <SelectItem value="BIDV">BIDV</SelectItem>
                <SelectItem value="AGRIBANK">Agribank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Account Number</Label>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Account Holder Name</Label>
            <Input
              placeholder="Enter account holder name"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={
              !amount ||
              !bankName ||
              !accountNumber ||
              !accountHolder ||
              withdraw.isPending
            }
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {withdraw.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface TransactionDetailDialogProps {
  transactionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  transactionId,
  open,
  onOpenChange,
}) => {
  const { data: transaction, isLoading } = useTransaction(transactionId);

  const isIncoming =
    transaction &&
    [
      "DEPOSIT",
      "INVESTMENT_RETURN",
      "REPAYMENT_RECEIVED",
      "LOAN_DISBURSEMENT",
      "REFUND",
    ].includes(transaction.type);

  const statusColors: Record<string, string> = {
    COMPLETED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    FAILED: "text-red-400 bg-red-400/10 border-red-400/20",
    CANCELLED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Transaction Type & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isIncoming ? "bg-emerald-500/20" : "bg-red-500/20"
                  )}
                >
                  {isIncoming ? (
                    <ArrowDownRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {transaction.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {transaction.referenceCode}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  "px-3 py-1 border",
                  statusColors[transaction.status] || statusColors.PENDING
                )}
              >
                {transaction.status}
              </Badge>
            </div>

            <Separator className="bg-slate-700" />

            {/* Amount */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount</span>
                <span
                  className={cn(
                    "text-2xl font-bold",
                    isIncoming ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {isIncoming ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              {transaction.fee && transaction.fee > 0 && (
                <>
                  <Separator className="bg-slate-700 my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-slate-300">
                      -{formatCurrency(transaction.fee)}
                    </span>
                  </div>
                  <Separator className="bg-slate-700 my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      Net Amount
                    </span>
                    <span
                      className={cn(
                        "text-xl font-semibold",
                        isIncoming ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {isIncoming ? "+" : "-"}
                      {formatCurrency(transaction.netAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Date</p>
                <p className="text-white">
                  {formatDate(transaction.createdAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Currency</p>
                <p className="text-white">{transaction.currency || "VND"}</p>
              </div>
              {transaction.loanCode && (
                <div className="space-y-1">
                  <p className="text-slate-400 text-sm">Loan Code</p>
                  <p className="text-white">{transaction.loanCode}</p>
                </div>
              )}
              {transaction.investmentCode && (
                <div className="space-y-1">
                  <p className="text-slate-400 text-sm">Investment Code</p>
                  <p className="text-white">{transaction.investmentCode}</p>
                </div>
              )}
            </div>

            {/* Balance Info */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-3">Balance Changes</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs">Before</p>
                  <p className="text-white font-medium">
                    {formatCurrency(transaction.balanceBefore)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs">After</p>
                  <p className="text-white font-medium">
                    {formatCurrency(transaction.balanceAfter)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {transaction.description && (
              <div className="space-y-2">
                <p className="text-slate-400 text-sm">Description</p>
                <p className="text-slate-300 bg-slate-800/50 rounded-lg p-3">
                  {transaction.description}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Transaction not found</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WalletPage;
