import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
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

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch: refetchWallet } = useWallet();
  const [isProcessing, setIsProcessing] = useState(true);
  
  const code = searchParams.get('code');
  const status = searchParams.get('status');

  useEffect(() => {
    const processResult = async () => {
      if (!code || !status) {
        setIsProcessing(false);
        return;
      }

      // Wait a bit for backend to process payment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh wallet data
      try {
        await refetchWallet();
        toast.success('Wallet updated!');
      } catch (error) {
        console.error('Failed to refresh wallet:', error);
      }

      setIsProcessing(false);

      // Auto redirect to wallet after 3 seconds
      setTimeout(() => {
        navigate('/dashboard/wallet');
      }, 3000);
    };

    processResult();
  }, [code, status, refetchWallet, navigate, user]);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed' || status === 'cancel' || status === 'error';

  const handleGoToWallet = () => {
    navigate('/dashboard/wallet');
  };

  if (!code || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Invalid Payment Result</CardTitle>
            <CardDescription className="text-slate-400">
              Missing payment information
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoToWallet} className="w-full">
              Go to Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          {isProcessing ? (
            <>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <CardTitle className="text-white">Processing Payment...</CardTitle>
              <CardDescription className="text-slate-400">
                Please wait while we update your wallet
              </CardDescription>
            </>
          ) : isSuccess ? (
            <>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Payment Successful!</CardTitle>
              <CardDescription className="text-slate-400">
                Your deposit has been processed successfully
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-white">Payment Failed</CardTitle>
              <CardDescription className="text-slate-400">
                Your payment could not be processed
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {code && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Payment Code</p>
              <p className="text-white font-mono text-sm">{code}</p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-sm text-emerald-400">
                Your wallet balance has been updated. Redirecting to wallet page...
              </p>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">
                If you have any questions, please contact support.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleGoToWallet}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            size="lg"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Go to Wallet
          </Button>
          {!isProcessing && (
            <p className="text-xs text-slate-500 text-center">
              Redirecting automatically in a few seconds...
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentResultPage;

