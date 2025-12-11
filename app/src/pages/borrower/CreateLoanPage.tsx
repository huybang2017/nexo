import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calculator,
  Clock,
  Percent,
  DollarSign,
  ChevronLeft,
  Loader2,
  Info,
  Upload,
  File,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateLoan, useUploadLoanDocument } from "@/hooks/useLoan";
import { useMyCreditScore } from "@/hooks/useCreditScore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  cn,
  formatCurrency,
  calculateLoanMonthlyPayment,
  calculateTotalInterest,
} from "@/lib/utils";
import type { LoanPurpose } from "@/types";

// Dynamic loan schema based on maxLoanAmount and interest rate range
const createLoanSchema = (
  maxAmount: number,
  minRate: number,
  maxRate: number
) =>
  z.object({
    title: z
      .string()
      .min(10, "Title must be at least 10 characters")
      .max(200, "Title must be less than 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be less than 2000 characters")
      .optional(),
    purpose: z.enum(
      [
        "PERSONAL",
        "BUSINESS",
        "EDUCATION",
        "MEDICAL",
        "HOME_IMPROVEMENT",
        "DEBT_CONSOLIDATION",
        "STARTUP",
        "OTHER",
      ],
      {
        errorMap: () => ({ message: "Please select a loan purpose" }),
      }
    ),
    amount: z
      .number({
        required_error: "Loan amount is required",
        invalid_type_error: "Loan amount must be a number",
      })
      .min(1000000, "Minimum loan amount is ₫1,000,000")
      .max(
        maxAmount,
        `Maximum loan amount is ${maxAmount.toLocaleString(
          "vi-VN"
        )} ₫ based on your credit score`
      ),
    termMonths: z
      .number({
        required_error: "Loan term is required",
        invalid_type_error: "Loan term must be a number",
      })
      .min(3, "Minimum term is 3 months")
      .max(36, "Maximum term is 36 months"),
    interestRate: z
      .number({
        required_error: "Interest rate is required",
        invalid_type_error: "Interest rate must be a number",
      })
      .min(minRate, `Minimum interest rate is ${minRate}%`)
      .max(
        maxRate,
        `Maximum interest rate is ${maxRate}% based on your credit score`
      ),
  });

type LoanFormData = z.infer<ReturnType<typeof createLoanSchema>>;

const purposeOptions: { value: LoanPurpose; label: string; icon: string }[] = [
  { value: "PERSONAL", label: "Personal", icon: "👤" },
  { value: "BUSINESS", label: "Business", icon: "🏢" },
  { value: "EDUCATION", label: "Education", icon: "📚" },
  { value: "MEDICAL", label: "Medical", icon: "🏥" },
  { value: "HOME_IMPROVEMENT", label: "Home Improvement", icon: "🏠" },
  { value: "DEBT_CONSOLIDATION", label: "Debt Consolidation", icon: "💳" },
  { value: "STARTUP", label: "Startup", icon: "🚀" },
  { value: "OTHER", label: "Other", icon: "📝" },
];

const termOptions = [3, 6, 9, 12, 18, 24, 36];

export const CreateLoanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createLoan = useCreateLoan();
  const uploadDocument = useUploadLoanDocument();
  const { data: creditScore } = useMyCreditScore();
  const [amount, setAmount] = useState(10000000);
  const [term, setTerm] = useState(12);
  const [documents, setDocuments] = useState<
    Array<{ file: File; type: string; description?: string }>
  >([]);

  // Get max loan amount from credit score, default to 500M if not available
  const maxLoanAmount = creditScore?.maxLoanAmount
    ? Number(creditScore.maxLoanAmount)
    : 500000000;
  const minLoanAmount = 1000000; // 1M VND

  // Interest rate range based on credit score (tuân thủ pháp luật VN - tối đa 20%/năm)
  const minInterestRate = creditScore ? Number(creditScore.minInterestRate) : 8;
  const maxInterestRate = creditScore
    ? Number(creditScore.maxInterestRate)
    : 20;
  const defaultInterestRate = creditScore
    ? (creditScore.minInterestRate + creditScore.maxInterestRate) / 2
    : user?.creditScore
    ? Math.max(8, 20 - user.creditScore / 100)
    : 15;

  const loanSchema = createLoanSchema(
    maxLoanAmount,
    minInterestRate,
    maxInterestRate
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      amount: Math.min(10000000, maxLoanAmount),
      termMonths: 12,
      purpose: "PERSONAL",
      interestRate: defaultInterestRate,
    },
  });

  const rawAmount = watch("amount", amount);
  const watchAmount = Math.min(rawAmount, maxLoanAmount);
  const watchTerm = watch("termMonths", term);
  const watchInterestRate = watch("interestRate", defaultInterestRate);

  // Update interest rate default when credit score is loaded
  useEffect(() => {
    if (creditScore) {
      const initialRate =
        (creditScore.minInterestRate + creditScore.maxInterestRate) / 2;
      setValue("interestRate", initialRate, { shouldValidate: false });
    }
  }, [creditScore, setValue]);

  // Ensure amount doesn't exceed maxLoanAmount
  useEffect(() => {
    if (rawAmount > maxLoanAmount) {
      const clampedValue = maxLoanAmount;
      setAmount(clampedValue);
      setValue("amount", clampedValue, { shouldValidate: true });
    }
  }, [rawAmount, maxLoanAmount, setValue]);

  const monthlyPayment = calculateLoanMonthlyPayment(
    watchAmount,
    watchInterestRate,
    watchTerm
  );
  const totalInterest = calculateTotalInterest(
    watchAmount,
    watchInterestRate,
    watchTerm
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDocs: Array<{ file: File; type: string; description?: string }> =
        [];
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      Array.from(files).forEach((file) => {
        // Check file size (max 50MB)
        if (file.size > MAX_FILE_SIZE) {
          alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
          return;
        }
        // Check file type
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type)) {
          alert(
            `File "${file.name}" is not allowed. Only PDF, JPEG, PNG files are allowed.`
          );
          return;
        }
        newDocs.push({ file, type, description: "" });
      });

      if (newDocs.length > 0) {
        setDocuments([...documents, ...newDocs]);
      }

      // Reset input để có thể chọn lại cùng file
      e.target.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: LoanFormData) => {
    // Validate max loan amount before submitting
    if (creditScore && data.amount > maxLoanAmount) {
      return; // Validation error will be shown
    }

    if (creditScore && !creditScore.isEligibleForLoan) {
      return; // Not eligible
    }

    try {
      // Create loan first
      const loan = await createLoan.mutateAsync(data);

      // Upload documents if any
      if (documents.length > 0) {
        await Promise.all(
          documents.map((doc) =>
            uploadDocument.mutateAsync({
              loanId: loan.id,
              file: doc.file,
              documentType: doc.type,
              description: doc.description,
            })
          )
        );
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-white">Apply for a Loan</h1>
          <p className="text-slate-400">
            Fill in the details to submit your loan application
          </p>
        </div>
      </div>

      {/* KYC Warning */}
      {user?.kycStatus !== "APPROVED" && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="flex items-center gap-4 p-4">
            <Info className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-amber-200 font-medium">
                KYC verification required
              </p>
              <p className="text-amber-300/70 text-sm">
                You need to complete KYC verification before applying for a
                loan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
              onClick={() => navigate("/dashboard/kyc")}
            >
              Complete KYC
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Loan Details
              </CardTitle>
              <CardDescription>
                Provide the details of your loan request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Loan Title *</Label>
                  <Input
                    placeholder="e.g., Business expansion loan for my coffee shop"
                    {...register("title")}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Purpose *</Label>
                  <Select
                    defaultValue="PERSONAL"
                    onValueChange={(v) => setValue("purpose", v as LoanPurpose)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {purposeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Loan Amount *</Label>
                    <span className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(watchAmount)}
                    </span>
                  </div>
                  <Slider
                    min={minLoanAmount}
                    max={maxLoanAmount}
                    step={1000000}
                    value={[Math.min(watchAmount, maxLoanAmount)]}
                    onValueChange={([v]) => {
                      const clampedValue = Math.min(v, maxLoanAmount);
                      setAmount(clampedValue);
                      setValue("amount", clampedValue);
                    }}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>₫1M</span>
                    <span>{formatCurrency(maxLoanAmount)}</span>
                  </div>
                  {creditScore && !creditScore.isEligibleForLoan && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        {creditScore.eligibilityReason ||
                          "You are not eligible for a loan at this time."}
                      </p>
                    </div>
                  )}
                  {creditScore &&
                    creditScore.isEligibleForLoan &&
                    watchAmount > maxLoanAmount && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-400">
                          Maximum loan amount based on your credit score:{" "}
                          {formatCurrency(maxLoanAmount)}
                        </p>
                      </div>
                    )}
                  {errors.amount && (
                    <p className="text-sm text-red-400">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Term */}
                <div className="space-y-4">
                  <Label className="text-slate-300">Loan Term *</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {termOptions.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant="outline"
                        className={cn(
                          "border-slate-700",
                          watchTerm === t
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "hover:bg-slate-800"
                        )}
                        onClick={() => {
                          setTerm(t);
                          setValue("termMonths", t);
                        }}
                      >
                        {t}m
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Interest Rate *</Label>
                    <span className="text-2xl font-bold text-emerald-400">
                      {watchInterestRate.toFixed(2)}%
                    </span>
                  </div>
                  {creditScore ? (
                    <>
                      <Slider
                        min={minInterestRate}
                        max={maxInterestRate}
                        step={0.1}
                        value={[watchInterestRate]}
                        onValueChange={([v]) => {
                          const clampedValue = Math.max(
                            minInterestRate,
                            Math.min(maxInterestRate, v)
                          );
                          setValue("interestRate", clampedValue, {
                            shouldValidate: true,
                          });
                        }}
                        className="py-4"
                      />
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>{minInterestRate}%</span>
                        <span className="text-slate-400">
                          Based on your credit score
                        </span>
                        <span>{maxInterestRate}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-400">
                        Loading credit score information...
                      </p>
                    </div>
                  )}
                  {errors.interestRate && (
                    <p className="text-sm text-red-400">
                      {errors.interestRate.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder="Provide additional details about your loan purpose..."
                    {...register("description")}
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  />
                </div>

                {/* Loan Documents */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">
                      Supporting Documents (Optional)
                    </Label>
                    <span className="text-xs text-slate-500">
                      Max 50MB per file • Multiple files allowed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* ID Card */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">
                        ID Card / Passport
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleFileChange(e, "ID_CARD")}
                          className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        You can select multiple files
                      </p>
                    </div>

                    {/* Income Proof */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">
                        Income Proof (Salary Slip, Bank Statement)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleFileChange(e, "INCOME_PROOF")}
                          className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        You can select multiple files
                      </p>
                    </div>

                    {/* Other Documents */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">
                        Other Documents (Business License, etc.)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleFileChange(e, "OTHER")}
                          className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        You can select multiple files
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {documents.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-300">
                          Uploaded Documents ({documents.length})
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocuments([])}
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                  {doc.file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                                  • {doc.type.replace(/_/g, " ")}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={
                    createLoan.isPending ||
                    uploadDocument.isPending ||
                    user?.kycStatus !== "APPROVED" ||
                    (creditScore && !creditScore.isEligibleForLoan) ||
                    watchAmount > maxLoanAmount
                  }
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoan.isPending || uploadDocument.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {uploadDocument.isPending
                        ? "Uploading documents..."
                        : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Submit Loan Application
                    </>
                  )}
                </Button>
                {creditScore && !creditScore.isEligibleForLoan && (
                  <p className="text-sm text-red-400 text-center mt-2">
                    {creditScore.eligibilityReason ||
                      "You are not eligible for a loan. Please improve your credit score."}
                  </p>
                )}
                {watchAmount > maxLoanAmount && (
                  <p className="text-sm text-amber-400 text-center mt-2">
                    Loan amount exceeds your maximum limit of{" "}
                    {formatCurrency(maxLoanAmount)}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Loan Calculator */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-cyan-400" />
                Loan Calculator
              </CardTitle>
              <CardDescription>Estimated repayment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Loan Amount
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(watchAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Interest Rate
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {watchInterestRate.toFixed(2)}% p.a.
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Term
                  </span>
                  <span className="text-white font-medium">
                    {watchTerm} months
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Payment</span>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(monthlyPayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Interest</span>
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(totalInterest)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Repayment</span>
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(watchAmount + totalInterest)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                * Interest rate is selected within the range allowed by your
                credit score.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateLoanPage;
