import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail.trim()) {
      setForgotSubmitted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await authApi.login({ email, password });
      login(res, email);
      showToast('Logged in successfully', 'success');

      if (!res.onboardingComplete || res.merchantStatus === 'PENDING_KYC') {
        navigate('/onboarding/kyc');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.errorDescription ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mantu-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded bg-mantu-accent flex items-center justify-center text-white font-bold text-xl mx-auto shadow-sm">
          M
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-mantu-text">
          Sign In to Mantu Gateway
        </h2>
        <p className="mt-1 text-xs text-mantu-muted">
          Enterprise merchant portal & payment gateway console
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-mantu-border rounded-lg sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <Mail className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-mantu-text">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotEmail(email);
                    setForgotSubmitted(false);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] text-mantu-accent hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <Lock className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Dashboard
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-mantu-border text-center">
            <p className="text-xs text-mantu-muted">
              Don't have a merchant account?{' '}
              <Link to="/signup" className="text-mantu-accent font-semibold hover:underline">
                Register company
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-mantu-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured with 256-Bit TLS & Bi-directional MTLS</span>
        </div>
      </div>

      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        description="Enter your registered merchant email to receive password reset instructions"
        maxWidth="md"
      >
        {forgotSubmitted ? (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">Reset instructions sent</p>
                <p className="mt-0.5">If this email is registered, you’ll receive reset instructions.</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <Mail className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
