import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyLoans, useCancelLoan } from "@/hooks/useLoan";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
} from "lucide-react";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  DRAFT: { label: "Draft", variant: "outline", icon: FileText },
  PENDING_REVIEW: {
    label: "Pending Review",
    variant: "secondary",
    icon: Clock,
  },
  APPROVED: { label: "Approved", variant: "default", icon: CheckCircle },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  FUNDING: { label: "Funding", variant: "default", icon: Clock },
  FUNDED: { label: "Funded", variant: "default", icon: CheckCircle },
  ACTIVE: { label: "Active", variant: "default", icon: CheckCircle },
  COMPLETED: { label: "Completed", variant: "secondary", icon: CheckCircle },
  DEFAULTED: { label: "Defaulted", variant: "destructive", icon: AlertCircle },
  CANCELLED: { label: "Cancelled", variant: "outline", icon: XCircle },
};

export default function MyLoansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelLoanId, setCancelLoanId] = useState<number | null>(null);
  const { data, isLoading } = useMyLoans();
  const cancelLoan = useCancelLoan();

  const loans = data?.content || [];

  const handleCancelClick = (loanId: number) => {
    setCancelLoanId(loanId);
  };

  const handleConfirmCancel = async () => {
    if (cancelLoanId === null) return;
    try {
      await cancelLoan.mutateAsync(cancelLoanId);
      setCancelLoanId(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const loanToCancel = loans.find((l: any) => l.id === cancelLoanId);

  const filteredLoans = loans.filter((loan: any) => {
    const matchesSearch =
      loan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loanCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeLoans = loans.filter((l: any) =>
    ["FUNDING", "ACTIVE"].includes(l.status)
  );
  const pendingLoans = loans.filter((l: any) =>
    ["PENDING_REVIEW", "APPROVED"].includes(l.status)
  );
  const completedLoans = loans.filter((l: any) =>
    ["COMPLETED", "REJECTED", "CANCELLED"].includes(l.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Loans</h1>
          <p className="text-muted-foreground">Manage your loan requests</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/loans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Loan Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeLoans.length}</div>
            <div className="text-sm text-muted-foreground">Active Loans</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingLoans.length}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{completedLoans.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="FUNDING">Funding</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loans List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : filteredLoans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No loans found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first loan request to get started"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button asChild>
                <Link to="/dashboard/loans/new">Create Loan Request</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLoans.map((loan: any) => {
            const status = statusConfig[loan.status] || statusConfig.DRAFT;
            const fundingProgress =
              loan.requestedAmount > 0
                ? (loan.fundedAmount / loan.requestedAmount) * 100
                : 0;

            return (
              <Card key={loan.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {loan.loanCode}
                        </span>
                      </div>
                      <h3 className="font-semibold truncate mb-1">
                        {loan.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>
                          Amount: {formatCurrency(loan.requestedAmount)}
                        </span>
                        <span>Rate: {loan.interestRate}%/year</span>
                        <span>Term: {loan.termMonths} months</span>
                      </div>
                    </div>

                    {loan.status === "FUNDING" && (
                      <div className="w-full lg:w-48">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Funding Progress</span>
                          <span>{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={fundingProgress} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(loan.fundedAmount)} /{" "}
                          {formatCurrency(loan.requestedAmount)}
                        </div>
                      </div>
                    )}

                    {loan.status === "ACTIVE" && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Total Repaid
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(loan.totalRepaid || 0)}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {(loan.status === "DRAFT" ||
                        loan.status === "PENDING_REVIEW") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(loan.id)}
                          disabled={cancelLoan.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/loans/${loan.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Loan Dialog */}
      <Dialog
        open={cancelLoanId !== null}
        onOpenChange={(open) => !open && setCancelLoanId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Loan Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this loan request? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {loanToCancel && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Loan Code:</span>{" "}
                  {loanToCancel.loanCode}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Title:</span>{" "}
                  {loanToCancel.title}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Amount:</span>{" "}
                  {formatCurrency(loanToCancel.requestedAmount)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelLoanId(null)}
              disabled={cancelLoan.isPending}
            >
              No, Keep Loan
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelLoan.isPending}
            >
              {cancelLoan.isPending ? "Cancelling..." : "Yes, Cancel Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
