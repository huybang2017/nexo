import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRepaymentSchedule, useLoanDocuments } from "@/hooks/useLoan";
import { useReviewLoan, useAdminLoan } from "@/hooks/useAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, FileText, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING_REVIEW: { label: "Pending Review", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  FUNDING: { label: "Funding", variant: "default" },
  ACTIVE: { label: "Active", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
  DEFAULTED: { label: "Defaulted", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

const purposeLabels: Record<string, string> = {
  PERSONAL: "💼 Personal",
  BUSINESS: "🏢 Business",
  EDUCATION: "📚 Education",
  MEDICAL: "🏥 Medical",
  HOME_IMPROVEMENT: "🏠 Home Improvement",
  DEBT_CONSOLIDATION: "💳 Debt Consolidation",
  STARTUP: "🚀 Startup",
  OTHER: "📝 Other",
};

export default function AdminLoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading } = useAdminLoan(Number(id));
  const { data: schedules } = useRepaymentSchedule(Number(id));
  const { data: documents = [], isLoading: isLoadingDocuments } =
    useLoanDocuments(Number(id));
  const reviewLoan = useReviewLoan();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [note, setNote] = useState("");

  const handleApprove = async () => {
    try {
      await reviewLoan.mutateAsync({
        id: Number(id),
        data: { action: "APPROVE", note: note || undefined },
      });
      setShowApproveDialog(false);
      setNote("");
      navigate("/admin/loans");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await reviewLoan.mutateAsync({
        id: Number(id),
        data: { action: "REJECT", rejectionReason, note: note || undefined },
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setNote("");
      navigate("/admin/loans");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <Card className="animate-pulse">
          <CardContent className="h-64" />
        </Card>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loan not found</p>
            <Button asChild className="mt-4">
              <Link to="/admin/loans">Back to Loans Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[loan.status] || statusConfig.PENDING_REVIEW;
  const fundingProgress =
    loan.requestedAmount > 0
      ? (loan.fundedAmount / loan.requestedAmount) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{loan.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {loan.loanCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {loan.status === "PENDING_REVIEW" && (
            <>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium">
                    {purposeLabels[loan.purpose] || loan.purpose}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Requested Amount
                  </p>
                  <p className="font-medium">
                    {formatCurrency(loan.requestedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{loan.interestRate}% per year</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-medium">{loan.termMonths} months</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Grade</p>
                  <Badge variant="outline">{loan.riskGrade}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Score</p>
                  <p className="font-medium">
                    {loan.creditScoreAtRequest || "N/A"}
                  </p>
                </div>
              </div>
              {loan.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm">{loan.description}</p>
                </div>
              )}
              {loan.rejectionReason && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm">{loan.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funding Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Funded</span>
                  <span className="font-medium">
                    {formatCurrency(loan.fundedAmount)} /{" "}
                    {formatCurrency(loan.requestedAmount)}
                  </span>
                </div>
                <Progress value={fundingProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {fundingProgress.toFixed(1)}% funded
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-medium">
                    {formatCurrency(loan.remainingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Investors</p>
                  <p className="font-medium">{loan.investorCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repayment Schedule */}
          {schedules && schedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Repayment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule: any) => (
                      <TableRow key={schedule.id}>
                        <TableCell>#{schedule.installmentNumber}</TableCell>
                        <TableCell>{formatDate(schedule.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(schedule.principalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(schedule.interestAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(schedule.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              schedule.repayment ? "default" : "secondary"
                            }
                          >
                            {schedule.repayment ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Loan Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-muted-foreground">
                            {doc.documentType}{" "}
                            {doc.description && `• ${doc.description}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`http://localhost:8080${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Borrower Information */}
          <Card>
            <CardHeader>
              <CardTitle>Borrower Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{loan.borrowerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Score</p>
                <p className="font-medium">
                  {loan.borrowerCreditScore || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loan Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(loan.createdAt)}</p>
              </div>
              {loan.fundingDeadline && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Funding Deadline
                  </p>
                  <p className="font-medium">
                    {formatDate(loan.fundingDeadline)}
                  </p>
                </div>
              )}
              {loan.disbursedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Disbursed</p>
                  <p className="font-medium">{formatDate(loan.disbursedAt)}</p>
                </div>
              )}
              {loan.maturityDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Maturity Date</p>
                  <p className="font-medium">{formatDate(loan.maturityDate)}</p>
                </div>
              )}
              {loan.nextRepaymentDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Next Repayment
                  </p>
                  <p className="font-medium">
                    {formatDate(loan.nextRepaymentDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Amount: {formatCurrency(loan.nextRepaymentAmount || 0)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {(loan.totalRepaid || loan.totalInterestPaid) && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loan.totalRepaid && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Repaid
                    </p>
                    <p className="font-medium">
                      {formatCurrency(loan.totalRepaid)}
                    </p>
                  </div>
                )}
                {loan.totalInterestPaid && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Interest Paid
                    </p>
                    <p className="font-medium">
                      {formatCurrency(loan.totalInterestPaid)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this loan? This will make it
              available for funding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this approval..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={reviewLoan.isPending}
            >
              {reviewLoan.isPending ? "Approving..." : "Approve Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this loan. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="rejectNote">Note (optional)</Label>
              <Textarea
                id="rejectNote"
                placeholder="Add additional notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewLoan.isPending || !rejectionReason.trim()}
            >
              {reviewLoan.isPending ? "Rejecting..." : "Reject Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
