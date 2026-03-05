import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically exchanges the token from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMessage(error.message);
          setStatus('error');
          return;
        }

        if (data.session) {
          setStatus('success');
          // Redirect to home after a short delay
          setTimeout(() => navigate('/', { replace: true }), 2000);
        } else {
          // No session means the token exchange might still be in progress
          // Listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setStatus('success');
              setTimeout(() => navigate('/', { replace: true }), 2000);
              subscription.unsubscribe();
            }
          });

          // Timeout fallback
          setTimeout(() => {
            setStatus((prev) => {
              if (prev === 'loading') {
                subscription.unsubscribe();
                return 'error';
              }
              return prev;
            });
            setErrorMessage('Verification timed out. Please try again.');
          }, 10000);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email</h1>
            <p className="text-muted-foreground">Please wait while we confirm your account…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Email verified!</h1>
            <p className="text-muted-foreground mb-6">Your account has been confirmed. Redirecting you now…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification failed</h1>
            <p className="text-muted-foreground mb-6">{errorMessage || 'The link may have expired or is invalid.'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/login')}>Back to login</Button>
              <Button onClick={() => navigate('/signup')}>Sign up again</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
