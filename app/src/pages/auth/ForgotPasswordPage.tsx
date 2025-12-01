import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { passwordService } from '@/services/password.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await passwordService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
          <CardDescription className="text-slate-400">
            We've sent a password reset link to
          </CardDescription>
          <p className="text-emerald-400 font-medium">{submittedEmail}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            Didn't receive the email? Check your spam folder or try again with a different email address.
          </p>
          
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => setIsSubmitted(false)}
          >
            Try a different email
          </Button>
        </CardContent>

        <CardFooter>
          <Link to="/login" className="w-full">
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Forgot password?</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-12"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <Link to="/login" className="w-full">
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ForgotPasswordPage;

