import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLoan,
  useRepaymentSchedule,
  useCancelLoan,
  useLoanDocuments,
  useUploadLoanDocument,
  useDeleteLoanDocument,
} from "@/hooks/useLoan";
import { loanService } from "@/services/loan.service";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Percent,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Upload,
  Trash2,
  Eye,
} from "lucide-react";

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loanData, isLoading: loanLoading } = useLoan(Number(id));
  const { data: scheduleData } = useRepaymentSchedule(Number(id));
  const { data: documentsData } = useLoanDocuments(Number(id));
  const { data: investmentsData } = useQuery({
    queryKey: ["loanInvestments", Number(id)],
    queryFn: () => loanService.getLoanInvestments(Number(id)),
    enabled: !!id,
  });
  const cancelLoan = useCancelLoan();
  const uploadDocument = useUploadLoanDocument();
  const deleteDocument = useDeleteLoanDocument();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("ID_CARD");
  const [uploadDescription, setUploadDescription] = useState("");

  const loan = loanData;
  const schedules = scheduleData || [];
  const documents = documentsData || [];
  const investments = investmentsData || [];

  const canCancel =
    loan && (loan.status === "DRAFT" || loan.status === "PENDING_REVIEW");
  const canUploadDocuments =
    loan &&
    (loan.status === "DRAFT" ||
      loan.status === "PENDING_REVIEW" ||
      loan.status === "APPROVED");

  const handleUploadDocument = async () => {
    if (!uploadFile || !loan) return;
    try {
      await uploadDocument.mutateAsync({
        loanId: loan.id,
        file: uploadFile,
        documentType: uploadType,
        description: uploadDescription || undefined,
      });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadType("ID_CARD");
      setUploadDescription("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument.mutateAsync(documentId);
  };

  const handleCancelLoan = async () => {
    if (!loan) return;
    try {
      await cancelLoan.mutateAsync(loan.id);
      setShowCancelDialog(false);
      navigate("/dashboard/loans");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loanLoading) {
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
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Loan not found</h2>
        <Button asChild>
          <Link to="/dashboard/loans">Back to My Loans</Link>
        </Button>
      </div>
    );
  }

  const fundingProgress =
    loan.requestedAmount > 0
      ? (loan.fundedAmount / loan.requestedAmount) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{loan.title}</h1>
            <Badge variant={loan.status === "ACTIVE" ? "default" : "secondary"}>
              {loan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{loan.loanCode}</p>
        </div>
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={cancelLoan.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Loan
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-2xl">₫</span>
              <span className="text-sm">Loan Amount</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.requestedAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-sm">Interest Rate</span>
            </div>
            <div className="text-2xl font-bold">{loan.interestRate}%/year</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Term</span>
            </div>
            <div className="text-2xl font-bold">{loan.termMonths} months</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Risk Grade</span>
            </div>
            <div className="text-2xl font-bold">{loan.riskGrade || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Funding Progress (if funding) */}
      {loan.status === "FUNDING" && (
        <Card>
          <CardHeader>
            <CardTitle>Funding Progress</CardTitle>
            <CardDescription>
              {formatCurrency(loan.fundedAmount)} of{" "}
              {formatCurrency(loan.requestedAmount)} funded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={fundingProgress} className="h-3 mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{fundingProgress.toFixed(1)}% funded</span>
              {loan.fundingDeadline && (
                <span>Deadline: {formatDate(loan.fundingDeadline)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Loan Details</TabsTrigger>
          <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Purpose</div>
                  <div className="font-medium">{loan.purpose}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Platform Fee
                  </div>
                  <div className="font-medium">{loan.platformFeeRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Created At
                  </div>
                  <div className="font-medium">
                    {formatDate(loan.createdAt)}
                  </div>
                </div>
                {loan.disbursedAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Disbursed At
                    </div>
                    <div className="font-medium">
                      {formatDate(loan.disbursedAt)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Description
                </div>
                <p className="text-sm">{loan.description}</p>
              </div>

              {loan.status === "REJECTED" && loan.rejectionReason && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="text-sm font-medium text-destructive mb-1">
                    Rejection Reason
                  </div>
                  <p className="text-sm text-destructive">
                    {loan.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {loan.status === "ACTIVE" && (
            <Card>
              <CardHeader>
                <CardTitle>Repayment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Repaid
                    </div>
                    <div className="text-xl font-bold text-green-500">
                      {formatCurrency(loan.totalRepaid || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Interest Paid
                    </div>
                    <div className="text-xl font-bold">
                      {formatCurrency(loan.totalInterestPaid || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Remaining
                    </div>
                    <div className="text-xl font-bold">
                      {formatCurrency(
                        loan.fundedAmount - (loan.totalRepaid || 0)
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Repayment Schedule</CardTitle>
              <CardDescription>
                Monthly payment schedule for your loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Repayment schedule will be generated after loan disbursement
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule: any) => {
                      const isPaid = schedule.repayment !== null;
                      const isOverdue =
                        !isPaid && new Date(schedule.dueDate) < new Date();

                      return (
                        <TableRow key={schedule.id}>
                          <TableCell>{schedule.installmentNumber}</TableCell>
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
                          <TableCell className="text-center">
                            {isPaid ? (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Paid
                              </Badge>
                            ) : isOverdue ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isPaid && (
                              <Button size="sm" asChild>
                                <Link
                                  to={`/dashboard/loans/${loan.id}/repay/${schedule.id}`}
                                >
                                  Pay Now
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors">
          <Card>
            <CardHeader>
              <CardTitle>Investors</CardTitle>
              <CardDescription>
                People who invested in your loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>No investors yet</p>
                  <p className="text-sm">
                    Total investors: {loan.investorCount || 0}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investment Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">
                        Interest Rate
                      </TableHead>
                      <TableHead className="text-right">
                        Expected Return
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invested At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment: any) => (
                      <TableRow key={investment.id}>
                        <TableCell className="font-mono text-sm">
                          {investment.investmentCode}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(investment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {investment.interestRate}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(investment.expectedReturn)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              investment.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {investment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(investment.investedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loan Documents</CardTitle>
                  <CardDescription>
                    Supporting documents for your loan application
                  </CardDescription>
                </div>
                {canUploadDocuments && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
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
                      <div className="flex items-center gap-2">
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
                        {canUploadDocuments && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deleteDocument.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Loan Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Loan Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this loan request? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Loan Code:</span> {loan?.loanCode}
              </div>
              <div className="text-sm">
                <span className="font-medium">Title:</span> {loan?.title}
              </div>
              <div className="text-sm">
                <span className="font-medium">Amount:</span>{" "}
                {loan && formatCurrency(loan.requestedAmount)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelLoan.isPending}
            >
              No, Keep Loan
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelLoan}
              disabled={cancelLoan.isPending}
            >
              {cancelLoan.isPending ? "Cancelling..." : "Yes, Cancel Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a supporting document for your loan application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID_CARD">ID Card / Passport</SelectItem>
                  <SelectItem value="INCOME_PROOF">Income Proof</SelectItem>
                  <SelectItem value="OTHER">Other Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Max 50MB. PDF, JPEG, PNG only.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the document"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploadDocument.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={!uploadFile || uploadDocument.isPending}
            >
              {uploadDocument.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
