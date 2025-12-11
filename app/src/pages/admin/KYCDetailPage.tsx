import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminKycDetail, useReviewKyc } from "@/hooks/useAdmin";
import {
  useCalculateKycScore,
  useRecalculateKycScore,
  useResolveFraudFlag,
} from "@/hooks/useKycScore";
import { kycScoreService } from "@/services/kycScore.service";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  User,
  CreditCard,
  Building,
  MapPin,
  Shield,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
import {
  KycScoreCard,
  KycRiskBadge,
  FraudFlagsList,
} from "@/components/kyc-score";
import type { KycScore, KycRiskLevel, DuplicateCheckResult } from "@/types";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  NOT_SUBMITTED: { label: "Not Submitted", variant: "outline" },
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export default function KYCDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kyc, isLoading } = useAdminKycDetail(Number(id));
  const reviewKyc = useReviewKyc();
  const calculateKycScore = useCalculateKycScore();
  const recalculateKycScore = useRecalculateKycScore();
  const resolveFraudFlag = useResolveFraudFlag();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [kycScore, setKycScore] = useState<KycScore | null>(null);
  const [duplicateCheck, setDuplicateCheck] =
    useState<DuplicateCheckResult | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const loadKycScore = useCallback(async () => {
    if (!kyc?.userId) return;
    setIsLoadingScore(true);
    try {
      const score = await kycScoreService.getKycScoreByUserId(kyc.userId);
      setKycScore(score);
    } catch (error) {
      console.log("No KYC score available yet");
    } finally {
      setIsLoadingScore(false);
    }
  }, [kyc?.userId]);

  // Load KYC Score when component mounts
  useEffect(() => {
    if (kyc?.userId) {
      loadKycScore();
    }
  }, [kyc?.userId, loadKycScore]);

  const handleCalculateScore = async () => {
    if (!id) return;
    try {
      const score = await calculateKycScore.mutateAsync(Number(id));
      setKycScore(score);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRecalculateScore = async () => {
    if (!id) return;
    try {
      const score = await recalculateKycScore.mutateAsync(Number(id));
      setKycScore(score);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCheckDuplicates = async () => {
    if (!id) return;
    try {
      const result = await kycScoreService.checkDuplicates(Number(id));
      setDuplicateCheck(result);
      if (result.isDuplicate) {
        toast.error(`Duplicate detected: ${result.duplicateType}`, {
          description: `Found ${result.matches.length} matching record(s)`,
        });
      } else {
        toast.success("No duplicates found");
      }
    } catch (error) {
      toast.error("Failed to check for duplicates");
    }
  };

  const handleResolveFraudFlag = async (flagId: number) => {
    const note = window.prompt("Enter resolution note:");
    if (!note) return;
    try {
      await resolveFraudFlag.mutateAsync({ flagId, resolutionNote: note });
      loadKycScore();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleApprove = async () => {
    try {
      await reviewKyc.mutateAsync({
        id: Number(id),
        data: { action: "APPROVE" },
      });
      setShowApproveDialog(false);
      navigate("/admin/kyc");
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
      await reviewKyc.mutateAsync({
        id: Number(id),
        data: { action: "REJECT", rejectionReason },
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      navigate("/admin/kyc");
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

  if (!kyc) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">KYC profile not found</p>
            <Button asChild className="mt-4">
              <Link to="/admin/kyc">Back to KYC Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[kyc.status] || statusConfig.NOT_SUBMITTED;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-slate-800"
          >
            <Link to="/admin/kyc">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">KYC Review</h1>
            <p className="text-slate-400">Review KYC profile #{id}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {kycScore && (
            <KycRiskBadge
              riskLevel={kycScore.riskLevel as KycRiskLevel}
              size="lg"
            />
          )}
          <Badge
            variant={status.variant}
            className={`text-lg px-4 py-2 ${
              status.variant === "default"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : status.variant === "destructive"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : status.variant === "secondary"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : ""
            }`}
          >
            {status.label}
          </Badge>
          {kyc.status === "PENDING" && (
            <>
              <Button
                variant="default"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => setShowApproveDialog(true)}
                disabled={reviewKyc.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={reviewKyc.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KYC Score Summary Card */}
      {kycScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Score</p>
                  <p className="text-xl font-bold text-white">
                    {kycScore.totalScore}/1000
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Document Score</p>
                  <p className="text-xl font-bold text-white">
                    {kycScore.documentScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Profile Score</p>
                  <p className="text-xl font-bold text-white">
                    {kycScore.profileScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    kycScore.fraudFlagsCount > 0
                      ? "bg-red-500/20"
                      : "bg-emerald-500/20"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      kycScore.fraudFlagsCount > 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Fraud Flags</p>
                  <p
                    className={`text-xl font-bold ${
                      kycScore.fraudFlagsCount > 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {kycScore.fraudFlagsCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!kycScore ? (
          <Button
            onClick={handleCalculateScore}
            disabled={calculateKycScore.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Shield className="mr-2 h-4 w-4" />
            {calculateKycScore.isPending
              ? "Calculating..."
              : "Calculate KYC Score"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleRecalculateScore}
            disabled={recalculateKycScore.isPending}
            className="border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                recalculateKycScore.isPending ? "animate-spin" : ""
              }`}
            />
            Recalculate
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleCheckDuplicates}
          className="border-slate-700 hover:bg-slate-800"
        >
          <Search className="mr-2 h-4 w-4" />
          Check Duplicates
        </Button>
      </div>

      {/* Duplicate Warning */}
      {duplicateCheck?.isDuplicate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-400">Duplicate Detected!</h3>
              <p className="text-sm text-red-300 mt-1">
                Type: {duplicateCheck.duplicateType}
              </p>
              <p className="text-sm text-red-300">
                Matches: {duplicateCheck.matches.length} record(s) found
              </p>
              <div className="mt-2 space-y-1">
                {duplicateCheck.matches.map((match, idx) => (
                  <div key={idx} className="text-xs text-red-300/80">
                    • User #{match.matchedUserId} ({match.matchedUserEmail}) -
                    {match.matchType} ({match.similarityScore}% similarity)
                  </div>
                ))}
              </div>
              <p className="text-sm text-red-400 font-medium mt-2">
                Recommendation: {duplicateCheck.recommendation}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-slate-700"
          >
            User Info
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-slate-700"
          >
            Documents ({kyc.documents?.length || 0})
          </TabsTrigger>
          {kycScore && (
            <TabsTrigger
              value="score"
              className="data-[state=active]:bg-slate-700"
            >
              KYC Score
            </TabsTrigger>
          )}
          {kycScore && kycScore.fraudFlags?.length > 0 && (
            <TabsTrigger
              value="fraud"
              className="data-[state=active]:bg-slate-700"
            >
              Fraud Flags ({kycScore.fraudFlags.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-40 text-slate-400">
                        Full Name
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.fullName || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Date of Birth
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.dateOfBirth ? formatDate(kyc.dateOfBirth) : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Gender</TableHead>
                      <TableCell className="text-white">
                        {kyc.gender || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Occupation
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.occupation || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Monthly Income
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.monthlyIncome
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(kyc.monthlyIncome)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ID Card Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5" />
                  ID Card Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-40 text-slate-400">
                        ID Number
                      </TableHead>
                      <TableCell className="font-mono text-white">
                        {kyc.idCardNumber || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Issued Date
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.idCardIssuedDate
                          ? formatDate(kyc.idCardIssuedDate)
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Expiry Date
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.idCardExpiryDate
                          ? formatDate(kyc.idCardExpiryDate)
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Issued Place
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.idCardIssuedPlace || "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-40 text-slate-400">
                        Address
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.address || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">City</TableHead>
                      <TableCell className="text-white">
                        {kyc.city || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">District</TableHead>
                      <TableCell className="text-white">
                        {kyc.district || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Ward</TableHead>
                      <TableCell className="text-white">
                        {kyc.ward || "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building className="h-5 w-5" />
                  Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-40 text-slate-400">
                        Bank Name
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.bankName || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Account Number
                      </TableHead>
                      <TableCell className="font-mono text-white">
                        {kyc.bankAccountNumber || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Account Holder
                      </TableHead>
                      <TableCell className="text-white">
                        {kyc.bankAccountHolder || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Branch</TableHead>
                      <TableCell className="text-white">
                        {kyc.bankBranch || "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Review Information */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Review Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="border-slate-800">
                    <TableHead className="w-40 text-slate-400">
                      Submitted At
                    </TableHead>
                    <TableCell className="text-white">
                      {kyc.submittedAt ? formatDate(kyc.submittedAt) : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">
                      Reviewed At
                    </TableHead>
                    <TableCell className="text-white">
                      {kyc.reviewedAt ? formatDate(kyc.reviewedAt) : "-"}
                    </TableCell>
                  </TableRow>
                  {kyc.rejectionReason && (
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">
                        Rejection Reason
                      </TableHead>
                      <TableCell className="text-red-400">
                        {kyc.rejectionReason}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          {/* Documents */}
          {kyc.documents && kyc.documents.length > 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {kyc.documents.length} document(s) uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {kyc.documents.map((doc: any) => {
                    const fileUrl = doc.fileUrl?.startsWith("http")
                      ? doc.fileUrl
                      : `http://localhost:8080${doc.fileUrl}`;
                    const isImage =
                      doc.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ||
                      doc.documentType === "ID_CARD_FRONT" ||
                      doc.documentType === "ID_CARD_BACK" ||
                      doc.documentType === "SELFIE";

                    return (
                      <div
                        key={doc.id}
                        className="border border-slate-700 rounded-lg p-4 space-y-3 bg-slate-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="border-slate-600 text-slate-300"
                          >
                            {doc.documentType?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {isImage && fileUrl ? (
                          <div className="space-y-2">
                            <img
                              src={fileUrl}
                              alt={doc.documentType}
                              className="w-full h-32 object-contain rounded border border-slate-700 bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                            <p className="text-xs text-slate-500 truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-32 bg-slate-900 rounded flex items-center justify-center">
                              <FileText className="h-8 w-8 text-slate-600" />
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        )}

                        {fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-slate-700 hover:bg-slate-700"
                            onClick={() => window.open(fileUrl, "_blank")}
                          >
                            {isImage ? "View Image" : "View Document"}
                          </Button>
                        )}

                        {doc.fileSize && (
                          <p className="text-xs text-slate-500 text-center">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No documents uploaded</p>
            </div>
          )}
        </TabsContent>

        {/* KYC Score Tab */}
        {kycScore && (
          <TabsContent value="score">
            <KycScoreCard
              score={kycScore}
              showDetails={true}
              onRecalculate={handleRecalculateScore}
            />
          </TabsContent>
        )}

        {/* Fraud Flags Tab */}
        {kycScore && kycScore.fraudFlags?.length > 0 && (
          <TabsContent value="fraud">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  Fraud Flags
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {kycScore.fraudFlags.length} flag(s) detected -
                  {kycScore.criticalFlagsCount} critical
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FraudFlagsList
                  flags={kycScore.fraudFlags}
                  showActions={true}
                  onResolve={handleResolveFraudFlag}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Approve KYC</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to approve this KYC profile? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              className="border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={handleApprove}
              disabled={reviewKyc.isPending}
            >
              {reviewKyc.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reject KYC</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for rejecting this KYC profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-slate-300">Rejection Reason</Label>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewKyc.isPending}
            >
              {reviewKyc.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
