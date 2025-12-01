import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthTokens } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const OAuth2RedirectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing login...');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      // Prevent multiple calls
      if (hasProcessed) {
        return;
      }
      setHasProcessed(true);
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh') || searchParams.get('refreshToken');
      const error = searchParams.get('error');

      console.log('OAuth2 Redirect params:', { token: token?.slice(0, 20) + '...', refreshToken, error });

      if (error) {
        setStatus('error');
        setMessage(error);
        toast.error(error);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!token || !refreshToken) {
        setStatus('error');
        setMessage('Invalid OAuth2 response - missing tokens');
        toast.error('Invalid OAuth2 response');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Set tokens first
        console.log('Setting auth tokens...');
        setAuthTokens(token, refreshToken);
        setMessage('Fetching user info...');
        
        // Fetch user info
        console.log('Refreshing user...');
        await refreshUser();
        
        setStatus('success');
        setMessage('Login successful! Redirecting...');
        toast.success('Login with Google successful!');
        
        // Small delay for better UX
        setTimeout(() => {
          // Navigate based on role (user will be set after refreshUser)
          const storedToken = localStorage.getItem('accessToken');
          if (storedToken) {
            // Decode JWT to get role
            try {
              const payload = JSON.parse(atob(storedToken.split('.')[1]));
              const role = payload.role;
              console.log('User role:', role);
              
              if (role === 'ADMIN') {
                navigate('/admin');
              } else if (role === 'LENDER') {
                navigate('/dashboard');
              } else {
                navigate('/dashboard');
              }
            } catch (e) {
              console.error('Error decoding token:', e);
              navigate('/');
            }
          } else {
            navigate('/');
          }
        }, 1000);
        
      } catch (err: any) {
        console.error('OAuth2 redirect error:', err);
        setStatus('error');
        setMessage(err?.response?.data?.message || err?.message || 'Failed to complete login');
        toast.error('Failed to complete login');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleOAuth2Redirect();
  }, [searchParams]); // Only depend on searchParams (token changes)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-emerald-400 text-lg font-medium">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 text-lg font-medium">{message}</p>
            <p className="text-slate-500 mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuth2RedirectPage;
