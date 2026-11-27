import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Building2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { BusinessType } from '../../types/api';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('PRIVATE_LIMITED');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, updateBusinessName } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await authApi.signup({
        name,
        email,
        password,
        businessName,
        businessType,
      });

                                             
      const loginRes = await authApi.login({ email, password });
      updateBusinessName(businessName);
      login(loginRes, email);
      showToast('Registration successful! Please complete KYC.', 'success');
      navigate('/onboarding/kyc');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.errorDescription ||
          'Failed to complete registration. Email may already be in use.'
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
          Register Merchant Account
        </h2>
        <p className="mt-1 text-xs text-mantu-muted">
          Start accepting cards, UPI and NetBanking on Mantu Gateway
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-mantu-border rounded-lg sm:px-8">
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Authorized Signatory Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <User className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Business Work Email
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
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <Lock className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Registered Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Private Limited"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent font-sans"
                />
                <Building2 className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Legal Entity Structure
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent bg-white"
              >
                <option value="PRIVATE_LIMITED">Private Limited Company</option>
                <option value="PUBLIC_LIMITED">Public Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                <option value="PARTNERSHIP">Partnership Firm</option>
                <option value="INDIVIDUAL">Individual Freelancer / Creator</option>
                <option value="TRUST">Trust</option>
                <option value="SOCIETY">Society</option>
              </select>
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
                Create Merchant Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-mantu-border text-center">
            <p className="text-xs text-mantu-muted">
              Already registered?{' '}
              <Link to="/login" className="text-mantu-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-mantu-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>RBI Compliant Onboarding • Automated Escrow Settlements</span>
        </div>
      </div>
    </div>
  );
};
