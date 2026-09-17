import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, LogOut, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { resolveEmailForAuth } from '../../auth';

export default function LoginScreen({ isAccessDenied, onSignOut }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      const resolvedEmail = resolveEmailForAuth(email);
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please verify your Studio Tunnel credentials.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectEmail = (selectedEmail) => {
    setEmail(selectedEmail);
    setError(null);
  };

  if (isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4 text-[#f0f0ff] font-sans">
        <div className="bg-[#121224] border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Shield size={32} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">Access Restricted</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The Cineloom Comptroller contains sensitive studio financial ledgers, GST filings, and cashflow accounts. Access is strictly limited to authorized financial personnel (Yash, Samiran, Line Producer, and Accounts).
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <LogOut size={14} />
              <span>Sign Out & Try Another Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4 text-[#f0f0ff] font-sans">
      <div className="bg-[#111122] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center mx-auto font-black text-lg shadow-lg">
            CP
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Cineloom Comptroller</h1>
          <p className="text-xs text-slate-400">
            Studio Tunnel — Financial Ledger & Accounting Command
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="samiran@studiotunnel.com"
                className="w-full bg-[#18182e] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
              />
            </div>

            {/* Quick Email Selection Hints */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: 'Samiran (COO)', email: 'samiran@studiotunnel.com' },
                { label: 'Yash (CEO)', email: 'yash@studiotunnel.com' },
                { label: 'Altamash (LP)', email: 'tamash@studiotunnel.com' },
                { label: 'Prakash (LP)', email: 'prakash@studiotunnel.com' }
              ].map(item => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => handleQuickSelectEmail(item.email)}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-purple-300 text-[10px] transition-colors border border-white/5"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#18182e] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? <span>Authenticating...</span> : (
              <>
                <span>Sign In to Comptroller</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-slate-500">
            🔒 In-Memory Security: Password required on every visit. No persistent sessions saved.
          </p>
        </div>
      </div>
    </div>
  );
}
