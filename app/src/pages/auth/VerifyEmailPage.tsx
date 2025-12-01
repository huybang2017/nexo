import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { emailService } from '@/services/password.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('no-token');
        return;
      }

      // Prevent multiple calls
      if (hasVerified) {
        return;
      }
      setHasVerified(true);

      try {
        await emailService.verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');
        
        // Refresh user data to update email verification status
        if (user) {
          await refreshUser();
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Failed to verify email');
        toast.error('Email verification failed');
      }
    };

    verifyEmail();
  }, [token]); // Only depend on token

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await emailService.resendVerificationEmail();
      toast.success('Verification email sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Verifying your email...</p>
            <p className="text-slate-500 mt-2">Please wait a moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Email Verified!</CardTitle>
          <CardDescription className="text-slate-400">
            Your email address has been successfully verified. You now have full access to all features.
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-col gap-3">
          {user ? (
            <Button
              onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
            >
              Go to Dashboard
            </Button>
          ) : (
            <Link to="/login" className="w-full">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                Go to Login
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Verification Failed</CardTitle>
          <CardDescription className="text-slate-400">
            {errorMessage || 'The verification link is invalid or has expired.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-slate-400 text-sm">
            Need a new verification email? Click the button below to receive a new link.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {user && (
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          )}
          <Link to="/login" className="w-full">
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // No token provided
  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-10 h-10 text-amber-500" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">Email Verification</CardTitle>
        <CardDescription className="text-slate-400">
          {user && !user.emailVerified
            ? "Your email address hasn't been verified yet. Check your inbox for the verification link."
            : 'Please use the verification link sent to your email address.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center">
        {user && !user.emailVerified && (
          <p className="text-slate-400 text-sm">
            Didn't receive the email? Check your spam folder or request a new verification email.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {user && !user.emailVerified && (
          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            {isResending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Verification Email
              </>
            )}
          </Button>
        )}
        <Link to={user ? '/' : '/login'} className="w-full">
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {user ? 'Back to Dashboard' : 'Back to Login'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default VerifyEmailPage;

