import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Upload, 
  User, 
  CreditCard, 
  Building, 
  FileText,
  AlertCircle,
  Mail,
  Loader2
} from 'lucide-react';
import { emailService } from '@/services/password.service';
import { useSubmitKyc, useUploadKycDocument, useMyKyc } from '@/hooks/useKyc';
import { toast } from 'sonner';

const kycSteps = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'identity', title: 'Identity Card', icon: CreditCard },
  { id: 'bank', title: 'Bank Account', icon: Building },
  { id: 'documents', title: 'Documents', icon: FileText },
];

export default function KYCPage() {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const { data: kycProfile } = useMyKyc();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    idCardNumber: '',
    idCardIssuedDate: '',
    idCardExpiryDate: '',
    idCardIssuedPlace: '',
    address: '',
    city: '',
    district: '',
    occupation: '',
    monthlyIncome: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });

  const kycStatus = user?.kycStatus || 'NOT_SUBMITTED';

  const handleResendEmail = async () => {
    setIsResendingEmail(true);
    try {
      await emailService.resendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Check if email is verified
  if (!user?.emailVerified) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-amber-500">Email Verification Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to verify your email address before submitting KYC.
              <br />
              Check your inbox for the verification email.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleResendEmail}
                disabled={isResendingEmail}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isResendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                onClick={() => refreshUser()}
                variant="outline"
              >
                I've Verified
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">KYC Verified</h2>
            <p className="text-muted-foreground mb-4">
              Your identity has been verified. You have full access to all features.
            </p>
            <Badge variant="outline" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified on {new Date().toLocaleDateString()}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">KYC Under Review</h2>
            <p className="text-muted-foreground mb-4">
              Your documents are being reviewed. This usually takes 24-48 hours.
            </p>
            <Badge variant="secondary" className="gap-2">
              <Clock className="h-4 w-4" />
              Submitted for review
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-destructive">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">KYC Rejected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your KYC verification was rejected. Please review the feedback and resubmit.
                </p>
                {kycProfile?.rejectionReason && (
                  <p className="text-sm mt-2 p-2 bg-destructive/5 rounded">
                    Reason: {kycProfile.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <KYCForm
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
          refreshUser={refreshUser}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">Complete your identity verification to access all features</p>
      </div>

      <KYCForm
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        formData={formData}
        setFormData={setFormData}
        refreshUser={refreshUser}
      />
    </div>
  );
}

function KYCForm({ currentStep, setCurrentStep, formData, setFormData, refreshUser }: any) {
  const progress = ((currentStep + 1) / kycSteps.length) * 100;
  const [documents, setDocuments] = useState<{
    idCardFront?: File;
    idCardBack?: File;
    selfie?: File;
  }>({});
  const [previews, setPreviews] = useState<{
    idCardFront?: string;
    idCardBack?: string;
    selfie?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitKyc = useSubmitKyc();
  const uploadDocument = useUploadKycDocument();

  const handleFileSelect = (type: 'idCardFront' | 'idCardBack' | 'selfie') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size must be less than 5MB');
          return;
        }
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          toast.error('Only JPG, PNG, and PDF files are allowed');
          return;
        }
        setDocuments({ ...documents, [type]: file });
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews({ ...previews, [type]: e.target?.result as string });
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews({ ...previews, [type]: undefined });
        }
        
        toast.success(`${type === 'idCardFront' ? 'ID Card Front' : type === 'idCardBack' ? 'ID Card Back' : 'Selfie'} uploaded successfully`);
      }
    };
    input.click();
  };

  const handleSubmitKyc = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender) {
      toast.error('Please complete all personal information');
      return;
    }
    if (!formData.idCardNumber || !formData.idCardIssuedDate || !formData.idCardIssuedPlace) {
      toast.error('Please complete all ID card information');
      return;
    }
    if (!formData.address || !formData.city) {
      toast.error('Please complete address information');
      return;
    }
    if (!formData.bankName || !formData.bankAccountNumber || !formData.bankAccountHolder) {
      toast.error('Please complete bank account information');
      return;
    }
    if (!documents.idCardFront || !documents.idCardBack || !documents.selfie) {
      toast.error('Please upload all required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit KYC profile first (backend requires this before uploading documents)
      toast.info('Submitting KYC information...');
      await submitKyc.mutateAsync({
        idCardNumber: formData.idCardNumber,
        idCardIssuedDate: formData.idCardIssuedDate,
        idCardIssuedPlace: formData.idCardIssuedPlace,
        idCardExpiryDate: formData.idCardExpiryDate || undefined,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        district: formData.district || undefined,
        occupation: formData.occupation || undefined,
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountHolder: formData.bankAccountHolder,
      });

      // Upload documents after KYC profile is submitted
      toast.info('Uploading documents...');
      await Promise.all([
        uploadDocument.mutateAsync({ file: documents.idCardFront!, documentType: 'ID_CARD_FRONT' }),
        uploadDocument.mutateAsync({ file: documents.idCardBack!, documentType: 'ID_CARD_BACK' }),
        uploadDocument.mutateAsync({ file: documents.selfie!, documentType: 'SELFIE' }),
      ]);

      toast.success('KYC submitted successfully! Your documents are under review.');
      // Refresh user data to update KYC status
      if (refreshUser) {
        await refreshUser();
      }
      // Reload page to show "Under Review" status
      window.location.reload();
    } catch (error: any) {
      console.error('KYC submission error:', error);
      // Error is already handled by mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Step {currentStep + 1} of {kycSteps.length}</CardTitle>
            <CardDescription>{kycSteps[currentStep].title}</CardDescription>
          </div>
          <Badge variant="outline">{progress.toFixed(0)}% Complete</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent>
        {/* Step indicators */}
        <div className="flex justify-between mb-8">
          {kycSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-2 ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name (as on ID)</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nguyen Van A"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Nguyen Hue, District 1"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ho Chi Minh City"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Income (VND)</Label>
                <Input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  placeholder="20000000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Identity Card */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Card Number (CCCD)</Label>
                <Input
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                  placeholder="012345678901"
                />
              </div>
              <div className="space-y-2">
                <Label>Issued Place</Label>
                <Input
                  value={formData.idCardIssuedPlace}
                  onChange={(e) => setFormData({ ...formData, idCardIssuedPlace: e.target.value })}
                  placeholder="Cục Cảnh sát QLHC về TTXH"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issued Date</Label>
                <Input
                  type="date"
                  value={formData.idCardIssuedDate}
                  onChange={(e) => setFormData({ ...formData, idCardIssuedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.idCardExpiryDate}
                  onChange={(e) => setFormData({ ...formData, idCardExpiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Bank Account */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vietcombank">Vietcombank</SelectItem>
                  <SelectItem value="techcombank">Techcombank</SelectItem>
                  <SelectItem value="vietinbank">Vietinbank</SelectItem>
                  <SelectItem value="bidv">BIDV</SelectItem>
                  <SelectItem value="mbbank">MB Bank</SelectItem>
                  <SelectItem value="vpbank">VPBank</SelectItem>
                  <SelectItem value="acb">ACB</SelectItem>
                  <SelectItem value="tpbank">TPBank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input
                value={formData.bankAccountHolder}
                onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                placeholder="NGUYEN VAN A"
              />
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Document Requirements</p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                    <li>Files must be clear and readable</li>
                    <li>Accepted formats: JPG, PNG, PDF</li>
                    <li>Maximum file size: 5MB each</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleFileSelect('idCardFront')}
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative"
              >
                {documents.idCardFront ? (
                  <div className="space-y-2">
                    {previews.idCardFront ? (
                      <img
                        src={previews.idCardFront}
                        alt="ID Card Front"
                        className="w-full h-32 object-contain rounded mb-2"
                      />
                    ) : (
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    )}
                    <p className="font-medium text-sm truncate">{documents.idCardFront.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(documents.idCardFront.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocuments({ ...documents, idCardFront: undefined });
                        setPreviews({ ...previews, idCardFront: undefined });
                      }}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">ID Card Front</p>
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </>
                )}
              </div>
              <div
                onClick={() => handleFileSelect('idCardBack')}
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative"
              >
                {documents.idCardBack ? (
                  <div className="space-y-2">
                    {previews.idCardBack ? (
                      <img
                        src={previews.idCardBack}
                        alt="ID Card Back"
                        className="w-full h-32 object-contain rounded mb-2"
                      />
                    ) : (
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    )}
                    <p className="font-medium text-sm truncate">{documents.idCardBack.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(documents.idCardBack.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocuments({ ...documents, idCardBack: undefined });
                        setPreviews({ ...previews, idCardBack: undefined });
                      }}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">ID Card Back</p>
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </>
                )}
              </div>
            </div>

            <div
              onClick={() => handleFileSelect('selfie')}
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative"
            >
              {documents.selfie ? (
                <div className="space-y-2">
                  {previews.selfie ? (
                    <img
                      src={previews.selfie}
                      alt="Selfie with ID Card"
                      className="w-full h-32 object-contain rounded mb-2"
                    />
                  ) : (
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                  )}
                  <p className="font-medium text-sm truncate">{documents.selfie.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(documents.selfie.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocuments({ ...documents, selfie: undefined });
                      setPreviews({ ...previews, selfie: undefined });
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Selfie with ID Card</p>
                  <p className="text-sm text-muted-foreground">Take a selfie holding your ID card</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          {currentStep < kycSteps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleSubmitKyc}
              disabled={isSubmitting || !documents.idCardFront || !documents.idCardBack || !documents.selfie}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit KYC'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


